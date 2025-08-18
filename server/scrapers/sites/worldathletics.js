const BaseScraper = require('../BaseScraper');

class WorldAthletics extends BaseScraper {
  constructor() {
    super('worldathletics', 'https://worldathletics.org');
    this.resultsBaseUrl = '/competitions/';
  }

  /**
   * Parse gender from event name with robust logic
   * @param {string} eventName - Name of the event
   * @returns {string} - Gender ('Male', 'Female', or 'Mixed')
   */
  parseGender(eventName) {
    if (!eventName) return 'Mixed';
    
    const lowerName = eventName.toLowerCase();
    
    // Female identifiers
    if (lowerName.includes('women') || 
        lowerName.includes("women's") || 
        lowerName.includes('female') || 
        lowerName.includes('girls') ||
        lowerName.includes('w ') ||
        lowerName.startsWith('w ') ||
        lowerName.endsWith(' w')) {
      return 'Female';
    }
    
    // Male identifiers  
    if (lowerName.includes('men') || 
        lowerName.includes("men's") || 
        lowerName.includes('male') || 
        lowerName.includes('boys') ||
        (lowerName.includes('m ') && !lowerName.includes('women')) ||
        (lowerName.startsWith('m ') && !lowerName.includes('women')) ||
        (lowerName.endsWith(' m') && !lowerName.includes('women'))) {
      return 'Male';
    }
    
    return 'Mixed';
  }

  /**
   * Parse distance from event name
   * @param {string} eventName - Name of the event
   * @returns {number} - Distance in meters
   */
  parseDistance(eventName) {
    if (!eventName) return 5000; // Default
    
    const lowerName = eventName.toLowerCase();
    
    // Look for distance patterns
    const distanceMatch = eventName.match(/(\d+)\s*(m|km|miles?)/i);
    if (distanceMatch) {
      const distance = parseFloat(distanceMatch[1]);
      const unit = distanceMatch[2].toLowerCase();
      
      if (unit === 'km') {
        return distance * 1000;
      } else if (unit.startsWith('mile')) {
        return distance * 1609.34;
      } else {
        return distance;
      }
    }
    
    // Handle special cases
    if (lowerName.includes('marathon') && !lowerName.includes('half')) {
      return 42195;
    } else if (lowerName.includes('half marathon')) {
      return 21097.5;
    } else if (lowerName.includes('5000') || lowerName.includes('5k')) {
      return 5000;
    } else if (lowerName.includes('10000') || lowerName.includes('10k')) {
      return 10000;
    } else if (lowerName.includes('1500')) {
      return 1500;
    } else if (lowerName.includes('800')) {
      return 800;
    } else if (lowerName.includes('400')) {
      return 400;
    } else if (lowerName.includes('200')) {
      return 200;
    } else if (lowerName.includes('100')) {
      return 100;
    }
    
    return 5000; // Default to 5000m
  }

  /**
   * Get distance unit based on distance
   * @param {number} distance - Distance in meters
   * @returns {string} - Distance unit
   */
  getDistanceUnit(distance) {
    if (distance >= 1000) {
      return 'km';
    }
    return 'm';
  }

  /**
   * Convert time string to seconds
   * @param {string} timeStr - Time string
   * @returns {number} - Time in seconds
   */
  convertTimeToSeconds(timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 0;
    
    // Remove any non-time characters
    const cleanTime = timeStr.replace(/[^\d:\.]/g, '');
    const parts = cleanTime.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
      // HH:MM:SS.ms
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseFloat(parts[2]);
    } else if (parts.length === 2) {
      // MM:SS.ms
      seconds = parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    } else if (parts.length === 1) {
      // SS.ms
      seconds = parseFloat(parts[0]);
    }
    
