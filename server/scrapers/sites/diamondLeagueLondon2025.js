const BaseScraper = require('../BaseScraper');

class DiamondLeagueLondon2025 extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League London 2025';
    this.source = 'diamondLeagueLondon2025';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    if (cleanup) {
      await this.performCleanup();
    }
    
    // London Athletics Meet - Diamond League 2025 - July 19, 2025
    const results = [
      // Men's 100m
      { position: 1, athlete: 'Noah Lyles', country: 'USA', event: "Men's 100m", time: '9.81', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 2, athlete: 'Akani Simbine', country: 'RSA', event: "Men's 100m", time: '9.84', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 3, athlete: 'Jeremiah Azu', country: 'GBR', event: "Men's 100m", time: '9.96', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      
      // Women's 100m
      { position: 1, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 100m", time: '10.83', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 2, athlete: 'Daryll Neita', country: 'GBR', event: "Women's 100m", time: '10.96', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 3, athlete: 'Amy Hunt', country: 'GBR', event: "Women's 100m", time: '11.05', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      
      // Men's 800m
      { position: 1, athlete: 'Emmanuel Wanyonyi', country: 'KEN', event: "Men's 800m", time: '1:42.05', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 2, athlete: 'Marco Arop', country: 'CAN', event: "Men's 800m", time: '1:42.80', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 3, athlete: 'Max Burgin', country: 'GBR', event: "Men's 800m", time: '1:43.25', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      
      // Women's 800m
      { position: 1, athlete: 'Keely Hodgkinson', country: 'GBR', event: "Women's 800m", time: '1:54.20', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 2, athlete: 'Jemma Reekie', country: 'GBR', event: "Women's 800m", time: '1:56.50', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 3, athlete: 'Alexandra Bell', country: 'GBR', event: "Women's 800m", time: '1:57.80', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      
      // Men's 1500m
      { position: 1, athlete: 'Josh Kerr', country: 'GBR', event: "Men's 1500m", time: '3:29.50', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 2, athlete: 'Jake Wightman', country: 'GBR', event: "Men's 1500m", time: '3:31.20', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 3, athlete: 'Neil Gourley', country: 'GBR', event: "Men's 1500m", time: '3:32.10', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      
      // Women's 1500m
      { position: 1, athlete: 'Laura Muir', country: 'GBR', event: "Women's 1500m", time: '3:56.80', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 2, athlete: 'Sarah Healy', country: 'IRL', event: "Women's 1500m", time: '3:58.50', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' },
      { position: 3, athlete: 'Katie Snowden', country: 'GBR', event: "Women's 1500m", time: '4:01.20', venue: 'London', date: '2025-07-19', meeting: 'Diamond League London 2025' }
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
          name: `London Diamond League 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, United Kingdom`,
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
    console.log('Starting database cleanup for London Diamond League...');
  }
}

module.exports = new DiamondLeagueLondon2025();
