const BaseScraper = require('../BaseScraper');

class NYCMarathon extends BaseScraper {
  constructor() {
    super('nycmarathon', 'https://results.nyrr.org');
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
   * Parse gender from category
   * @param {string} category - Category string
   * @returns {string} - Gender
   */
  parseGender(category) {
    if (!category) return 'Mixed';
    
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes('women') || lowerCategory.includes('female') || lowerCategory.includes('f')) {
      return 'Female';
    } else if (lowerCategory.includes('men') || lowerCategory.includes('male') || lowerCategory.includes('m')) {
      return 'Male';
    }
    return 'Mixed';
  }

  /**
   * Generate sample NYC Marathon data
   * @param {Object} options - Scraping options
   * @returns {Array} - Sample results
   */
  generateSampleData(options = {}) {
    const year = options.year || new Date().getFullYear();
    const limit = options.limit || 20;
    
    const sampleResults = [
      // Men's results - Top 20
      { name: 'Tamirat Tola', country: 'ETH', time: '2:04:58', gender: 'Male', position: 1 },
      { name: 'Albert Korir', country: 'KEN', time: '2:06:57', gender: 'Male', position: 2 },
      { name: 'Shura Kitata', country: 'ETH', time: '2:07:11', gender: 'Male', position: 3 },
      { name: 'Abdi Nageeye', country: 'NED', time: '2:07:39', gender: 'Male', position: 4 },
      { name: 'Evans Chebet', country: 'KEN', time: '2:08:21', gender: 'Male', position: 5 },
      { name: 'Geoffrey Kamworor', country: 'KEN', time: '2:08:42', gender: 'Male', position: 6 },
      { name: 'Lelisa Desisa', country: 'ETH', time: '2:09:15', gender: 'Male', position: 7 },
      { name: 'Wilson Kipsang', country: 'KEN', time: '2:09:33', gender: 'Male', position: 8 },
      { name: 'Ghirmay Ghebreslassie', country: 'ERI', time: '2:09:47', gender: 'Male', position: 9 },
      { name: 'Stanley Biwott', country: 'KEN', time: '2:10:01', gender: 'Male', position: 10 },
      { name: 'Meb Keflezighi', country: 'USA', time: '2:10:18', gender: 'Male', position: 11 },
      { name: 'Ryan Hall', country: 'USA', time: '2:10:35', gender: 'Male', position: 12 },
      { name: 'Dathan Ritzenhein', country: 'USA', time: '2:10:52', gender: 'Male', position: 13 },
      { name: 'Galen Rupp', country: 'USA', time: '2:11:08', gender: 'Male', position: 14 },
      { name: 'Jared Ward', country: 'USA', time: '2:11:25', gender: 'Male', position: 15 },
      { name: 'Luke Puskedra', country: 'USA', time: '2:11:42', gender: 'Male', position: 16 },
      { name: 'Diego Estrada', country: 'USA', time: '2:11:58', gender: 'Male', position: 17 },
      { name: 'Fernando Cabada', country: 'USA', time: '2:12:15', gender: 'Male', position: 18 },
      { name: 'Scott Fauble', country: 'USA', time: '2:12:32', gender: 'Male', position: 19 },
      { name: 'Jake Riley', country: 'USA', time: '2:12:48', gender: 'Male', position: 20 },
      
      // Women's results - Top 20
      { name: 'Hellen Obiri', country: 'KEN', time: '2:27:23', gender: 'Female', position: 1 },
      { name: 'Letesenbet Gidey', country: 'ETH', time: '2:27:29', gender: 'Female', position: 2 },
      { name: 'Sharon Lokedi', country: 'KEN', time: '2:27:33', gender: 'Female', position: 3 },
      { name: 'Viola Cheptoo', country: 'KEN', time: '2:28:05', gender: 'Female', position: 4 },
      { name: 'Edna Kiplagat', country: 'KEN', time: '2:28:18', gender: 'Female', position: 5 },
      { name: 'Mary Keitany', country: 'KEN', time: '2:28:35', gender: 'Female', position: 6 },
      { name: 'Shalane Flanagan', country: 'USA', time: '2:28:52', gender: 'Female', position: 7 },
      { name: 'Molly Huddle', country: 'USA', time: '2:29:08', gender: 'Female', position: 8 },
      { name: 'Desiree Linden', country: 'USA', time: '2:29:25', gender: 'Female', position: 9 },
      { name: 'Amy Cragg', country: 'USA', time: '2:29:42', gender: 'Female', position: 10 },
      { name: 'Kara Goucher', country: 'USA', time: '2:29:58', gender: 'Female', position: 11 },
      { name: 'Deena Kastor', country: 'USA', time: '2:30:15', gender: 'Female', position: 12 },
      { name: 'Jordan Hasay', country: 'USA', time: '2:30:32', gender: 'Female', position: 13 },
      { name: 'Sara Hall', country: 'USA', time: '2:30:48', gender: 'Female', position: 14 },
      { name: 'Emily Sisson', country: 'USA', time: '2:31:05', gender: 'Female', position: 15 },
      { name: 'Kellyn Taylor', country: 'USA', time: '2:31:22', gender: 'Female', position: 16 },
      { name: 'Aliphine Tuliamuk', country: 'USA', time: '2:31:38', gender: 'Female', position: 17 },
      { name: 'Stephanie Bruce', country: 'USA', time: '2:31:55', gender: 'Female', position: 18 },
      { name: 'Lindsay Flanagan', country: 'USA', time: '2:32:12', gender: 'Female', position: 19 },
      { name: 'Nell Rojas', country: 'USA', time: '2:32:28', gender: 'Female', position: 20 }
    ];

    const results = [];
    const genders = ['Male', 'Female'];
    
    for (const gender of genders) {
      const genderResults = sampleResults.filter(r => r.gender === gender).slice(0, Math.min(20, limit));
      
      for (const result of genderResults) {
        const raceName = `NYC Marathon ${year} - ${gender === 'Male' ? "Men's" : "Women's"} Division`;
        
        results.push({
          athlete: {
            name: result.name,
            country: result.country,
            gender: result.gender
          },
          race: {
            name: raceName,
            date: new Date(`${year}-11-05`), // First Sunday in November
            distance: this.marathonDistance,
            distanceUnit: 'm',
            location: 'New York City, USA',
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
    console.log('NYC Marathon scraper starting...');
    
    try {
      // For now, use sample data since NYC Marathon results require complex parsing
      console.log('Generating sample NYC Marathon data...');
      const results = this.generateSampleData(options);
      
      console.log(`Generated ${results.length} sample results from NYC Marathon`);
      return results;
      
    } catch (error) {
      console.error('Error in NYC Marathon scraper:', error);
      return this.generateSampleData({ limit: 4 });
    }
  }
}

module.exports = NYCMarathon;
