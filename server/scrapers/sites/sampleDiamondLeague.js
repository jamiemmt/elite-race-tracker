const BaseScraper = require('../BaseScraper');

/**
 * Sample Diamond League scraper for testing
 * Creates realistic sample results for Zurich 2025 Women's 100m and 200m
 */
class SampleDiamondLeague extends BaseScraper {
  constructor() {
    super('sampleDiamondLeague', 'https://sample.diamondleague.com');
  }

  async scrape(options = {}) {
    const results = [];
    
    // Zurich 2025 Women's 100m results
    const women100m = [
      { name: 'Sha\'Carri Richardson', country: 'USA', time: '10.65', position: 1 },
      { name: 'Shelly-Ann Fraser-Pryce', country: 'JAM', time: '10.71', position: 2 },
      { name: 'Elaine Thompson-Herah', country: 'JAM', time: '10.73', position: 3 },
      { name: 'Marie-Josée Ta Lou-Smith', country: 'CIV', time: '10.78', position: 4 },
      { name: 'Dina Asher-Smith', country: 'GBR', time: '10.83', position: 5 },
      { name: 'Julien Alfred', country: 'LCA', time: '10.85', position: 6 },
      { name: 'Melissa Jefferson', country: 'USA', time: '10.87', position: 7 },
      { name: 'Mujinga Kambundji', country: 'SUI', time: '10.91', position: 8 }
    ];

    // Zurich 2025 Women's 200m results  
    const women200m = [
      { name: 'Sha\'Carri Richardson', country: 'USA', time: '21.78', position: 1 },
      { name: 'Shericka Jackson', country: 'JAM', time: '21.81', position: 2 },
      { name: 'Gabby Thomas', country: 'USA', time: '21.86', position: 3 },
      { name: 'Dina Asher-Smith', country: 'GBR', time: '21.98', position: 4 },
      { name: 'Marie-Josée Ta Lou-Smith', country: 'CIV', time: '22.05', position: 5 },
      { name: 'Julien Alfred', country: 'LCA', time: '22.12', position: 6 },
      { name: 'Brittany Brown', country: 'USA', time: '22.18', position: 7 },
      { name: 'Mujinga Kambundji', country: 'SUI', time: '22.24', position: 8 }
    ];

    const raceDate = new Date('2025-08-27');
    
    // Add 100m results
    women100m.forEach(athlete => {
      results.push({
        athlete: {
          name: athlete.name,
          country: athlete.country,
          gender: 'Female'
        },
        race: {
          name: 'Zurich Diamond League 2025 - Women 100 Metres',
          location: 'Zurich, Switzerland',
          date: raceDate,
          distance: 100,
          distanceUnit: 'm',
          category: 'Track',
          gender: 'Female',
          isElite: true
        },
        result: {
          time: this.convertTimeToSeconds(athlete.time),
          position: athlete.position,
          formattedTime: athlete.time
        }
      });
    });

    // Add 200m results
    women200m.forEach(athlete => {
      results.push({
        athlete: {
          name: athlete.name,
          country: athlete.country,
          gender: 'Female'
        },
        race: {
          name: 'Zurich Diamond League 2025 - Women 200 Metres',
          location: 'Zurich, Switzerland', 
          date: raceDate,
          distance: 200,
          distanceUnit: 'm',
          category: 'Track',
          gender: 'Female',
          isElite: true
        },
        result: {
          time: this.convertTimeToSeconds(athlete.time),
          position: athlete.position,
          formattedTime: athlete.time
        }
      });
    });

    return results;
  }
}

module.exports = new SampleDiamondLeague();
