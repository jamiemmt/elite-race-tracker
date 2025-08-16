const BaseScraper = require('../BaseScraper');

class BerlinMarathon extends BaseScraper {
  constructor() {
    super('berlinmarathon', 'https://www.bmw-berlin-marathon.com');
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
   * Generate sample Berlin Marathon data
   * @param {Object} options - Scraping options
   * @returns {Array} - Sample results
   */
  generateSampleData(options = {}) {
    const year = options.year || new Date().getFullYear();
    const limit = options.limit || 20;
    
    const sampleResults = [
      // Men's results - Top 20
      { name: 'Eliud Kipchoge', country: 'KEN', time: '2:01:09', gender: 'Male', position: 1 },
      { name: 'Mark Korir', country: 'KEN', time: '2:05:58', gender: 'Male', position: 2 },
      { name: 'Tadu Abate', country: 'ETH', time: '2:06:28', gender: 'Male', position: 3 },
      { name: 'Andamlak Belihu', country: 'ETH', time: '2:06:40', gender: 'Male', position: 4 },
      { name: 'Abel Kipchumba', country: 'KEN', time: '2:06:47', gender: 'Male', position: 5 },
      { name: 'Kenenisa Bekele', country: 'ETH', time: '2:07:03', gender: 'Male', position: 6 },
      { name: 'Birhanu Legese', country: 'ETH', time: '2:07:20', gender: 'Male', position: 7 },
      { name: 'Guye Adola', country: 'ETH', time: '2:07:37', gender: 'Male', position: 8 },
      { name: 'Wilson Kipsang', country: 'KEN', time: '2:07:54', gender: 'Male', position: 9 },
      { name: 'Dennis Kimetto', country: 'KEN', time: '2:08:11', gender: 'Male', position: 10 },
      { name: 'Emmanuel Mutai', country: 'KEN', time: '2:08:28', gender: 'Male', position: 11 },
      { name: 'Geoffrey Mutai', country: 'KEN', time: '2:08:45', gender: 'Male', position: 12 },
      { name: 'Patrick Makau', country: 'KEN', time: '2:09:02', gender: 'Male', position: 13 },
      { name: 'Haile Gebrselassie', country: 'ETH', time: '2:09:19', gender: 'Male', position: 14 },
      { name: 'Paul Tergat', country: 'KEN', time: '2:09:36', gender: 'Male', position: 15 },
      { name: 'Sammy Korir', country: 'KEN', time: '2:09:53', gender: 'Male', position: 16 },
      { name: 'Felix Limo', country: 'KEN', time: '2:10:10', gender: 'Male', position: 17 },
      { name: 'Robert Cheruiyot', country: 'KEN', time: '2:10:27', gender: 'Male', position: 18 },
      { name: 'Evans Ruto', country: 'KEN', time: '2:10:44', gender: 'Male', position: 19 },
      { name: 'Duncan Kibet', country: 'KEN', time: '2:11:01', gender: 'Male', position: 20 },
      
      // Women's results - Top 20
      { name: 'Tigst Assefa', country: 'ETH', time: '2:11:53', gender: 'Female', position: 1 },
      { name: 'Sheila Chepkirui', country: 'KEN', time: '2:17:49', gender: 'Female', position: 2 },
      { name: 'Irine Cheptai', country: 'KEN', time: '2:18:03', gender: 'Female', position: 3 },
      { name: 'Workenesh Edesa', country: 'ETH', time: '2:18:51', gender: 'Female', position: 4 },
      { name: 'Magdalena Shauri', country: 'TAN', time: '2:19:12', gender: 'Female', position: 5 },
      { name: 'Gladys Cherono', country: 'KEN', time: '2:19:29', gender: 'Female', position: 6 },
      { name: 'Ababel Yeshaneh', country: 'ETH', time: '2:19:46', gender: 'Female', position: 7 },
      { name: 'Gotytom Gebrslase', country: 'ETH', time: '2:20:03', gender: 'Female', position: 8 },
      { name: 'Ruti Aga', country: 'ETH', time: '2:20:20', gender: 'Female', position: 9 },
      { name: 'Meskerem Assefa', country: 'ETH', time: '2:20:37', gender: 'Female', position: 10 },
      { name: 'Katharina Steinruck', country: 'GER', time: '2:20:54', gender: 'Female', position: 11 },
      { name: 'Melat Kejeta', country: 'GER', time: '2:21:11', gender: 'Female', position: 12 },
      { name: 'Fabienne Schlumpf', country: 'SUI', time: '2:21:28', gender: 'Female', position: 13 },
      { name: 'Lisa Weightman', country: 'AUS', time: '2:21:45', gender: 'Female', position: 14 },
      { name: 'Mizuki Noguchi', country: 'JPN', time: '2:22:02', gender: 'Female', position: 15 },
      { name: 'Naoko Takahashi', country: 'JPN', time: '2:22:19', gender: 'Female', position: 16 },
      { name: 'Paula Radcliffe', country: 'GBR', time: '2:22:36', gender: 'Female', position: 17 },
      { name: 'Catherine Ndereba', country: 'KEN', time: '2:22:53', gender: 'Female', position: 18 },
      { name: 'Deena Kastor', country: 'USA', time: '2:23:10', gender: 'Female', position: 19 },
      { name: 'Rita Jeptoo', country: 'KEN', time: '2:23:27', gender: 'Female', position: 20 }
    ];

    const results = [];
    const genders = ['Male', 'Female'];
    
    for (const gender of genders) {
      const genderResults = sampleResults.filter(r => r.gender === gender).slice(0, Math.min(20, limit));
      
      for (const result of genderResults) {
        const raceName = `Berlin Marathon ${year} - ${gender === 'Male' ? "Men's" : "Women's"} Division`;
        
        results.push({
          athlete: {
            name: result.name,
            country: result.country,
            gender: result.gender
          },
          race: {
            name: raceName,
            date: new Date(`${year}-09-24`), // Usually late September
            distance: this.marathonDistance,
            distanceUnit: 'm',
            location: 'Berlin, Germany',
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
    console.log('Berlin Marathon scraper starting...');
    
    try {
      console.log('Generating sample Berlin Marathon data...');
      const results = this.generateSampleData(options);
      
      console.log(`Generated ${results.length} sample results from Berlin Marathon`);
      return results;
      
    } catch (error) {
      console.error('Error in Berlin Marathon scraper:', error);
      return this.generateSampleData({ limit: 4 });
    }
  }
}

module.exports = BerlinMarathon;
