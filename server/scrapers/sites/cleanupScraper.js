const BaseScraper = require('../BaseScraper');
const Result = require('../../models/Result');
const Race = require('../../models/Race');
const Athlete = require('../../models/Athlete');

class CleanupScraper extends BaseScraper {
  constructor() {
    super();
    this.name = 'Database Cleanup Scraper';
    this.source = 'cleanupScraper';
  }

  async scrape(options = {}) {
    console.log('Starting database cleanup...');
    
    try {
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

      // Step 2: Remove Jakob Ingebrigtsen from fake Diamond League Final 2025 events
      const jakobAthlete = await Athlete.findOne({ name: 'Jakob Ingebrigtsen' });
      if (jakobAthlete) {
        const fakeRaces = await Race.find({
          name: { $in: [
            'Diamond League Final 2025 - Men\'s 100m',
            'Diamond League Final 2025 - Men\'s 5000m'
          ]}
        });
        
        for (const race of fakeRaces) {
          const jakobResult = await Result.findOne({ 
            athlete: jakobAthlete._id, 
            race: race._id 
          });
          if (jakobResult) {
            await Result.deleteOne({ _id: jakobResult._id });
            deletedResults += 1;
            console.log(`Deleted Jakob Ingebrigtsen from fake race: ${race.name}`);
          }
        }
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

      // Return cleanup summary as "results" for the scraper interface
      return [{
        position: 1,
        athlete: 'Cleanup Summary',
        country: 'SYS',
        event: 'Database Cleanup',
        time: '0.00',
        venue: 'Database',
        date: new Date().toISOString().split('T')[0],
        meeting: 'Cleanup Operation',
        timeInSeconds: 0,
        formattedTime: '0.00',
        raceKey: 'Cleanup Operation - Database Cleanup',
        meetingName: 'Cleanup Operation',
        meetingDate: new Date().toISOString().split('T')[0],
        deletedResults,
        deletedRaces,
        deletedAthletes
      }];

    } catch (error) {
      console.error('Error in cleanup scraper:', error);
      return [];
    }
  }
}

module.exports = new CleanupScraper();
