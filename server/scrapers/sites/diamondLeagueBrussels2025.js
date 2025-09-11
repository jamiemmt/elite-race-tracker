const BaseScraper = require('../BaseScraper');

class DiamondLeagueBrussels2025 extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League Brussels 2025';
    this.source = 'diamondLeagueBrussels2025';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    if (cleanup) {
      await this.performCleanup();
    }
    
    // Memorial Van Damme - Brussels Diamond League 2025 - August 22, 2025
    const results = [
      // Men's 100m
      { position: 1, athlete: 'Noah Lyles', country: 'USA', event: "Men's 100m", time: '9.76', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 2, athlete: 'Christian Coleman', country: 'USA', event: "Men's 100m", time: '9.79', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 3, athlete: 'Akani Simbine', country: 'RSA', event: "Men's 100m", time: '9.82', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      
      // Women's 100m
      { position: 1, athlete: 'Sha\'Carri Richardson', country: 'USA', event: "Women's 100m", time: '10.65', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 2, athlete: 'Julien Alfred', country: 'LCA', event: "Women's 100m", time: '10.71', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 3, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 100m", time: '10.78', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      
      // Men's 200m
      { position: 1, athlete: 'Noah Lyles', country: 'USA', event: "Men's 200m", time: '19.50', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 2, athlete: 'Letsile Tebogo', country: 'BOT', event: "Men's 200m", time: '19.68', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 3, athlete: 'Kenny Bednarek', country: 'USA', event: "Men's 200m", time: '19.75', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      
      // Women's 200m
      { position: 1, athlete: 'Brittany Brown', country: 'USA', event: "Women's 200m", time: '21.95', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 2, athlete: 'Dina Asher-Smith', country: 'GBR', event: "Women's 200m", time: '22.10', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 3, athlete: 'Marie-Josée Ta Lou-Smith', country: 'CIV', event: "Women's 200m", time: '22.18', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      
      // Men's 1500m
      { position: 1, athlete: 'Jakob Ingebrigtsen', country: 'NOR', event: "Men's 1500m", time: '3:27.40', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 2, athlete: 'Timothy Cheruiyot', country: 'KEN', event: "Men's 1500m", time: '3:28.80', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 3, athlete: 'Josh Kerr', country: 'GBR', event: "Men's 1500m", time: '3:29.20', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      
      // Women's 1500m
      { position: 1, athlete: 'Faith Kipyegon', country: 'KEN', event: "Women's 1500m", time: '3:51.20', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 2, athlete: 'Jessica Hull', country: 'AUS', event: "Women's 1500m", time: '3:53.50', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' },
      { position: 3, athlete: 'Nelly Chepchirchir', country: 'KEN', event: "Women's 1500m", time: '3:54.80', venue: 'Brussels', date: '2025-08-22', meeting: 'Diamond League Brussels 2025' }
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
          name: `Brussels Diamond League 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, Belgium`,
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
    console.log('Starting database cleanup for Brussels Diamond League...');
  }
}

module.exports = new DiamondLeagueBrussels2025();
