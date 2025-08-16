const BaseScraper = require('../BaseScraper');

class ChicagoMarathon extends BaseScraper {
  constructor() {
    super('chicagomarathon', 'https://results.chicagomarathon.com');
    this.marathonDistance = 42195; // meters
  }

  /**
   * Convert time string to seconds
   * @param {string} timeStr - Time string
   * @returns {number} - Time in seconds
   */
  convertTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    
    timeStr = timeStr.replace(/[^0-9:]/g, '').trim();
    const parts = timeStr.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }
    
    return seconds;
  }

  /**
   * Generate sample Chicago Marathon data
   * @param {Object} options - Scraping options
   * @returns {Array} - Sample results
   */
  generateSampleData(options = {}) {
    const year = options.year || new Date().getFullYear();
    const limit = options.limit || 20;
    
    const sampleResults = [
      // Men's results - Top 20
      { name: 'Kelvin Kiptum', country: 'KEN', time: '2:00:35', gender: 'Male', position: 1 },
      { name: 'Benson Kipruto', country: 'KEN', time: '2:04:24', gender: 'Male', position: 2 },
      { name: 'Bashir Abdi', country: 'BEL', time: '2:04:32', gender: 'Male', position: 3 },
      { name: 'Galen Rupp', country: 'USA', time: '2:08:41', gender: 'Male', position: 4 },
      { name: 'Clayton Young', country: 'USA', time: '2:09:39', gender: 'Male', position: 5 },
      { name: 'Conner Mantz', country: 'USA', time: '2:09:56', gender: 'Male', position: 6 },
      { name: 'Leonard Korir', country: 'USA', time: '2:10:12', gender: 'Male', position: 7 },
      { name: 'Elkanah Kibet', country: 'USA', time: '2:10:28', gender: 'Male', position: 8 },
      { name: 'Frank Lara', country: 'USA', time: '2:10:45', gender: 'Male', position: 9 },
      { name: 'Colin Mickow', country: 'USA', time: '2:11:01', gender: 'Male', position: 10 },
      { name: 'Tyler Pence', country: 'USA', time: '2:11:18', gender: 'Male', position: 11 },
      { name: 'Parker Stinson', country: 'USA', time: '2:11:34', gender: 'Male', position: 12 },
      { name: 'Noah Droddy', country: 'USA', time: '2:11:51', gender: 'Male', position: 13 },
      { name: 'Zach Panning', country: 'USA', time: '2:12:07', gender: 'Male', position: 14 },
      { name: 'Matt McDonald', country: 'USA', time: '2:12:24', gender: 'Male', position: 15 },
      { name: 'Futsum Zienasellassie', country: 'USA', time: '2:12:40', gender: 'Male', position: 16 },
      { name: 'Cam Levins', country: 'CAN', time: '2:12:57', gender: 'Male', position: 17 },
      { name: 'Trevor Hofbauer', country: 'CAN', time: '2:13:13', gender: 'Male', position: 18 },
      { name: 'Ben Flanagan', country: 'CAN', time: '2:13:30', gender: 'Male', position: 19 },
      { name: 'Rory Linkletter', country: 'CAN', time: '2:13:46', gender: 'Male', position: 20 },
      
      // Women's results - Top 20
      { name: 'Ruth Chepngetich', country: 'KEN', time: '2:13:31', gender: 'Female', position: 1 },
      { name: 'Brigid Kosgei', country: 'KEN', time: '2:18:58', gender: 'Female', position: 2 },
      { name: 'Vivian Cheruiyot', country: 'KEN', time: '2:24:29', gender: 'Female', position: 3 },
      { name: 'Emma Bates', country: 'USA', time: '2:25:27', gender: 'Female', position: 4 },
      { name: 'Keira D\'Amato', country: 'USA', time: '2:26:34', gender: 'Female', position: 5 },
      { name: 'Kellyn Taylor', country: 'USA', time: '2:27:01', gender: 'Female', position: 6 },
      { name: 'Sara Hall', country: 'USA', time: '2:27:18', gender: 'Female', position: 7 },
      { name: 'Stephanie Bruce', country: 'USA', time: '2:27:35', gender: 'Female', position: 8 },
      { name: 'Lindsay Flanagan', country: 'USA', time: '2:27:52', gender: 'Female', position: 9 },
      { name: 'Nell Rojas', country: 'USA', time: '2:28:08', gender: 'Female', position: 10 },
      { name: 'Aliphine Tuliamuk', country: 'USA', time: '2:28:25', gender: 'Female', position: 11 },
      { name: 'Emily Sisson', country: 'USA', time: '2:28:42', gender: 'Female', position: 12 },
      { name: 'Molly Huddle', country: 'USA', time: '2:28:58', gender: 'Female', position: 13 },
      { name: 'Jordan Hasay', country: 'USA', time: '2:29:15', gender: 'Female', position: 14 },
      { name: 'Amy Cragg', country: 'USA', time: '2:29:32', gender: 'Female', position: 15 },
      { name: 'Desiree Linden', country: 'USA', time: '2:29:48', gender: 'Female', position: 16 },
      { name: 'Shalane Flanagan', country: 'USA', time: '2:30:05', gender: 'Female', position: 17 },
      { name: 'Kara Goucher', country: 'USA', time: '2:30:22', gender: 'Female', position: 18 },
      { name: 'Deena Kastor', country: 'USA', time: '2:30:38', gender: 'Female', position: 19 },
      { name: 'Malindi Elmore', country: 'CAN', time: '2:30:55', gender: 'Female', position: 20 }
    ];

    const results = [];
    const genders = ['Male', 'Female'];
    
    for (const gender of genders) {
      const genderResults = sampleResults.filter(r => r.gender === gender).slice(0, Math.min(20, limit));
      
      for (const result of genderResults) {
        const raceName = `Chicago Marathon ${year} - ${gender === 'Male' ? "Men's" : "Women's"} Division`;
        
        results.push({
          athlete: {
            name: result.name,
            country: result.country,
            gender: result.gender
          },
          race: {
            name: raceName,
            date: new Date(`${year}-10-08`), // Second Sunday in October
            distance: this.marathonDistance,
            distanceUnit: 'm',
            location: 'Chicago, USA',
            category: 'Road',
            gender: result.gender,
            isElite: true
          },
          result: {
            time: this.convertTimeToSeconds(result.time),
            position: result.position,
            formattedTime: result.time
          }
        });
      }
    }
    
    return results;
  }

  /**
   * Main scrape method
   * @param {Object} options - Scraping options
   * @returns {Promise<Array>} - Race results
   */
  async scrape(options = {}) {
    console.log('Chicago Marathon scraper starting...');
    
    try {
      console.log('Generating sample Chicago Marathon data...');
      const results = this.generateSampleData(options);
      
      console.log(`Generated ${results.length} sample results from Chicago Marathon`);
      return results;
      
    } catch (error) {
      console.error('Error in Chicago Marathon scraper:', error);
      return this.generateSampleData({ limit: 4 });
    }
  }
}

module.exports = ChicagoMarathon;
