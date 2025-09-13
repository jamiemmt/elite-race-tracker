const cron = require('node-cron');
const scraperController = require('../controllers/scraperController');

class DiamondLeague2025Scheduler {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  // Diamond League 2025 Meeting Schedule
  getMeetingSchedule() {
    return [
      {
        name: 'Xiamen',
        date: '2025-04-26',
        scraper: 'diamondLeagueXiamen2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Shanghai/Keqiao',
        date: '2025-05-03',
        scraper: 'diamondLeagueShanghai2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Doha',
        date: '2025-05-16',
        scraper: 'diamondLeagueDoha2025',
        enabled: true
      },
      {
        name: 'Rabat',
        date: '2025-05-25',
        scraper: 'diamondLeagueRabat2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Rome',
        date: '2025-06-06',
        scraper: 'diamondLeagueRome2025',
        enabled: true
      },
      {
        name: 'Oslo',
        date: '2025-06-12',
        scraper: 'diamondLeagueOslo2025',
        enabled: true
      },
      {
        name: 'Stockholm',
        date: '2025-06-15',
        scraper: 'diamondLeagueStockholm2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Paris',
        date: '2025-06-20',
        scraper: 'diamondLeagueParis2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Eugene',
        date: '2025-07-05',
        scraper: 'diamondLeagueEugene2025',
        enabled: true
      },
      {
        name: 'Monaco',
        date: '2025-07-11',
        scraper: 'diamondLeagueMonaco2025',
        enabled: true
      },
      {
        name: 'London',
        date: '2025-07-19',
        scraper: 'diamondLeagueLondon2025',
        enabled: true
      },
      {
        name: 'Silesia',
        date: '2025-08-16',
        scraper: 'diamondLeagueSilesia2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Lausanne',
        date: '2025-08-20',
        scraper: 'diamondLeagueLausanne2025',
        enabled: false // Will be created when needed
      },
      {
        name: 'Brussels',
        date: '2025-08-22',
        scraper: 'diamondLeagueBrussels2025',
        enabled: true
      },
      {
        name: 'Zurich Final',
        date: '2025-08-27',
        scraper: 'worldathletics2025', // Use official World Athletics meeting page
        options: {
          competitionUrl: 'https://worldathletics.org/competitions/diamond-league/calendar-results/7199686/result',
          useProxyRender: true,
          topN: 100,
          cleanup: false
        },
        enabled: true
      }
    ];
  }

  start() {
    if (this.isRunning) {
      console.log('Diamond League 2025 scheduler is already running');
      return;
    }

    console.log('Starting Diamond League 2025 scheduler...');
    this.isRunning = true;

    // Schedule each meeting
    const meetings = this.getMeetingSchedule();
    
    meetings.forEach(meeting => {
      if (meeting.enabled) {
        this.scheduleMeeting(meeting);
      }
    });

    // Schedule a daily check for upcoming meetings
    this.scheduledJobs.set('daily-check', cron.schedule('0 6 * * *', () => {
      this.checkUpcomingMeetings();
    }, {
      scheduled: true,
      timezone: "UTC"
    }));

    console.log(`Diamond League 2025 scheduler started with ${this.scheduledJobs.size} scheduled jobs`);
  }

  scheduleMeeting(meeting) {
    const meetingDate = new Date(meeting.date);
    const now = new Date();
    
    // Schedule scraper to run on the day after the meeting (to allow for results to be posted)
    const scrapeDate = new Date(meetingDate);
    scrapeDate.setDate(scrapeDate.getDate() + 1);
    
    // Only schedule if the meeting hasn't happened yet
    if (scrapeDate > now) {
      const cronExpression = `0 10 ${scrapeDate.getDate()} ${scrapeDate.getMonth() + 1} *`;
      
      const job = cron.schedule(cronExpression, async () => {
        console.log(`Running Diamond League ${meeting.name} 2025 scraper...`);
        
        try {
          const defaultOptions = { topN: 100, cleanup: false };
          const mergedOptions = { ...defaultOptions, ...(meeting.options || {}) };
          const result = await scraperController.runScraperProgrammatic(meeting.scraper, mergedOptions);
          
          console.log(`Diamond League ${meeting.name} 2025 scraper completed:`, result.summary);
        } catch (error) {
          console.error(`Error running Diamond League ${meeting.name} 2025 scraper:`, error);
        }
      }, {
        scheduled: true,
        timezone: "UTC"
      });

      this.scheduledJobs.set(`meeting-${meeting.name.toLowerCase()}`, job);
      console.log(`Scheduled Diamond League ${meeting.name} 2025 scraper for ${scrapeDate.toISOString()}`);
    }
  }

