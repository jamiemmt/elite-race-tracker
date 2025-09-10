const BaseScraper = require('../BaseScraper');
const axios = require('axios');
const cheerio = require('cheerio');

/**
 * FloTrack Diamond League Results Scraper
 * Extracts real 2025 Diamond League results from FloTrack articles
 */
class FloTrackDiamondLeague extends BaseScraper {
  constructor() {
    super('flotrackDiamondLeague', 'https://www.flotrack.org');
  }

  parseGender(eventName) {
    if (!eventName) return 'Mixed';
    const lower = eventName.toLowerCase();
    if (lower.includes("women's") || lower.includes("women")) return 'Female';
    if (lower.includes("men's") || lower.includes("men")) return 'Male';
    return 'Mixed';
  }

  parseDistance(eventName) {
    if (!eventName) return 0;
    const lower = eventName.toLowerCase();
    
    // Extract distance patterns
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

  extractResultsFromText(text, eventName, meetingName, meetingDate, location) {
    const results = [];
    
    // Clean the text first - remove timestamps and extra formatting
    const cleanText = text.replace(/\d{1,2}:\d{2}\s*[AP]M\s*ET\s*/gi, '').replace(/\s+/g, ' ').trim();
    
    // More precise patterns for athlete results
    const patterns = [
      // "Noah Lyles just barely notches his fifth 200m Diamond League title in Zürich by .02 with a time of 19.74!"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z']+)+).*?(?:wins?|takes?|notches?).*?(?:with a time of|in)\s+([\d:\.]+)/gi,
      
      // "Brittany Brown punches her ticket to the World Championships with her win in the 200m in Zürich with a season's best of 22.13!"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z']+)+).*?(?:wins?|win).*?(?:with.*?of|in)\s+([\d:\.]+)/gi,
      
      // "Letsile Tebogo in second with an equalized seasons best of 19.76"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z']+)+)\s+in\s+(first|second|third|fourth|fifth|sixth|seventh|eighth|\d+(?:st|nd|rd|th)?)\s+.*?(?:with|in)\s+([\d:\.]+)/gi,
      
      // "Dina Asher-Smith in second with 22.18 and Marie-Josèe Ta Lou-Smith in third with 22.18!"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z'-]+)+)\s+(?:was\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|\d+(?:st|nd|rd|th)?)\s+(?:in|with)\s+([\d:\.]+)/gi,
      
      // "Max Burgin was second in 1:42.21, followed by Marco Arop (1:42.57)"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+(?:was\s+)?(first|second|third|fourth|fifth|sixth|seventh|eighth|\d+(?:st|nd|rd|th)?)\s+in\s+([\d:\.]+)/gi,
      
      // "followed by Marco Arop (1:42.57)"
      /followed by\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s+\(([\d:\.]+)\)/gi,
      
      // "Christian Coleman wins his third Diamond League title (2018, 2023) in the men's 100m, running 9.97"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+).*?running\s+([\d:\.]+)/gi,
      
      // "Emmanuel Wanyonyi wins his first Diamond League title, taking the men's 800m in 1:42.37"
      /([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+).*?(?:taking|wins).*?in\s+([\d:\.]+)/gi
    ];

    const positionMap = {
      'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
      'sixth': 6, 'seventh': 7, 'eighth': 8,
      '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5,
      '6th': 6, '7th': 7, '8th': 8
    };

    const foundAthletes = new Set(); // Prevent duplicates
    
    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(cleanText)) !== null) {
        let name = match[1]?.trim();
        let posText = match[2]?.toLowerCase();
        let time = match[3] || match[2]; // Handle different capture groups
        
        // Skip if no valid name or time
        if (!name || !time || name.length < 3) continue;
        
        // Clean up name - remove common parsing artifacts
        name = name.replace(/^(s\s+|ET\s+|PM\s+|AM\s+)/gi, '').trim();
        name = name.replace(/\s+(wins?|takes?|was|in|with).*$/gi, '').trim();
        
        // Skip if name contains obvious parsing errors
        if (name.match(/^\d+[ap]?\s*ET$/i) || 
            name.match(/^(wins?|takes?|was|in|with|and|the|a|an)$/i) ||
            name.length < 3 ||
            foundAthletes.has(name.toLowerCase())) {
          continue;
        }
        
        // Clean up time
        time = time.replace(/[^\d:\.]/g, '');
        if (!time.match(/^\d+(?::\d+)?(?:\.\d+)?$/)) continue;
        
        // Determine position
        let pos = 1;
        if (posText && positionMap[posText]) {
          pos = positionMap[posText];
        } else if (cleanText.toLowerCase().includes(name.toLowerCase()) && 
                   (cleanText.toLowerCase().includes('wins') || cleanText.toLowerCase().includes('takes the title'))) {
          pos = 1;
        }
        
        foundAthletes.add(name.toLowerCase());
        
        const gender = this.parseGender(eventName);
        const distance = this.parseDistance(eventName);
        const category = this.parseCategory(eventName);
        
        results.push({
          athlete: {
            name: name,
            country: 'UNK', // FloTrack doesn't always include country
            gender: gender
          },
          race: {
            name: `${meetingName} - ${eventName}`,
            location: location,
            date: new Date(meetingDate),
            distance: distance,
            distanceUnit: 'm',
            category: category,
            gender: gender,
            isElite: true
          },
          result: {
            time: this.convertTimeToSeconds(time),
            position: pos,
            formattedTime: time
          }
        });
      }
    }
    
