const cron = require('node-cron');
const scrapers = require('../scrapers');
const { processResults } = require('../controllers/scraperController');

/**
 * Diamond League Results Scheduler
 * 
 * Automatically runs Diamond League scrapers on a schedule during the season.
 * Runs multiple times per week during active meet periods.
 */
class DiamondLeagueScheduler {
  constructor() {
    this.tasks = [];
    this.isRunning = false;
  }

  /**
   * Start the scheduler with different frequencies based on season timing
   */
  start() {
    if (this.isRunning) {
      console.log('Diamond League scheduler already running');
      return;
    }

    console.log('Starting Diamond League scheduler...');
    this.isRunning = true;

    // During Diamond League season (May-September): Run twice daily
    const seasonTask = cron.schedule('0 */12 * 5-9 *', async () => {
      await this.runDiamondLeagueUpdate('Season update');
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Off-season (October-April): Run weekly for any late updates
    const offSeasonTask = cron.schedule('0 6 * 10-4 0', async () => {
      await this.runDiamondLeagueUpdate('Off-season update');
    }, {
      scheduled: false,
      timezone: 'UTC'
    });

    // Start tasks
    seasonTask.start();
    offSeasonTask.start();

    this.tasks.push(seasonTask, offSeasonTask);
    console.log('Diamond League scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (!this.isRunning) {
      console.log('Diamond League scheduler not running');
      return;
    }

    console.log('Stopping Diamond League scheduler...');
    this.tasks.forEach(task => task.destroy());
    this.tasks = [];
    this.isRunning = false;
    console.log('Diamond League scheduler stopped');
  }

  /**
   * Run Diamond League scrapers and process results
   */
  async runDiamondLeagueUpdate(context = 'Scheduled update') {
    const startTime = new Date();
    console.log(`[${startTime.toISOString()}] Starting ${context}`);

    try {
      // Try sample scraper first (for testing/demo)
      const sampleResults = await this.runScraper('sampleDiamondLeague', {
        topN: 20
      });

      // Try dynamic scraper for current season
      const currentYear = new Date().getFullYear();
      const dynamicResults = await this.runScraper('diamondLeagueDynamic', {
        season: currentYear,
        topN: 20
      });

      // Try static scraper with common meeting URLs
      const staticResults = await this.runScraper('diamondLeague2025', {
        meetingUrls: [
          'https://zurich.diamondleague.com/en/programme-results/',
          'https://brussels.diamondleague.com/en/programme-results/',
          'https://eugene.diamondleague.com/en/programme-results/'
        ],
        topN: 20
      });

      const totalResults = sampleResults + dynamicResults + staticResults;
      const duration = (new Date() - startTime) / 1000;

      console.log(`[${new Date().toISOString()}] ${context} completed: ${totalResults} results in ${duration}s`);

      // Log summary to a file for monitoring
      this.logUpdate({
        timestamp: startTime.toISOString(),
        context,
        duration,
        results: {
          sample: sampleResults,
          dynamic: dynamicResults,
          static: staticResults,
          total: totalResults
        }
      });

    } catch (error) {
      console.error(`[${new Date().toISOString()}] ${context} failed:`, error.message);
      
      // Log error for monitoring
      this.logUpdate({
        timestamp: startTime.toISOString(),
        context,
        error: error.message,
        success: false
      });
    }
  }

  /**
   * Run a specific scraper and return result count
   */
  async runScraper(source, options) {
    try {
      console.log(`Running scraper: ${source}`);
      const results = await scrapers.scrapeResults(source, options);
      
      if (results && results.length > 0) {
        const summary = await processResults(results, source, options);
        console.log(`${source}: ${summary.processedResults} results processed`);
        return summary.processedResults;
      }
      
      return 0;
    } catch (error) {
      console.error(`Scraper ${source} failed:`, error.message);
      return 0;
    }
  }

  /**
   * Log update results for monitoring
   */
  logUpdate(data) {
    const fs = require('fs');
    const path = require('path');
    
    try {
      const logDir = path.join(__dirname, '../logs');
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      
      const logFile = path.join(logDir, 'diamond-league-scheduler.log');
      const logEntry = JSON.stringify(data) + '\n';
      
      fs.appendFileSync(logFile, logEntry);
    } catch (error) {
      console.error('Failed to write scheduler log:', error.message);
    }
  }

  /**
   * Get scheduler status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeTasks: this.tasks.length,
      nextRuns: this.tasks.map(task => ({
        scheduled: task.scheduled,
        timezone: task.timezone
      }))
    };
  }

  /**
   * Manual trigger for testing
   */
  async triggerUpdate() {
    if (!this.isRunning) {
      throw new Error('Scheduler not running');
    }
    
    await this.runDiamondLeagueUpdate('Manual trigger');
  }
}

// Export singleton instance
const scheduler = new DiamondLeagueScheduler();

module.exports = scheduler;
