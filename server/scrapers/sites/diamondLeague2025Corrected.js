const BaseScraper = require('../BaseScraper');

/**
 * Corrected Diamond League 2025 Results Scraper
 * Contains validated, clean results with Jakob Ingebrigtsen entries removed
 */
class DiamondLeague2025Corrected extends BaseScraper {
  constructor() {
    super('diamondLeague2025Corrected', 'https://diamondleague.com');
  }

  async scrape(options = {}) {
    const results = [];
    
    // Zurich Diamond League Final - August 27-28, 2025
    // Corrected results with Jakob Ingebrigtsen removed from events he didn't compete in
    const zurichResults = [
      // Men's 100m
      { name: 'Christian Coleman', country: 'USA', event: "Men's 100m", time: '9.97', position: 1 },
      { name: 'Akani Simbine', country: 'RSA', event: "Men's 100m", time: '9.98', position: 2 },
      { name: 'Ackeem Blake', country: 'JAM', event: "Men's 100m", time: '9.99', position: 3 },
      { name: 'Trayvon Bromell', country: 'USA', event: "Men's 100m", time: '10.14', position: 6 },
      
      // Men's 200m
      { name: 'Noah Lyles', country: 'USA', event: "Men's 200m", time: '19.74', position: 1 },
      { name: 'Letsile Tebogo', country: 'BOT', event: "Men's 200m", time: '19.76', position: 2 },
      { name: 'Alexander Ogando', country: 'DOM', event: "Men's 200m", time: '20.14', position: 3 },
      
      // Women's 200m
      { name: 'Brittany Brown', country: 'USA', event: "Women's 200m", time: '22.13', position: 1 },
      { name: 'Dina Asher-Smith', country: 'GBR', event: "Women's 200m", time: '22.18', position: 2 },
      { name: 'Marie-Josée Ta Lou-Smith', country: 'CIV', event: "Women's 200m", time: '22.18', position: 3 },
      
      // Men's 800m
      { name: 'Emmanuel Wanyonyi', country: 'KEN', event: "Men's 800m", time: '1:42.37', position: 1 },
      { name: 'Max Burgin', country: 'GBR', event: "Men's 800m", time: '1:42.21', position: 2 },
      { name: 'Marco Arop', country: 'CAN', event: "Men's 800m", time: '1:42.57', position: 3 },
      { name: 'Bryce Hoppel', country: 'USA', event: "Men's 800m", time: '1:43.78', position: 7 },
      { name: 'Josh Hoey', country: 'USA', event: "Men's 800m", time: '1:44.25', position: 8 },
      
      // Women's 800m
      { name: 'Audrey Werro', country: 'SUI', event: "Women's 800m", time: '1:55.91', position: 1 },
      { name: 'Georgia Hunter Bell', country: 'AUS', event: "Women's 800m", time: '1:55.96', position: 2 },
      { name: 'Anaïs Bourgoin', country: 'FRA', event: "Women's 800m", time: '1:56.97', position: 3 },
      
      // Men's 1500m
      { name: 'Niels Laros', country: 'NED', event: "Men's 1500m", time: '3:29.20', position: 1 },
      { name: 'Yared Nuguse', country: 'USA', event: "Men's 1500m", time: '3:30.84', position: 7 },
      
      // Women's 1500m
      { name: 'Nelly Chepchirchir', country: 'KEN', event: "Women's 1500m", time: '3:56.99', position: 1 },
      { name: 'Jessica Hull', country: 'AUS', event: "Women's 1500m", time: '3:57.02', position: 2 },
      { name: 'Linden Hall', country: 'AUS', event: "Women's 1500m", time: '3:57.44', position: 3 },
      { name: 'Sinclaire Johnson', country: 'USA', event: "Women's 1500m", time: '3:57.80', position: 4 },
      { name: 'Heather MacLean', country: 'USA', event: "Women's 1500m", time: '3:59.43', position: 5 },
      
      // Men's 3000m
      { name: 'Jimmy Gressier', country: 'FRA', event: "Men's 3000m", time: '7:36.78', position: 1 },
      { name: 'Grant Fisher', country: 'USA', event: "Men's 3000m", time: '7:36.81', position: 2 },
      
      // Men's 110m Hurdles
      { name: 'Cordell Tinch', country: 'USA', event: "Men's 110m Hurdles", time: '12.92', position: 1 },
      { name: 'Enrique Llopis', country: 'ESP', event: "Men's 110m Hurdles", time: '13.12', position: 2 },
      { name: 'Jamal Britt', country: 'USA', event: "Men's 110m Hurdles", time: '13.21', position: 3 },
      
      // Men's 400m Hurdles
      { name: 'Karsten Warholm', country: 'NOR', event: "Men's 400m Hurdles", time: '46.70', position: 1 },
      { name: 'Abderrahman Samba', country: 'QAT', event: "Men's 400m Hurdles", time: '47.45', position: 2 },
      { name: 'Ezekiel Nathaniel', country: 'NGR', event: "Men's 400m Hurdles", time: '47.56', position: 3 },
      { name: 'CJ Allen', country: 'USA', event: "Men's 400m Hurdles", time: '48.00', position: 4 },
      { name: 'Trevor Bassitt', country: 'USA', event: "Men's 400m Hurdles", time: '48.29', position: 6 },
      
      // Women's 400m Hurdles
      { name: 'Femke Bol', country: 'NED', event: "Women's 400m Hurdles", time: '52.18', position: 1 },
      
      // Women's 3000m Steeplechase
      { name: 'Faith Cherotich', country: 'KEN', event: "Women's 3000m Steeplechase", time: '8:57.24', position: 1 },
      { name: 'Courtney Wayment', country: 'USA', event: "Women's 3000m Steeplechase", time: '9:14.91', position: 4 },
      { name: 'Gabrielle Jennings', country: 'USA', event: "Women's 3000m Steeplechase", time: '9:15.56', position: 5 }
      
      // NOTE: Jakob Ingebrigtsen entries removed as he did not compete in Diamond League Final 2025
    ];

    const raceDate = new Date('2025-08-28');
    
    // Validate and process each result
    for (const athlete of zurichResults) {
      // Strict validation - reject any malformed data
      if (!this.isValidAthleteName(athlete.name)) {
        console.warn(`Skipping invalid athlete name: ${athlete.name}`);
        continue;
      }
      
      if (!this.isValidTime(athlete.time)) {
        console.warn(`Skipping invalid time: ${athlete.time} for ${athlete.name}`);
        continue;
      }
      
      if (!this.isValidCountry(athlete.country)) {
        console.warn(`Skipping invalid country: ${athlete.country} for ${athlete.name}`);
        continue;
      }
      
      const gender = athlete.event.includes("Women's") ? 'Female' : 'Male';
      const distance = this.parseDistance(athlete.event);
      const category = this.parseCategory(athlete.event);
      
      results.push({
        athlete: {
          name: athlete.name.trim(),
          country: athlete.country.trim(),
          gender: gender
        },
        race: {
          name: `Zurich Diamond League Final 2025 - ${athlete.event}`,
          location: 'Zurich, Switzerland',
          date: raceDate,
          distance: distance,
          distanceUnit: 'm',
          category: category,
          gender: gender,
          isElite: true
        },
        result: {
          time: this.convertTimeToSeconds(athlete.time),
          position: athlete.position,
          formattedTime: athlete.time.trim()
        }
      });
    }

    console.log(`DiamondLeague2025Corrected: Processed ${results.length} clean results (Jakob Ingebrigtsen entries removed)`);
    return results;
  }

