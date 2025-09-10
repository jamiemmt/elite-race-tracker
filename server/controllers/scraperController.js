/**
 * Controller for managing the scraping process and storing results in the database
 */

const scrapers = require('../scrapers');
const Athlete = require('../models/Athlete');
const Race = require('../models/Race');


const Result = require('../models/Result');
const Record = require('../models/Record');

/**
 * Run a scraper and process the results
 * @param {string} source - Source to scrape from
 * @param {Object} options - Options for the scraper
 * @returns {Promise<Object>} - Summary of the scraping process
 */
exports.runScraper = async (req, res) => {
  const { source, options } = req.body;

  if (!source) {
    return res.status(400).json({ 
      success: false, 
      error: 'Source parameter is required' 
    });
  }

  try {
    // Check if the source exists
    const availableScrapers = scrapers.listScrapers();
    if (!availableScrapers.includes(source)) {
      return res.status(400).json({ 
        success: false, 
        error: `Scraper for source "${source}" not found. Available scrapers: ${availableScrapers.join(', ')}` 
      });
    }

    // Run the scraper
    const scrapeOptions = options || {};
    if (scrapeOptions.topN == null) {
      scrapeOptions.topN = parseInt(process.env.SCRAPER_TOP_N || '20', 10);
    }

    const results = await scrapers.scrapeResults(source, scrapeOptions);
    
    // Process and save the results (respecting topN per event)
    const summary = await processResults(results, source, scrapeOptions);
    
    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error(`Error running scraper for ${source}:`, error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Process and save scraper results to the database
 * @param {Array} results - Array of results from the scraper
 * @param {string} source - Source of the results
 * @returns {Promise<Object>} - Summary of the processing
 */
async function processResults(results, source, options = {}) {
  const topN = parseInt(options.topN || process.env.SCRAPER_TOP_N || '20', 10);
  const summary = {
    totalResults: results.length,
    processedResults: 0,
    newAthletes: 0,
    newRaces: 0,
    newResults: 0,
    updatedBanStatus: 0,
    limitedPerEvent: topN,
    errors: []
  };

  // Special handling for banned athletes list
  if (source === 'athleticsintegrity') {
    return await processBannedAthletes(results, summary);
  }

  // Limit results to topN per event (race) before processing
  try {
    const buckets = new Map();
    const keyOf = (r) => {
      const race = r.race || {};
      const dateStr = race.date ? new Date(race.date).toISOString().slice(0,10) : '';
      return [race.name || 'Unknown', dateStr, race.distance || 0, race.distanceUnit || 'm', race.gender || 'Mixed'].join('|');
    };
    for (const r of results) {
      const k = keyOf(r);
      if (!buckets.has(k)) buckets.set(k, []);
      buckets.get(k).push(r);
    }
    const limited = [];
    for (const [_k, arr] of buckets) {
      arr.sort((a, b) => {
        const pa = (a.result?.position ?? a.position ?? Infinity);
        const pb = (b.result?.position ?? b.position ?? Infinity);
        if (isFinite(pa) && isFinite(pb)) return pa - pb;
        const ta = (a.result?.time ?? a.finishTime ?? Infinity);
        const tb = (b.result?.time ?? b.finishTime ?? Infinity);
        return ta - tb;
      });
      limited.push(...arr.slice(0, Math.max(1, topN)));
    }
    results = limited;
  } catch (e) {
    console.warn('topN pre-processing failed, proceeding without limiting:', e.message);
  }

  // Process race results
  for (const result of results) {
    try {
      console.log('DEBUG: Full result object received from scraper:', JSON.stringify(result, null, 2));
      
      // Validate result has minimum required data
      if (!result.athlete || !result.race) {
        console.error('Skipping result due to missing athlete or race data:', JSON.stringify(result));
        summary.errors.push(`Missing athlete or race data: ${JSON.stringify(result)}`);
        continue;
      }

      // Process athlete
      let athlete;
      try {
        athlete = await findOrCreateAthlete(result.athlete);
        summary.newAthletes += athlete.isNew ? 1 : 0;
        console.log(`Successfully processed athlete: ${result.athlete.name}, id: ${athlete._id || athlete.id}`);
      } catch (athleteError) {
        console.error(`Failed to process athlete: ${JSON.stringify(result.athlete)}`, athleteError);
        summary.errors.push(`Failed to process athlete: ${JSON.stringify(result.athlete)}: ${athleteError.message}`);
        continue; // Skip to next result if athlete processing fails
      }

      // Process race
      let race;
      try {
        race = await findOrCreateRace(result.race);
        summary.newRaces += race.isNew ? 1 : 0;
        console.log(`Successfully processed race: ${result.race.name}, id: ${race._id || race.id}`);
      } catch (raceError) {
        console.error(`Failed to process race: ${JSON.stringify(result.race)}`, raceError);
        summary.errors.push(`Failed to process race: ${JSON.stringify(result.race)}: ${raceError.message}`);
        continue; // Skip to next result if race processing fails
      }

      // Extract time fields from nested result object or direct properties
      const finishTime = result.result?.time || result.finishTime || 0;
      const formattedTime = result.result?.formattedTime || result.formattedTime || '00:00:00';
      const position = result.result?.position || result.position || null;
      
      // Process result with validated references
      const resultData = {
        athlete: athlete._id || athlete.id,
        race: race._id || race.id,
        finishTime: finishTime,
        formattedTime: formattedTime,
        position: position,
        notes: result.notes || ''
      };
      
      console.log(`Saving result with data:`, JSON.stringify(resultData, null, 2));
      
      let savedResult;
      try {
        savedResult = await findOrCreateResult(resultData);
        summary.newResults += savedResult.isNew ? 1 : 0;

        // Check for records
        await checkAndUpdateRecords(savedResult, athlete, race);
      } catch (resultError) {
        console.error(`Failed to save result:`, resultError);
        summary.errors.push(`Failed to save result: ${resultError.message}`);
        continue; // Skip to next result if saving fails
      }

      summary.processedResults++;
    } catch (error) {
      console.error('Error processing result:', error);
      summary.errors.push(error.message);
    }
  }

  return summary;
}

/**
 * Process banned athletes list and update ban status in the database
 * @param {Array} athletes - Array of banned athletes
 * @param {Object} summary - Summary object to update
 * @returns {Promise<Object>} - Updated summary
 */
async function processBannedAthletes(athletes, summary) {
  summary.totalBannedAthletes = athletes.length;

  for (const bannedAthlete of athletes) {
    try {
      // Find athlete by name and country
      let athlete = await Athlete.findOne({
        name: { $regex: new RegExp(bannedAthlete.name, 'i') },
        country: { $regex: new RegExp(bannedAthlete.country, 'i') }
      });

      if (!athlete) {
        // Create new athlete if not found
        athlete = new Athlete({
          name: bannedAthlete.name,
          country: bannedAthlete.country,
          gender: bannedAthlete.gender === 'F' ? 'Female' : 'Male', // Map gender or default to 'Male' if undefined
          isBanned: true,
          banHistory: [{
            startDate: bannedAthlete.banStartDate || new Date(),
            endDate: bannedAthlete.banEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            reason: bannedAthlete.banReason || 'Anti-doping rule violation'
          }]
        });
        await athlete.save();
        summary.newAthletes++;
      } else {
        // Update existing athlete's ban status
        athlete.isBanned = true;
        
        // Check if this ban is already in the history
        const banExists = athlete.banHistory?.some(ban => {
          const banStartDate = bannedAthlete.banStartDate || new Date();
          const banReason = bannedAthlete.banReason || 'Anti-doping rule violation';
          return ban.startDate?.toString() === banStartDate?.toString() && 
                 ban.reason === banReason;
        });

        if (!banExists) {
          // Add new ban to history
          athlete.banHistory.push({
            startDate: bannedAthlete.banStartDate || new Date(),
            endDate: bannedAthlete.banEndDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            reason: bannedAthlete.banReason || 'Anti-doping rule violation',
            substance: bannedAthlete.substance || 'Not specified'
          });
        }
        
        await athlete.save();
        summary.updatedBanStatus++;
      }

      summary.processedResults++;
    } catch (error) {
      console.error('Error processing banned athlete:', error);
      summary.errors.push(error.message);
    }
  }

  return summary;
}

/**
 * Find or create an athlete
 * @param {Object} athleteData - Athlete data
 * @returns {Promise<Object>} - Athlete object with isNew flag
 */
async function findOrCreateAthlete(athleteData) {
  try {
    // Try to find the athlete by name and country
    let athlete = await Athlete.findOne({
      name: { $regex: new RegExp(athleteData.name, 'i') },
      country: { $regex: new RegExp(athleteData.country, 'i') }
    });

    if (!athlete) {
      // Create new athlete
      try {
        athlete = new Athlete({
          name: athleteData.name,
          country: athleteData.country,
          gender: athleteData.gender || 'Unknown',
          isBanned: false
        });
        await athlete.save();
        return { ...athlete.toObject(), isNew: true };
      } catch (creationError) {
        console.error('Failed to create athlete. Data:', JSON.stringify(athleteData, null, 2));
        console.error('Athlete creation error:', creationError);
        throw creationError;
      }
    }

    return { ...athlete.toObject(), isNew: false };
  } catch (error) {
    console.error('Error in findOrCreateAthlete:', error);
    throw error;
  }
}

/**
 * Find or create a race
 * @param {Object} raceData - Race data
 * @returns {Promise<Object>} - Race object with isNew flag
 */
async function findOrCreateRace(raceData) {
  console.log('!!!!!! FIND OR CREATE RACE CALLED WITH: !!!!!!', JSON.stringify(raceData, null, 2));

  const { name, date, distance, gender, location, distanceUnit, category, isElite } = raceData;

  // Create start and end of day without modifying the original date object
  const startOfDay = new Date(date);
  startOfDay.setUTCHours(0, 0, 0, 0);

  const endOfDay = new Date(date);
  endOfDay.setUTCHours(23, 59, 59, 999);

  const query = {
    name: name,
    date: { $gte: startOfDay, $lte: endOfDay },
  };

  const update = {
    $setOnInsert: {
      name,
      date: new Date(date),
      distance,
      gender,
      location,
      distanceUnit: distanceUnit || 'm',
      category: category || 'Track',
      isElite: isElite !== undefined ? isElite : true,
    },
  };

  const options = {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true,
  };

  try {
    console.log('MongoDB Query:', JSON.stringify(query, null, 2));
    console.log('MongoDB Update:', JSON.stringify(update, null, 2));
    console.log('MongoDB Options:', JSON.stringify(options, null, 2));
    
    const race = await Race.findOneAndUpdate(query, update, options);
    console.log('MongoDB Result:', race ? 'SUCCESS' : 'UNDEFINED');

    if (!race) {
      // Try a direct create as fallback
      console.log('Attempting direct race creation as fallback...');
      const newRace = new Race({
        name,
        date: new Date(date),
        distance,
        gender,
        location,
        distanceUnit: distanceUnit || 'm',
        category: category || 'Track',
        isElite: isElite !== undefined ? isElite : true,
      });
      await newRace.save();
      return { ...newRace.toObject(), isNew: true };
    }

    // Check if the document was just created
    // Use a more reliable approach that handles timing issues
    let isNew = false;
    if (race.createdAt && race.updatedAt) {
      isNew = race.createdAt.getTime() === race.updatedAt.getTime();
    } else {
      // If timestamps aren't available, assume it's new since upsert was used
      isNew = true;
    }

    // If an existing race was found and genders differ, update to 'Mixed'
    if (!isNew && race.gender !== gender && race.gender !== 'Mixed') {
      race.gender = 'Mixed';
      await race.save();
    }

    return { ...race.toObject(), isNew };

  } catch (error) {
    console.error('Error in findOrCreateRace:', error);
    console.error('Race data causing error:', JSON.stringify(raceData, null, 2));
    throw error;
  }
}

/**
 * Find or create a result
 * @param {Object} resultData - Result data
 * @returns {Promise<Object>} - Result object with isNew flag
 */
async function findOrCreateResult(resultData) {
  try {
    // Validate required fields
    if (!resultData.athlete || !resultData.race || 
        resultData.finishTime === undefined || resultData.formattedTime === undefined) {
      throw new Error(`Result validation failed: missing required fields. Got: ${JSON.stringify(resultData)}`);
    }
    
    // Try to find the result by athlete and race
    let result = await Result.findOne({
      athlete: resultData.athlete,
      race: resultData.race
    });

    if (!result) {
      // Create new result
      result = new Result(resultData);
      await result.save();
      return { ...result.toObject(), isNew: true };
    }

    // Update existing result if needed
    let needsUpdate = false;
    
    if (resultData.finishTime !== result.finishTime) {
      result.finishTime = resultData.finishTime;
      result.formattedTime = resultData.formattedTime;
      needsUpdate = true;
    }
    
    if (resultData.position && resultData.position !== result.position) {
      result.position = resultData.position;
      needsUpdate = true;
    }
    
    if (resultData.notes && resultData.notes !== result.notes) {
      result.notes = resultData.notes;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      await result.save();
    }

    return { ...result.toObject(), isNew: false, updated: needsUpdate };
  } catch (error) {
    console.error('Error in findOrCreateResult:', error);
    console.error('Result data causing error:', JSON.stringify(resultData, null, 2));
    throw error;
  }
}

/**
 * Check if a result is a record and update the records database
 * @param {Object} result - Result object
 * @param {Object} athlete - Athlete object
 * @param {Object} race - Race object
 */
async function checkAndUpdateRecords(result, athlete, race) {
  try {
    // Format key for checking records
    const recordKey = `${race.distance}${race.distanceUnit}_${race.gender}`;
    
    // Check for world record
    const existingWorldRecord = await Record.findOne({
      type: 'World',
      distance: race.distance,
      distanceUnit: race.distanceUnit,
      gender: race.gender,
      surface: race.category
    }).sort({ time: 1 }).limit(1);
    
    if (!existingWorldRecord || result.finishTime < existingWorldRecord.time) {
      // This is a new world record
      if (existingWorldRecord) {
        // Update existing record
        existingWorldRecord.time = result.finishTime;
        existingWorldRecord.formattedTime = result.formattedTime;
        existingWorldRecord.athlete = athlete._id;
        existingWorldRecord.race = race._id;
        existingWorldRecord.result = result._id;
        existingWorldRecord.dateSet = race.date;
        existingWorldRecord.verified = false; // Needs verification
        await existingWorldRecord.save();
      } else {
        // Create new world record
        const newWorldRecord = new Record({
          type: 'World',
          distance: race.distance,
          distanceUnit: race.distanceUnit,
          gender: race.gender,
          surface: race.category,
          time: result.finishTime,
          formattedTime: result.formattedTime,
          athlete: athlete._id,
          race: race._id,
          result: result._id,
          dateSet: race.date,
          verified: false // Needs verification
        });
        await newWorldRecord.save();
      }
    }
    
    // Check for national record
    const existingNationalRecord = await Record.findOne({
      type: 'National',
      country: athlete.country,
      distance: race.distance,
      distanceUnit: race.distanceUnit,
      gender: race.gender,
      surface: race.category
    }).sort({ time: 1 }).limit(1);
    
    if (!existingNationalRecord || result.finishTime < existingNationalRecord.time) {
      // This is a new national record
      if (existingNationalRecord) {
        // Update existing record
        existingNationalRecord.time = result.finishTime;
        existingNationalRecord.formattedTime = result.formattedTime;
        existingNationalRecord.athlete = athlete._id;
        existingNationalRecord.race = race._id;
        existingNationalRecord.result = result._id;
        existingNationalRecord.dateSet = race.date;
        existingNationalRecord.verified = false; // Needs verification
        await existingNationalRecord.save();
      } else {
        // Create new national record
        const newNationalRecord = new Record({
          type: 'National',
          country: athlete.country,
          distance: race.distance,
          distanceUnit: race.distanceUnit,
          gender: race.gender,
          surface: race.category,
          time: result.finishTime,
          formattedTime: result.formattedTime,
          athlete: athlete._id,
          race: race._id,
          result: result._id,
          dateSet: race.date,
          verified: false // Needs verification
        });
        await newNationalRecord.save();
      }
    }
    
    // Check for season best
    const currentYear = new Date(race.date).getFullYear();
    const existingSeasonBest = await Record.findOne({
      type: 'SeasonBest',
      year: currentYear,
      distance: race.distance,
      distanceUnit: race.distanceUnit,
      gender: race.gender,
      surface: race.category
    }).sort({ time: 1 }).limit(1);
    
    if (!existingSeasonBest || result.finishTime < existingSeasonBest.time) {
      // This is a new season best
      if (existingSeasonBest) {
        // Update existing record
        existingSeasonBest.time = result.finishTime;
        existingSeasonBest.formattedTime = result.formattedTime;
        existingSeasonBest.athlete = athlete._id;
        existingSeasonBest.race = race._id;
        existingSeasonBest.result = result._id;
        existingSeasonBest.dateSet = race.date;
        await existingSeasonBest.save();
      } else {
        // Create new season best
        const newSeasonBest = new Record({
          type: 'SeasonBest',
          year: currentYear,
          distance: race.distance,
          distanceUnit: race.distanceUnit,
          gender: race.gender,
          surface: race.category,
          time: result.finishTime,
          formattedTime: result.formattedTime,
          athlete: athlete._id,
          race: race._id,
          result: result._id,
          dateSet: race.date
        });
        await newSeasonBest.save();
      }
    }
  } catch (error) {
    console.error('Error checking and updating records:', error);
    throw error;
  }
}

/**
 * List all available scrapers
 * @returns {Promise<Array>} - Array of available scrapers
 */
exports.listScrapers = async (req, res) => {
  try {
    const availableScrapers = scrapers.listScrapers();
    return res.status(200).json({
      success: true,
      scrapers: availableScrapers
    });
  } catch (error) {
    console.error('Error listing scrapers:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Update banned athletes list
 * @returns {Promise<Object>} - Summary of the update
 */
exports.updateBannedAthletes = async (req, res) => {
  try {
    const results = await scrapers.scrapeResults('athleticsintegrity');
    const summary = await processBannedAthletes(results, {
      totalResults: results.length,
      processedResults: 0,
      newAthletes: 0,
      updatedBanStatus: 0,
      errors: []
    });
    
    return res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Error updating banned athletes:', error);
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
