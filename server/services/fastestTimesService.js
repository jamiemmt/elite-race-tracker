/**
 * Service for managing fastest times tracking
 * - Updates and maintains records for both all-time and current-year fastest times
 * - Distinguishes between WR-eligible and non-WR-eligible marks
 */
const mongoose = require('mongoose');
const FastestTime = require('../models/FastestTime');
const Race = require('../models/Race');
const Result = require('../models/Result');
const Athlete = require('../models/Athlete');

/**
 * Check if a result is WR-eligible
 * @param {Object} race - Race object
 * @param {Object} result - Result object
 * @returns {Object} - { eligible: boolean, reason: string }
 */
const checkWrEligibility = (race, result) => {
  // Default to eligible
  const response = { eligible: true, reason: null };
  
  // Check race category for eligibility
  if (race.category !== 'Track' && !race.isWrEligibleCourse) {
    response.eligible = false;
    response.reason = 'Non-WR eligible course';
  }
  
  // Could add more eligibility checks here:
  // - Check for excessive wind if track event
  // - Check for excessive elevation drop if road race
  // - Check for proper timing systems, etc.
  
  return response;
};

/**
 * Get the current year
 * @returns {Number} - Current year
 */
const getCurrentYear = () => {
  return new Date().getFullYear();
};

/**
 * Process a new result and update fastest times if needed
 * @param {Object} result - Result object with populated athlete and race
 * @returns {Promise<Object>} - Updated fastest times
 */
const processResult = async (result) => {
  try {
    // Ensure result has populated references
    let populatedResult = result;
    
    if (!result.athlete || typeof result.athlete === 'string' || !result.athlete.name) {
      populatedResult = await Result.findById(result._id)
        .populate('athlete')
        .populate('race');
    }
    
    if (!populatedResult || !populatedResult.athlete || !populatedResult.race) {
      throw new Error('Unable to process result: missing athlete or race data');
    }
    
    const race = populatedResult.race;
    const athlete = populatedResult.athlete;
    const time = populatedResult.finishTime;
    const formattedTime = populatedResult.formattedTime;
    const resultDate = race.date;
    const resultYear = new Date(resultDate).getFullYear();
    const gender = athlete.gender;
    
    // Create a standardized event name
    const event = `${race.distance}${race.distanceUnit} ${race.category}`;
    
    // Check WR eligibility
    const eligibility = checkWrEligibility(race, populatedResult);
    
    // Find existing fastest time record or create new one
    let fastestTime = await FastestTime.findOne({ 
      event, 
      distance: race.distance,
      gender 
    });
    
    if (!fastestTime) {
      // Create new fastest time record
      fastestTime = new FastestTime({
        event,
        distance: race.distance,
        gender
      });
    }
    
    // Check if this is a new all-time fastest time
    if (eligibility.eligible) {
      // Check against all-time WR-eligible mark
      if (!fastestTime.allTimeWrEligible || time < fastestTime.allTimeWrEligible.time) {
        fastestTime.allTimeWrEligible = {
          time,
          formattedTime,
          athleteId: athlete._id,
          raceId: race._id,
          resultId: populatedResult._id,
          date: resultDate
        };
      }
    } else {
      // Check against all-time non-WR-eligible mark
      if (!fastestTime.allTimeNonWrEligible || time < fastestTime.allTimeNonWrEligible.time) {
        fastestTime.allTimeNonWrEligible = {
          time,
          formattedTime,
          athleteId: athlete._id,
          raceId: race._id,
          resultId: populatedResult._id,
          date: resultDate,
          reason: eligibility.reason
        };
      }
    }
    
    // Check if this is a current year result
    const currentYear = getCurrentYear();
    if (resultYear === currentYear) {
      if (eligibility.eligible) {
        // Check against current year WR-eligible mark
        if (!fastestTime.currentYearWrEligible || 
            time < fastestTime.currentYearWrEligible.time || 
            fastestTime.currentYearWrEligible.year !== currentYear) {
          
          fastestTime.currentYearWrEligible = {
            time,
            formattedTime,
            athleteId: athlete._id,
            raceId: race._id,
            resultId: populatedResult._id,
            date: resultDate,
            year: currentYear
          };
        }
      } else {
        // Check against current year non-WR-eligible mark
        if (!fastestTime.currentYearNonWrEligible || 
            time < fastestTime.currentYearNonWrEligible.time || 
            fastestTime.currentYearNonWrEligible.year !== currentYear) {
          
          fastestTime.currentYearNonWrEligible = {
            time,
            formattedTime,
            athleteId: athlete._id,
            raceId: race._id,
            resultId: populatedResult._id,
            date: resultDate,
            year: currentYear,
            reason: eligibility.reason
          };
        }
      }
    }
    
    // Update last updated timestamp
    fastestTime.lastUpdated = new Date();
    
    // Save updated fastest time
    await fastestTime.save();
    
    return fastestTime;
  } catch (error) {
    console.error('Error processing result for fastest times:', error);
    throw error;
  }
};

/**
 * Get fastest times for an event and gender
 * @param {String} event - Event name
 * @param {String} gender - Gender category
 * @returns {Promise<Object>} - Fastest times with populated athlete references
 */
const getFastestTimes = async (event, gender) => {
  try {
    const fastestTime = await FastestTime.findOne({ event, gender })
      .populate('allTimeWrEligible.athleteId')
      .populate('allTimeNonWrEligible.athleteId')
      .populate('currentYearWrEligible.athleteId')
      .populate('currentYearNonWrEligible.athleteId');
      
    return fastestTime;
  } catch (error) {
    console.error('Error getting fastest times:', error);
    throw error;
  }
};

/**
 * Process all existing results to build initial fastest times database
 * @returns {Promise<Object>} - Summary of processed results
 */
const buildInitialFastestTimes = async () => {
  try {
    const summary = {
      processed: 0,
      failed: 0,
      updatedFastestTimes: 0
    };
    
    // Get all results with populated references
    const results = await Result.find({})
      .populate('athlete')
      .populate('race');
      
    // Track updated fastest times to avoid duplicates
    const updatedFastestTimes = new Set();
    
    // Process each result
    for (const result of results) {
      try {
        const fastestTime = await processResult(result);
        
        if (fastestTime) {
          const key = `${fastestTime.event}-${fastestTime.gender}`;
          if (!updatedFastestTimes.has(key)) {
            updatedFastestTimes.add(key);
            summary.updatedFastestTimes++;
          }
        }
        
        summary.processed++;
      } catch (err) {
        console.error(`Failed to process result ${result._id}:`, err);
        summary.failed++;
      }
    }
    
    return summary;
  } catch (error) {
    console.error('Error building initial fastest times database:', error);
    throw error;
  }
};

module.exports = {
  processResult,
  getFastestTimes,
  buildInitialFastestTimes,
  getCurrentYear,
  checkWrEligibility
};