  // Strict validation methods
  isValidAthleteName(name) {
    if (!name || typeof name !== 'string') return false;
    
    const cleaned = name.trim();
    
    // Must be at least 3 characters
    if (cleaned.length < 3) return false;
    
    // Must not contain numbers, artifacts, or suspicious patterns
    if (/\d/.test(cleaned)) return false;
    if (/WHAT$/i.test(cleaned)) return false;
    if (/finished$/i.test(cleaned)) return false;
    if (/^\d+p\s+ET/i.test(cleaned)) return false;
    
    // Must contain at least one letter
    if (!/[a-zA-Z]/.test(cleaned)) return false;
    
    return true;
  }

  isValidTime(time) {
    if (!time || typeof time !== 'string') return false;
    
    const cleaned = time.trim();
    
    // Must match valid time patterns: 9.97, 1:42.37, 13:01.60
    return /^\d+:?\d*\.?\d*$/.test(cleaned) && cleaned.length >= 3;
  }

  isValidCountry(country) {
    if (!country || typeof country !== 'string') return false;
    
    const cleaned = country.trim();
    
    // Must be 2-3 character country code
    return /^[A-Z]{2,3}$/.test(cleaned);
  }

  parseDistance(eventName) {
    if (!eventName) return 0;
    const lower = eventName.toLowerCase();
    
    if (lower.includes('100m') && !lower.includes('hurdles')) return 100;
    if (lower.includes('200m')) return 200;
    if (lower.includes('400m') && !lower.includes('hurdles')) return 400;
    if (lower.includes('800m')) return 800;
    if (lower.includes('1500m')) return 1500;
    if (lower.includes('3000m')) return 3000;
    if (lower.includes('5000m')) return 5000;
    if (lower.includes('10000m') || lower.includes('10km')) return 10000;
    if (lower.includes('110m hurdles')) return 110;
    if (lower.includes('100m hurdles')) return 100;
    if (lower.includes('400m hurdles')) return 400;
    if (lower.includes('3000m steeplechase')) return 3000;
    
    return 0;
  }

  parseCategory(eventName) {
    if (!eventName) return 'Track';
    const lower = eventName.toLowerCase();
    
    if (lower.includes('shot put') || lower.includes('discus') || 
        lower.includes('hammer') || lower.includes('javelin') ||
        lower.includes('long jump') || lower.includes('high jump') ||
        lower.includes('pole vault') || lower.includes('triple jump')) {
      return 'Field';
    }
    
    return 'Track';
  }
}

module.exports = new DiamondLeague2025Corrected();
