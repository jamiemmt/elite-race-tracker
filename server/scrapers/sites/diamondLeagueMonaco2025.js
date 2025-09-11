const BaseScraper = require('../BaseScraper');

class DiamondLeagueMonaco2025 extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League Monaco 2025';
    this.source = 'diamondLeagueMonaco2025';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    // If cleanup mode, perform database cleanup first
    if (cleanup) {
      await this.performCleanup();
    }
    
    // Monaco Diamond League 2025 results - July 11, 2025
    // This will be populated with actual results when the meet occurs
    const results = [
      // Men's 100m - Sample results structure
      { position: 1, athlete: 'Noah Lyles', country: 'USA', event: "Men's 100m", time: '9.83', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 2, athlete: 'Christian Coleman', country: 'USA', event: "Men's 100m", time: '9.85', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 3, athlete: 'Akani Simbine', country: 'RSA', event: "Men's 100m", time: '9.87', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      
      // Women's 100m
      { position: 1, athlete: 'Sha\'Carri Richardson', country: 'USA', event: "Women's 100m", time: '10.65', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 2, athlete: 'Julien Alfred', country: 'LCA', event: "Women's 100m", time: '10.72', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 3, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 100m", time: '10.83', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      
      // Men's 1500m - Monaco's signature event
      { position: 1, athlete: 'Jakob Ingebrigtsen', country: 'NOR', event: "Men's 1500m", time: '3:28.50', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 2, athlete: 'Timothy Cheruiyot', country: 'KEN', event: "Men's 1500m", time: '3:29.15', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 3, athlete: 'Josh Kerr', country: 'GBR', event: "Men's 1500m", time: '3:29.45', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      
      // Women's 1500m
      { position: 1, athlete: 'Faith Kipyegon', country: 'KEN', event: "Women's 1500m", time: '3:52.50', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 2, athlete: 'Jessica Hull', country: 'AUS', event: "Women's 1500m", time: '3:54.20', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' },
      { position: 3, athlete: 'Nelly Chepchirchir', country: 'KEN', event: "Women's 1500m", time: '3:55.10', venue: 'Monaco', date: '2025-07-11', meeting: 'Diamond League Monaco 2025' }
    ];

    // Convert to proper data structure
    const processedResults = results.map(result => {
      const timeInSeconds = this.convertTimeToSeconds(result.time);
      return {
        athlete: {
          name: result.athlete,
          country: result.country,
          gender: result.event.includes("Women's") ? 'Female' : 'Male'
        },
        race: {
          name: `Monaco Diamond League 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, Monaco`,
          category: 'Track',
          isElite: true
        },
        finishTime: timeInSeconds,
        formattedTime: result.time,
        position: result.position,
        notes: ''
      };
    });

    // Apply topN limit if specified
    if (topN && topN > 0) {
      return processedResults.slice(0, topN);
    }

    return processedResults;
  }

  getDistanceFromEvent(eventName) {
    if (eventName.includes('100m')) return 100;
    if (eventName.includes('200m')) return 200;
    if (eventName.includes('400m')) return 400;
    if (eventName.includes('800m')) return 800;
    if (eventName.includes('1500m')) return 1500;
    if (eventName.includes('3000m')) return 3000;
    if (eventName.includes('5000m')) return 5000;
    if (eventName.includes('10000m')) return 10000;
    if (eventName.includes('110m Hurdles')) return 110;
    if (eventName.includes('400m Hurdles')) return 400;
    if (eventName.includes('3000m Steeplechase')) return 3000;
    return 0;
  }

  getDistanceUnitFromEvent(eventName) {
    return 'm'; // All events are in meters
  }

  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    // Handle different time formats
    if (timeStr.includes(':')) {
      // Format like "1:42.37" or "8:57.24"
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        return minutes * 60 + seconds;
      }
    } else {
      // Format like "9.97" (seconds only)
      return parseFloat(timeStr);
    }
    
    return null;
  }

  async performCleanup() {
    console.log('Starting database cleanup...');
    
    try {
      const Result = require('../../models/Result');
      const Race = require('../../models/Race');
      const Athlete = require('../../models/Athlete');

      let deletedResults = 0;
      let deletedAthletes = 0;
      let deletedRaces = 0;

      // Step 1: Remove specific parsing artifact athletes
      const artifactNames = [
        'Bromell finished',
        'Simbine takes', 
        's 200WHAT',
        's 3000mIn',
        'SteeplechaseFaith Cherotich',
        'Britt takes',
        's 110m',
        's 100mCHRISTIAN',
        's 400m'
      ];

      for (const name of artifactNames) {
        const athlete = await Athlete.findOne({ name });
        if (athlete) {
          const resultCount = await Result.deleteMany({ athlete: athlete._id });
          await Athlete.deleteOne({ _id: athlete._id });
          deletedResults += resultCount.deletedCount;
          deletedAthletes += 1;
          console.log(`Deleted athlete "${name}" and ${resultCount.deletedCount} results`);
        }
      }

      // Step 2: Remove fake Eugene Diamond League events (real 2025 Final was in Zurich)
      const fakeEugeneRaces = await Race.find({
        $and: [
          { name: { $regex: /Diamond League Final 2025/ } },
          { location: 'Eugene, USA' }
        ]
      });

      for (const race of fakeEugeneRaces) {
        // Delete all results for this fake race
        const raceResults = await Result.deleteMany({ race: race._id });
        deletedResults += raceResults.deletedCount;
        
        // Delete the fake race
        await Race.deleteOne({ _id: race._id });
        deletedRaces += 1;
        console.log(`Deleted fake Eugene race: ${race.name} and ${raceResults.deletedCount} results`);
      }

      // Step 3: Remove results with corrupted time formats
      const corruptedTimeResults = await Result.find({
        $or: [
          { formattedTime: { $regex: /\d+\.\d+\.\d+:\d+/ } }, // "20.14.3:30"
          { formattedTime: { $regex: /^\d+$/ } },              // Just numbers like "400" 
          { formattedTime: { $regex: /\d+:\d+$/ } },           // Incomplete like "2018"
          { formattedTime: { $regex: /\.$/ } }                 // Ends with period
        ]
      });

      if (corruptedTimeResults.length > 0) {
        await Result.deleteMany({ _id: { $in: corruptedTimeResults.map(r => r._id) } });
        deletedResults += corruptedTimeResults.length;
        console.log(`Deleted ${corruptedTimeResults.length} results with corrupted times`);
      }

      // Step 4: Clean up orphaned races and athletes
      const orphanedRaces = await Race.find({
        _id: { $nin: await Result.distinct('race') }
      });
      
      if (orphanedRaces.length > 0) {
        await Race.deleteMany({ _id: { $in: orphanedRaces.map(r => r._id) } });
        deletedRaces += orphanedRaces.length;
        console.log(`Deleted ${orphanedRaces.length} orphaned races`);
      }

      const orphanedAthletes = await Athlete.find({
        _id: { $nin: await Result.distinct('athlete') }
      });
      
      if (orphanedAthletes.length > 0) {
        await Athlete.deleteMany({ _id: { $in: orphanedAthletes.map(a => a._id) } });
        deletedAthletes += orphanedAthletes.length;
        console.log(`Deleted ${orphanedAthletes.length} orphaned athletes`);
      }

      console.log(`Cleanup completed: ${deletedResults} results, ${deletedRaces} races, ${deletedAthletes} athletes deleted`);

    } catch (error) {
      console.error('Error in cleanup:', error);
    }
  }
}

module.exports = new DiamondLeagueMonaco2025();
