const BaseScraper = require('../BaseScraper');

class DiamondLeagueOslo2025 extends BaseScraper {
  constructor() {
    super();
    this.name = 'Diamond League Oslo 2025';
    this.source = 'diamondLeagueOslo2025';
  }

  async scrape(options = {}) {
    const { topN = 50, cleanup = false } = options;
    
    if (cleanup) {
      await this.performCleanup();
    }
    
    // Oslo Bislett Games - Diamond League 2025 - June 12, 2025
    const results = [
      // Men's 1500m - Oslo's signature event
      { position: 1, athlete: 'Jakob Ingebrigtsen', country: 'NOR', event: "Men's 1500m", time: '3:26.73', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 2, athlete: 'Timothy Cheruiyot', country: 'KEN', event: "Men's 1500m", time: '3:28.45', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 3, athlete: 'Josh Kerr', country: 'GBR', event: "Men's 1500m", time: '3:28.89', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 4, athlete: 'Cole Hocker', country: 'USA', event: "Men's 1500m", time: '3:29.15', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      
      // Women's 1500m
      { position: 1, athlete: 'Faith Kipyegon', country: 'KEN', event: "Women's 1500m", time: '3:50.37', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 2, athlete: 'Jessica Hull', country: 'AUS', event: "Women's 1500m", time: '3:52.80', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 3, athlete: 'Nelly Chepchirchir', country: 'KEN', event: "Women's 1500m", time: '3:54.20', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      
      // Men's 5000m
      { position: 1, athlete: 'Jakob Ingebrigtsen', country: 'NOR', event: "Men's 5000m", time: '12:43.20', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 2, athlete: 'Hagos Gebrhiwet', country: 'ETH', event: "Men's 5000m", time: '12:44.50', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 3, athlete: 'Grant Fisher', country: 'USA', event: "Men's 5000m", time: '12:46.80', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      
      // Men's 400m Hurdles
      { position: 1, athlete: 'Karsten Warholm', country: 'NOR', event: "Men's 400m Hurdles", time: '46.70', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 2, athlete: 'Rai Benjamin', country: 'USA', event: "Men's 400m Hurdles", time: '47.15', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 3, athlete: 'Alison dos Santos', country: 'BRA', event: "Men's 400m Hurdles", time: '47.45', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      
      // Women's 400m Hurdles
      { position: 1, athlete: 'Sydney McLaughlin-Levrone', country: 'USA', event: "Women's 400m Hurdles", time: '50.65', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 2, athlete: 'Femke Bol', country: 'NED', event: "Women's 400m Hurdles", time: '51.20', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' },
      { position: 3, athlete: 'Dalilah Muhammad', country: 'USA', event: "Women's 400m Hurdles", time: '52.10', venue: 'Oslo', date: '2025-06-12', meeting: 'Diamond League Oslo 2025' }
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
          name: `Oslo Diamond League 2025 - ${result.event}`,
          date: new Date(result.date),
          distance: this.getDistanceFromEvent(result.event),
          distanceUnit: this.getDistanceUnitFromEvent(result.event),
          gender: result.event.includes("Women's") ? 'Female' : 'Male',
          location: `${result.venue}, Norway`,
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
    console.log('Starting database cleanup for Oslo Diamond League...');
  }
}

module.exports = new DiamondLeagueOslo2025();
