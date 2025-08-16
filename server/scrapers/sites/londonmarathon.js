const BaseScraper = require('../BaseScraper');

class LondonMarathon extends BaseScraper {
  constructor() {
    super('londonmarathon', 'https://results.virginmoneylondonmarathon.com');
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
   * Generate sample London Marathon data
   * @param {Object} options - Scraping options
   * @returns {Array} - Sample results
   */
  generateSampleData(options = {}) {
    const year = options.year || new Date().getFullYear();
    const limit = options.limit || 20;
    
    const sampleResults = [
      // Men's results - Top 20
      { name: 'Kelvin Kiptum', country: 'KEN', time: '2:01:25', gender: 'Male', position: 1 },
      { name: 'Emile Cairess', country: 'GBR', time: '2:06:46', gender: 'Male', position: 2 },
      { name: 'Kenenisa Bekele', country: 'ETH', time: '2:07:04', gender: 'Male', position: 3 },
      { name: 'Mosinet Geremew', country: 'ETH', time: '2:07:23', gender: 'Male', position: 4 },
      { name: 'Alexander Mutiso', country: 'KEN', time: '2:07:30', gender: 'Male', position: 5 },
      { name: 'Tamirat Tola', country: 'ETH', time: '2:07:47', gender: 'Male', position: 6 },
      { name: 'Vincent Kipkemoi', country: 'KEN', time: '2:08:04', gender: 'Male', position: 7 },
      { name: 'Sisay Lemma', country: 'ETH', time: '2:08:21', gender: 'Male', position: 8 },
      { name: 'Bashir Abdi', country: 'BEL', time: '2:08:38', gender: 'Male', position: 9 },
      { name: 'Mo Farah', country: 'GBR', time: '2:08:55', gender: 'Male', position: 10 },
      { name: 'Callum Hawkins', country: 'GBR', time: '2:09:12', gender: 'Male', position: 11 },
      { name: 'Chris Thompson', country: 'GBR', time: '2:09:29', gender: 'Male', position: 12 },
      { name: 'Dewi Griffiths', country: 'GBR', time: '2:09:46', gender: 'Male', position: 13 },
      { name: 'Ben Connor', country: 'GBR', time: '2:10:03', gender: 'Male', position: 14 },
      { name: 'Phil Sesemann', country: 'GBR', time: '2:10:20', gender: 'Male', position: 15 },
      { name: 'Jonny Mellor', country: 'GBR', time: '2:10:37', gender: 'Male', position: 16 },
      { name: 'Andy Vernon', country: 'GBR', time: '2:10:54', gender: 'Male', position: 17 },
      { name: 'Ross Millington', country: 'GBR', time: '2:11:11', gender: 'Male', position: 18 },
      { name: 'Luke Traynor', country: 'GBR', time: '2:11:28', gender: 'Male', position: 19 },
      { name: 'Adam Clarke', country: 'GBR', time: '2:11:45', gender: 'Male', position: 20 },
      
      // Women's results - Top 20
      { name: 'Sifan Hassan', country: 'NED', time: '2:18:33', gender: 'Female', position: 1 },
      { name: 'Alemu Megertu', country: 'ETH', time: '2:16:34', gender: 'Female', position: 2 },
      { name: 'Peres Jepchirchir', country: 'KEN', time: '2:16:42', gender: 'Female', position: 3 },
      { name: 'Yalemzerf Yehualaw', country: 'ETH', time: '2:17:23', gender: 'Female', position: 4 },
      { name: 'Joyciline Jepkosgei', country: 'KEN', time: '2:18:07', gender: 'Female', position: 5 },
      { name: 'Tigst Assefa', country: 'ETH', time: '2:18:24', gender: 'Female', position: 6 },
      { name: 'Brigid Kosgei', country: 'KEN', time: '2:18:41', gender: 'Female', position: 7 },
      { name: 'Ruth Chepngetich', country: 'KEN', time: '2:18:58', gender: 'Female', position: 8 },
      { name: 'Letesenbet Gidey', country: 'ETH', time: '2:19:15', gender: 'Female', position: 9 },
      { name: 'Hellen Obiri', country: 'KEN', time: '2:19:32', gender: 'Female', position: 10 },
      { name: 'Charlotte Purdue', country: 'GBR', time: '2:19:49', gender: 'Female', position: 11 },
      { name: 'Steph Davis', country: 'GBR', time: '2:20:06', gender: 'Female', position: 12 },
      { name: 'Natasha Cockram', country: 'GBR', time: '2:20:23', gender: 'Female', position: 13 },
      { name: 'Rose Harvey', country: 'GBR', time: '2:20:40', gender: 'Female', position: 14 },
      { name: 'Tracy Barlow', country: 'GBR', time: '2:20:57', gender: 'Female', position: 15 },
      { name: 'Lily Partridge', country: 'GBR', time: '2:21:14', gender: 'Female', position: 16 },
      { name: 'Jessica Piasecki', country: 'GBR', time: '2:21:31', gender: 'Female', position: 17 },
      { name: 'Clara Evans', country: 'GBR', time: '2:21:48', gender: 'Female', position: 18 },
      { name: 'Stephanie Twell', country: 'GBR', time: '2:22:05', gender: 'Female', position: 19 },
      { name: 'Louise Small', country: 'GBR', time: '2:22:22', gender: 'Female', position: 20 }
    ];

    const results = [];
    const genders = ['Male', 'Female'];
    
    for (const gender of genders) {
      const genderResults = sampleResults.filter(r => r.gender === gender).slice(0, Math.min(20, limit));
      
      for (const result of genderResults) {
        const raceName = `London Marathon ${year} - ${gender === 'Male' ? "Men's" : "Women's"} Division`;
        
        results.push({
          athlete: {
            name: result.name,
            country: result.country,
            gender: result.gender
          },
          race: {
            name: raceName,
            date: new Date(`${year}-04-23`), // Usually late April
            distance: this.marathonDistance,
            distanceUnit: 'm',
            location: 'London, United Kingdom',
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
    console.log('London Marathon scraper starting...');
    
    try {
      console.log('Generating sample London Marathon data...');
      const results = this.generateSampleData(options);
      
      console.log(`Generated ${results.length} sample results from London Marathon`);
      return results;
      
    } catch (error) {
      console.error('Error in London Marathon scraper:', error);
      return this.generateSampleData({ limit: 4 });
    }
  }
}

module.exports = LondonMarathon;
