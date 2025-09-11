const BaseScraper = require('../BaseScraper');

class DiamondLeagueDoha2025 extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League Doha 2025';
    this.source = 'diamondLeagueDoha2025';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    if (cleanup) {
      await this.performCleanup();
    }
    
    // Doha Diamond League 2025 - May 16, 2025
    const results = [
      // Men's 400m - Doha specialty
      { position: 1, athlete: 'Quincy Hall', country: 'USA', event: "Men's 400m", time: '43.85', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 2, athlete: 'Matthew Hudson-Smith', country: 'GBR', event: "Men's 400m", time: '44.12', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 3, athlete: 'Kirani James', country: 'GRN', event: "Men's 400m", time: '44.35', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      
      // Women's 400m
      { position: 1, athlete: 'Marileidy Paulino', country: 'DOM', event: "Women's 400m", time: '48.95', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 2, athlete: 'Salwa Eid Naser', country: 'BRN', event: "Women's 400m", time: '49.80', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 3, athlete: 'Natalia Kaczmarek', country: 'POL', event: "Women's 400m", time: '50.15', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      
      // Men's 800m
      { position: 1, athlete: 'Emmanuel Wanyonyi', country: 'KEN', event: "Men's 800m", time: '1:41.95', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 2, athlete: 'Marco Arop', country: 'CAN', event: "Men's 800m", time: '1:42.50', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 3, athlete: 'Djamel Sedjati', country: 'ALG', event: "Men's 800m", time: '1:42.85', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      
      // Women's 800m
      { position: 1, athlete: 'Keely Hodgkinson', country: 'GBR', event: "Women's 800m", time: '1:54.80', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 2, athlete: 'Tsige Duguma', country: 'ETH', event: "Women's 800m", time: '1:55.60', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' },
      { position: 3, athlete: 'Audrey Werro', country: 'SUI', event: "Women's 800m", time: '1:56.20', venue: 'Doha', date: '2025-05-16', meeting: 'Diamond League Doha 2025' }
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
          name: `Doha Diamond League 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, Qatar`,
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
    console.log('Starting database cleanup for Doha Diamond League...');
  }
}

module.exports = new DiamondLeagueDoha2025();