  checkUpcomingMeetings() {
    const meetings = this.getMeetingSchedule();
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    meetings.forEach(meeting => {
      const meetingDate = new Date(meeting.date);
      
      // Check if meeting is in the next week and enabled
      if (meetingDate >= now && meetingDate <= nextWeek && meeting.enabled) {
        console.log(`Upcoming Diamond League meeting: ${meeting.name} on ${meeting.date}`);
        
        // Optionally run a pre-meeting check or preparation
        this.prepareMeeting(meeting);
      }
    });
  }

  prepareMeeting(meeting) {
    console.log(`Preparing for Diamond League ${meeting.name} 2025...`);
    // Could include pre-meeting setup, validation, etc.
  }

  // Manual trigger for specific meetings
  async runMeetingScraper(meetingName, options = {}) {
    const meetings = this.getMeetingSchedule();
    const meeting = meetings.find(m => m.name.toLowerCase() === meetingName.toLowerCase());
    
    if (!meeting) {
      throw new Error(`Meeting "${meetingName}" not found in schedule`);
    }

    if (!meeting.enabled) {
      throw new Error(`Meeting "${meetingName}" scraper is not enabled`);
    }

    console.log(`Manually running Diamond League ${meeting.name} 2025 scraper...`);
    
    const defaultOptions = { topN: 100, cleanup: false };
    const mergedOptions = { ...defaultOptions, ...(meeting.options || {}), ...(options || {}) };

    try {
      const result = await scraperController.runScraperProgrammatic(meeting.scraper, mergedOptions);
      console.log(`Diamond League ${meeting.name} 2025 scraper completed:`, result.summary);
      return result;
    } catch (error) {
      console.error(`Error running Diamond League ${meeting.name} 2025 scraper:`, error);
      throw error;
    }
  }

  // Run all enabled scrapers (for testing or bulk updates)
  async runAllScrapers(options = {}) {
    const meetings = this.getMeetingSchedule().filter(m => m.enabled);
    const results = [];

    for (const meeting of meetings) {
      try {
        console.log(`Running Diamond League ${meeting.name} 2025 scraper...`);
        const result = await this.runMeetingScraper(meeting.name, options);
        results.push({ meeting: meeting.name, success: true, result });
      } catch (error) {
        console.error(`Failed to run ${meeting.name} scraper:`, error);
        results.push({ meeting: meeting.name, success: false, error: error.message });
      }
    }

    return results;
  }

  stop() {
    if (!this.isRunning) {
      console.log('Diamond League 2025 scheduler is not running');
      return;
    }

    console.log('Stopping Diamond League 2025 scheduler...');
    
    // Stop all scheduled jobs
    this.scheduledJobs.forEach((job, name) => {
      job.destroy();
      console.log(`Stopped job: ${name}`);
    });
    
    this.scheduledJobs.clear();
    this.isRunning = false;
    
    console.log('Diamond League 2025 scheduler stopped');
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: Array.from(this.scheduledJobs.keys()),
      meetings: this.getMeetingSchedule(),
      enabledMeetings: this.getMeetingSchedule().filter(m => m.enabled).length,
      totalMeetings: this.getMeetingSchedule().length
    };
  }
}

// Export singleton instance
const scheduler = new DiamondLeague2025Scheduler();

module.exports = scheduler;