    return results;
  }

  async scrape(options = {}) {
    const { topN = 20 } = options;
    const results = [];
    
    // Known FloTrack Diamond League 2025 articles
    const articles = [
      'https://www.flotrack.org/articles/14478510-zurich-diamond-league-2025-live-updates-news-results',
      // Add more as we find them
    ];
    
    for (const url of articles) {
      try {
        console.log(`Scraping FloTrack article: ${url}`);
        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const $ = cheerio.load(response.data);
        const title = $('title').text() || '';
        const content = $('body').text();
        
        // Extract meeting info from title/content
        let meetingName = 'Diamond League 2025';
        let meetingDate = '2025-08-28';
        let location = 'Zurich, Switzerland';
        
        if (title.includes('Zürich') || content.includes('Zürich')) {
          meetingName = 'Zurich Diamond League 2025';
          location = 'Zurich, Switzerland';
          meetingDate = '2025-08-28';
        }
        
        // Extract events and results from the content
        const eventSections = [
          { name: "Men's 200m", text: content.match(/Men's 200[\s\S]*?(?=Women's 200|Men's 800|$)/i)?.[0] || '' },
          { name: "Women's 200m", text: content.match(/Women's 200[\s\S]*?(?=Men's 800|Men's 3000|$)/i)?.[0] || '' },
          { name: "Men's 800m", text: content.match(/Men's 800m[\s\S]*?(?=Women's 800|Men's 3000|$)/i)?.[0] || '' },
          { name: "Women's 800m", text: content.match(/Women's 800m[\s\S]*?(?=Men's 3000|Men's 400m|$)/i)?.[0] || '' },
          { name: "Men's 3000m", text: content.match(/Men's 3000m[\s\S]*?(?=Men's 400m Hurdles|Women's 400m|$)/i)?.[0] || '' },
          { name: "Men's 400m Hurdles", text: content.match(/Men's 400m Hurdles[\s\S]*?(?=Women's 400m Hurdles|Men's 100m|$)/i)?.[0] || '' },
          { name: "Women's 400m Hurdles", text: content.match(/Women's 400m Hurdles[\s\S]*?(?=Men's 100m|Women's 3000m|$)/i)?.[0] || '' },
          { name: "Men's 100m", text: content.match(/Men's 100m[\s\S]*?(?=Women's 3000m Steeplechase|Men's 1500m|$)/i)?.[0] || '' },
          { name: "Women's 3000m Steeplechase", text: content.match(/Women's 3000m Steeplechase[\s\S]*?(?=Men's 1500m|Women's 1500m|$)/i)?.[0] || '' },
          { name: "Men's 1500m", text: content.match(/Men's 1500m[\s\S]*?(?=Women's 1500m|Men's 110m|$)/i)?.[0] || '' },
          { name: "Women's 1500m", text: content.match(/Women's 1500m[\s\S]*?(?=Men's 110m Hurdles|Women's 100m|$)/i)?.[0] || '' },
          { name: "Men's 110m Hurdles", text: content.match(/Men's 110m Hurdles[\s\S]*?(?=Women's 100m Hurdles|$)/i)?.[0] || '' },
          { name: "Women's 100m Hurdles", text: content.match(/Women's 100m Hurdles[\s\S]*?(?=Women's 3000m|Men's|$)/i)?.[0] || '' }
        ];
        
        for (const event of eventSections) {
          if (event.text) {
            const eventResults = this.extractResultsFromText(
              event.text, 
              event.name, 
              meetingName, 
              meetingDate, 
              location
            );
            results.push(...eventResults);
          }
        }
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error.message);
      }
    }
    
    // Limit results per event
    const limitedResults = [];
    const eventGroups = {};
    
    for (const result of results) {
      const eventKey = `${result.race.name}_${result.race.gender}`;
      if (!eventGroups[eventKey]) {
        eventGroups[eventKey] = [];
      }
      eventGroups[eventKey].push(result);
    }
    
    for (const eventKey in eventGroups) {
      const eventResults = eventGroups[eventKey]
        .sort((a, b) => a.result.position - b.result.position)
        .slice(0, topN);
      limitedResults.push(...eventResults);
    }
    
    console.log(`FloTrack scraper found ${limitedResults.length} results`);
    return limitedResults;
  }
}

module.exports = new FloTrackDiamondLeague();
