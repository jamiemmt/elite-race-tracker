const BaseScraper = require('../BaseScraper');

class TokyoMarathon extends BaseScraper {
  constructor() {
    super('tokyomarathon', 'https://www.marathon.tokyo');
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
   * Generate sample Tokyo Marathon data
   * @param {Object} options - Scraping options
   * @returns {Array} - Sample results
   */
  generateSampleData(options = {}) {
    const year = options.year || new Date().getFullYear();
    const limit = options.limit || 20;
    
    const sampleResults = [
      // Men's results - Top 20
      { name: 'Benson Kipruto', country: 'KEN', time: '2:02:16', gender: 'Male', position: 1 },
      { name: 'Vincent Kipkemoi', country: 'KEN', time: '2:02:55', gender: 'Male', position: 2 },
      { name: 'Tsegaye Mekonnen', country: 'ETH', time: '2:04:51', gender: 'Male', position: 3 },
      { name: 'Yuma Hattori', country: 'JPN', time: '2:07:27', gender: 'Male', position: 4 },
      { name: 'Kengo Suzuki', country: 'JPN', time: '2:07:42', gender: 'Male', position: 5 },
      { name: 'Suguru Osako', country: 'JPN', time: '2:07:58', gender: 'Male', position: 6 },
      { name: 'Shogo Nakamura', country: 'JPN', time: '2:08:15', gender: 'Male', position: 7 },
      { name: 'Daichi Kamino', country: 'JPN', time: '2:08:32', gender: 'Male', position: 8 },
      { name: 'Hiroto Inoue', country: 'JPN', time: '2:08:49', gender: 'Male', position: 9 },
      { name: 'Akira Akasaki', country: 'JPN', time: '2:09:06', gender: 'Male', position: 10 },
      { name: 'Yuki Kawauchi', country: 'JPN', time: '2:09:23', gender: 'Male', position: 11 },
      { name: 'Takuya Noguchi', country: 'JPN', time: '2:09:40', gender: 'Male', position: 12 },
      { name: 'Kenta Murayama', country: 'JPN', time: '2:09:57', gender: 'Male', position: 13 },
      { name: 'Tadashi Isshiki', country: 'JPN', time: '2:10:14', gender: 'Male', position: 14 },
      { name: 'Ryo Kiname', country: 'JPN', time: '2:10:31', gender: 'Male', position: 15 },
      { name: 'Hayato Sonoda', country: 'JPN', time: '2:10:48', gender: 'Male', position: 16 },
      { name: 'Kenji Yamamoto', country: 'JPN', time: '2:11:05', gender: 'Male', position: 17 },
      { name: 'Satoshi Yoshii', country: 'JPN', time: '2:11:22', gender: 'Male', position: 18 },
      { name: 'Takeshi Nishida', country: 'JPN', time: '2:11:39', gender: 'Male', position: 19 },
      { name: 'Masato Imai', country: 'JPN', time: '2:11:56', gender: 'Male', position: 20 },
      
      // Women's results - Top 20
      { name: 'Rosemary Wanjiru', country: 'KEN', time: '2:16:28', gender: 'Female', position: 1 },
      { name: 'Ashete Bekere', country: 'ETH', time: '2:17:58', gender: 'Female', position: 2 },
      { name: 'Fatuma Sado', country: 'ETH', time: '2:18:29', gender: 'Female', position: 3 },
      { name: 'Mizuki Matsuda', country: 'JPN', time: '2:20:52', gender: 'Female', position: 4 },
      { name: 'Honami Maeda', country: 'JPN', time: '2:23:30', gender: 'Female', position: 5 },
      { name: 'Mao Ichiyama', country: 'JPN', time: '2:23:47', gender: 'Female', position: 6 },
      { name: 'Ayuko Suzuki', country: 'JPN', time: '2:24:04', gender: 'Female', position: 7 },
      { name: 'Rei Ohara', country: 'JPN', time: '2:24:21', gender: 'Female', position: 8 },
      { name: 'Yuka Ando', country: 'JPN', time: '2:24:38', gender: 'Female', position: 9 },
      { name: 'Kaori Yoshida', country: 'JPN', time: '2:24:55', gender: 'Female', position: 10 },
      { name: 'Sayaka Sato', country: 'JPN', time: '2:25:12', gender: 'Female', position: 11 },
      { name: 'Reia Iwade', country: 'JPN', time: '2:25:29', gender: 'Female', position: 12 },
      { name: 'Yumiko Kinoshita', country: 'JPN', time: '2:25:46', gender: 'Female', position: 13 },
      { name: 'Tomomi Tanaka', country: 'JPN', time: '2:26:03', gender: 'Female', position: 14 },
      { name: 'Kayoko Fukushi', country: 'JPN', time: '2:26:20', gender: 'Female', position: 15 },
      { name: 'Naoko Takahashi', country: 'JPN', time: '2:26:37', gender: 'Female', position: 16 },
      { name: 'Mizuki Noguchi', country: 'JPN', time: '2:26:54', gender: 'Female', position: 17 },
      { name: 'Reiko Tosa', country: 'JPN', time: '2:27:11', gender: 'Female', position: 18 },
      { name: 'Yoko Shibui', country: 'JPN', time: '2:27:28', gender: 'Female', position: 19 },
      { name: 'Eri Yamaguchi', country: 'JPN', time: '2:27:45', gender: 'Female', position: 20 }
    ];

    const results = [];
    const genders = ['Male', 'Female'];
    
    for (const gender of genders) {
      const genderResults = sampleResults.filter(r => r.gender === gender).slice(0, Math.min(20, limit));
      
      for (const result of genderResults) {
        const raceName = `Tokyo Marathon ${year} - ${gender === 'Male' ? "Men's" : "Women's"} Division`;
        
        results.push({
          athlete: {
            name: result.name,
            country: result.country,
            gender: result.gender
          },
          race: {
            name: raceName,
            date: new Date(`${year}-03-03`), // Usually early March
            distance: this.marathonDistance,
            distanceUnit: 'm',
            location: 'Tokyo, Japan',
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
    console.log('Tokyo Marathon scraper starting...');
    
    try {
      console.log('Generating sample Tokyo Marathon data...');
      const results = this.generateSampleData(options);
      
      console.log(`Generated ${results.length} sample results from Tokyo Marathon`);
      return results;
      
    } catch (error) {
      console.error('Error in Tokyo Marathon scraper:', error);
      return this.generateSampleData({ limit: 4 });
    }
  }
}

module.exports = TokyoMarathon;