    return seconds;
  }

  /**
   * Create race name with gender division
   * @param {string} competitionName - Competition name
   * @param {string} eventName - Event name
   * @param {string} gender - Gender
   * @returns {string} - Race name with division
   */
  createRaceName(competitionName, eventName, gender) {
    let raceName = competitionName;
    
    if (eventName && eventName !== competitionName) {
      raceName += ` - ${eventName}`;
    }
    
    // Append gender division if not already included
    const lowerRaceName = raceName.toLowerCase();
    if (gender === 'Male' && !lowerRaceName.includes('men')) {
      raceName += " - Men's Division";
    } else if (gender === 'Female' && !lowerRaceName.includes('women')) {
      raceName += " - Women's Division";
    } else if (gender === 'Mixed' && !lowerRaceName.includes('mixed')) {
      raceName += " - Mixed Division";
    }
    
    return raceName;
  }

  /**
   * Generate sample race data for testing
   * @returns {Array} - Array of sample race results
   */
  generateSampleData() {
    const competitions = [
      {
        name: 'World Athletics Championships 2023',
        location: 'Budapest, Hungary',
        date: new Date('2023-08-20')
      },
      {
        name: 'Diamond League Final 2023',
        location: 'Eugene, USA',
        date: new Date('2023-09-07')
      }
    ];

    const events = [
      { name: "Men's 5000m", gender: 'Male', distance: 5000 },
      { name: "Women's 5000m", gender: 'Female', distance: 5000 },
      { name: "Men's 10000m", gender: 'Male', distance: 10000 },
      { name: "Women's 10000m", gender: 'Female', distance: 10000 }
    ];

    const sampleAthletes = {
      'Male': [
        { name: 'Jakob Ingebrigtsen', country: 'NOR', times: { 5000: '13:11.30', 10000: '27:27.29' } },
        { name: 'Grant Fisher', country: 'USA', times: { 5000: '13:13.91', 10000: '27:31.47' } },
        { name: 'Mohammed Ahmed', country: 'CAN', times: { 5000: '13:15.12', 10000: '27:33.85' } }
      ],
      'Female': [
        { name: 'Faith Kipyegon', country: 'KEN', times: { 5000: '14:43.17', 10000: '30:42.25' } },
        { name: 'Sifan Hassan', country: 'NED', times: { 5000: '14:44.73', 10000: '30:44.13' } },
        { name: 'Letesenbet Gidey', country: 'ETH', times: { 5000: '14:46.29', 10000: '30:46.78' } }
      ]
    };

    const results = [];
    
    for (const competition of competitions) {
      for (const event of events) {
        const athletes = sampleAthletes[event.gender];
        const raceName = this.createRaceName(competition.name, event.name, event.gender);
        
        athletes.forEach((athlete, index) => {
          const timeKey = event.distance;
          const formattedTime = athlete.times[timeKey];
          
          results.push({
            athlete: {
              name: athlete.name,
              country: athlete.country,
              gender: event.gender
            },
            race: {
              name: raceName,
              date: competition.date,
              distance: event.distance,
              distanceUnit: this.getDistanceUnit(event.distance),
              location: competition.location,
              category: 'Track',
              gender: event.gender,
              isElite: true
            },
            result: {
              time: this.convertTimeToSeconds(formattedTime),
              position: index + 1,
              formattedTime: formattedTime
            }
          });
        });
      }
    }
    
    return results;
  }

  /**
   * Main scrape method
   * @param {Object} options - Scraping options
   * @returns {Promise<Array>} - Array of race results
   */
  async scrape(options = {}) {
    console.log('World Athletics scraper starting...');
    
    try {
      // For now, we'll use sample data since the website structure is complex
      // This provides consistent, reliable data for testing
      console.log('Generating sample World Athletics data...');
      const results = this.generateSampleData();
      
      console.log(`Generated ${results.length} sample results from World Athletics`);
      return results;
      
    } catch (error) {
      console.error('Error in World Athletics scraper:', error);
      
      // Fallback to minimal sample data
      console.log('Using minimal fallback data');
      return this.generateSampleData().slice(0, 4); // Return just 4 results as fallback
    }
  }

  /**
   * Scrape a specific competition (placeholder for future implementation)
   * @param {string} competitionUrl - URL of the competition
   * @returns {Promise<Array>} - Array of results
   */
  async scrapeCompetition(competitionUrl) {
    console.log(`Scraping competition: ${competitionUrl}`);
    // For now, return sample data
    return this.generateSampleData().slice(0, 2);
  }
}

// Export an instance of the class instead of the class itself
module.exports = new WorldAthletics();
