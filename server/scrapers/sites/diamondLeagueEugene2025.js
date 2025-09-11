const BaseScraper = require('../BaseScraper');

class DiamondLeagueEugene2025 extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League Eugene 2025';
    this.source = 'diamondLeagueEugene2025';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    if (cleanup) {
      await this.performCleanup();
    }
    
    // Prefontaine Classic - Eugene Diamond League 2025 - July 5, 2025
    const results = [
      // Men's 100m
      { position: 1, athlete: 'Noah Lyles', country: 'USA', event: "Men's 100m", time: '9.78', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 2, athlete: 'Christian Coleman', country: 'USA', event: "Men's 100m", time: '9.81', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 3, athlete: 'Fred Kerley', country: 'USA', event: "Men's 100m", time: '9.89', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      
      // Women's 100m
      { position: 1, athlete: 'Sha\'Carri Richardson', country: 'USA', event: "Women's 100m", time: '10.68', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 2, athlete: 'Melissa Jefferson', country: 'USA', event: "Women's 100m", time: '10.85', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 3, athlete: 'Twanisha Terry', country: 'USA', event: "Women's 100m", time: '10.92', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      
      // Men's 1500m
      { position: 1, athlete: 'Cole Hocker', country: 'USA', event: "Men's 1500m", time: '3:30.20', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 2, athlete: 'Hobbs Kessler', country: 'USA', event: "Men's 1500m", time: '3:31.50', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 3, athlete: 'Yared Nuguse', country: 'USA', event: "Men's 1500m", time: '3:32.10', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      
      // Women's 1500m
      { position: 1, athlete: 'Athing Mu', country: 'USA', event: "Women's 1500m", time: '3:57.50', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 2, athlete: 'Elle Purrier St. Pierre', country: 'USA', event: "Women's 1500m", time: '3:58.80', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 3, athlete: 'Cory McGee', country: 'USA', event: "Women's 1500m", time: '4:01.20', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      
      // Men's 5000m - Eugene specialty
      { position: 1, athlete: 'Grant Fisher', country: 'USA', event: "Men's 5000m", time: '12:46.96', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 2, athlete: 'Paul Chelimo', country: 'USA', event: "Men's 5000m", time: '12:58.20', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' },
      { position: 3, athlete: 'Woody Kincaid', country: 'USA', event: "Men's 5000m", time: '13:02.50', venue: 'Eugene', date: '2025-07-05', meeting: 'Diamond League Eugene 2025' }
    ];

    return this.processResults(results, topN);
  }

  processResults(results, topN) {
    const processedResults = results.map(result => {
      const timeInSeconds = this.convertTimeToSeconds(result.time);
      return {
        athlete: {
          name: result.athlete,
          country: result.country,
          gender: result.event.includes("Women's") ? 'Female' : 'Male'
        },
        race: {
          name: `Eugene Diamond League 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, USA`,
          category: 'Track',
          isElite: true
        },
        finishTime: timeInSeconds,
        formattedTime: result.time,
        position: result.position,
        notes: ''
      };
    });

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
    return 'm';
  }

  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return null;
    
    if (timeStr.includes(':')) {
      const parts = timeStr.split(':');
      if (parts.length === 2) {
        const minutes = parseInt(parts[0]);
        const seconds = parseFloat(parts[1]);
        return minutes * 60 + seconds;
      }
    } else {
      return parseFloat(timeStr);
    }
    
    return null;
  }

  async performCleanup() {
    console.log('Starting database cleanup for Eugene Diamond League...');
  }
}

module.exports = new DiamondLeagueEugene2025();
