/**
 * Boston Marathon Results Scraper - V2
 * Scrapes top 100 results for men, women, and nonbinary categories
 */

const axios = require('axios');
const cheerio = require('cheerio');

console.log('--- LOADING BOSTON MARATHON V2 SCRAPER - UNIQUE_ID: 12345 ---');

class BostonMarathonScraperV2 {
  constructor() {
    this.name = 'bostonmarathonv2';
    this.baseUrl = 'https://results.baa.org';
  }

  /**
   * Convert time string (HH:MM:SS) to seconds
   * @param {string} timeStr - Time string in format HH:MM:SS
   * @returns {number} - Time in seconds
   */
  convertTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    
    // Remove any non-time characters
    timeStr = timeStr.replace(/[^0-9:]/g, '').trim();
    
    const parts = timeStr.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
      // Format: HH:MM:SS
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      // Format: MM:SS
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 1 && parts[0]) {
      // Format: SS
      seconds = parseInt(parts[0]);
    }
    
    return seconds;
  }

  /**
   * Scrape specific gender category results
   * @param {number} year - Year to scrape
   * @param {string} gender - Gender to scrape ('M' for men, 'W' for women)
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - Array of results
   */
  async scrapeCategory(year, gender, limit) {
    try {
      // URL for the results page with gender filter
      const url = `${this.baseUrl}/${year}/?event=R&event_main_group=runner&num_results=${limit}&pid=list&pidp=start&search%5Bsex%5D=${gender}&search%5Bage_class%5D=%25`;
      
      console.log(`Scraping ${gender === 'M' ? 'men' : gender === 'W' ? 'women' : 'nonbinary'} results from ${url}`);
      
      // Fetch the page content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Parse the HTML content
      const $ = cheerio.load(response.data);
      const results = [];
      
      // Find each result row
      $('.list-group-item').each((index, element) => {
        // Skip header row
        if ($(element).hasClass('list-group-header')) return;
        
        // Skip if we've already reached our limit
        if (results.length >= limit) return false; // break out of each loop

        try {
          // Extract all the fields
          const overallPlace = $(element).find('.list-field.type-place.place-secondary.hidden-xs:first-child').text().trim();
          const genderPlace = $(element).find('.list-field.type-place.place-primary').text().trim();
          const divisionPlace = $(element).find('.list-field.type-place.place-secondary.hidden-xs').eq(1).text().trim();
          
          // Extract the name - it's in an h4 with a link inside
          const nameElement = $(element).find('.list-field.type-fullname a');
          const name = nameElement.text().trim();
          
          // Parse the splits and times
          const splitElements = $(element).find('.split.list-field.type-time');
          const halfSplit = splitElements.eq(0).text().replace('HALF', '').trim();
          const netFinish = splitElements.eq(1).text().replace('Finish Net', '').trim();
          const gunFinish = splitElements.eq(2).text().replace('Finish Gun', '').trim();
          
          // Process name
          let firstName = '';
          let lastName = '';
          
          if (name.includes(',')) {
            const nameParts = name.split(',');
            lastName = nameParts[0].trim();
            firstName = nameParts[1]?.trim() || '';
          } else {
            const nameParts = name.split(' ');
            firstName = nameParts[0].trim();
            lastName = nameParts.slice(1).join(' ').trim();
          }
          
          // Map gender code to full name (map Nonbinary to 'Other' for schema compatibility)
          const fullGender = gender === 'M' ? 'Male' : gender === 'W' ? 'Female' : 'Other';
          // For Race model, gender must be 'Male', 'Female', or 'Mixed'
          const raceGender = (fullGender === 'Other') ? 'Mixed' : fullGender;
          
          // Validate all required athlete and race fields
          const athleteName = `${firstName} ${lastName}`.trim();
          const athleteCountry = 'Unknown'; // Boston results don't show country in the list view
          const requiredAthleteFields = [athleteName, athleteCountry, fullGender];
          const division = fullGender === 'Male' ? 'Men' : fullGender === 'Female' ? 'Women' : 'Non-binary';
          const requiredRaceFields = [
            `Boston Marathon ${year} - ${division}'s Division`,
            'Boston, MA, USA',
            new Date(`April 15, ${year}`),
            42195,
            'm',
            'Road',
            fullGender
          ];
          if (
            requiredAthleteFields.some(f => !f || f === '') ||
            requiredRaceFields.some(f => f === undefined || f === null || f === '') ||
            !netFinish
          ) {
            console.log(
              `Skipping entry with missing required fields: `,
              JSON.stringify({
                name: athleteName,
                country: athleteCountry,
                gender: fullGender,
                raceName: `Boston Marathon ${year}`,
                location: 'Boston, MA, USA',
                date: new Date(`April 15, ${year}`),
                distance: 42195,
                distanceUnit: 'm',
                category: 'Road',
                genderRace: fullGender,
                netFinish
              }, null, 2)
            );
            return;
          }

          // Create a result object with the correct schema for our database
          const result = {
            athlete: {
              name: athleteName,
              country: athleteCountry,
              gender: fullGender
            },
            race: {
              name: `Boston Marathon ${year} - ${division}'s Division`,
              location: 'Boston, MA, USA',
              date: new Date(`April 15, ${year}`), // Boston Marathon is typically mid-April
              distance: 42195, // Marathon distance in meters
              distanceUnit: 'm',
              category: 'Road',
              gender: fullGender,
              isElite: true
            },
            position: parseInt(overallPlace) || null,
            genderPosition: parseInt(genderPlace) || null,
            divisionPosition: parseInt(divisionPlace) || null,
            halfSplit: this.convertTimeToSeconds(halfSplit),
            formattedTime: netFinish,
            finishTime: this.convertTimeToSeconds(netFinish),
            gunTime: this.convertTimeToSeconds(gunFinish)
          };
          
          results.push(result);
        } catch (err) {
          console.error('Error parsing result row:', err);
        }
      });
      
      console.log(`Found ${results.length} ${gender === 'M' ? 'men' : gender === 'W' ? 'women' : 'nonbinary'} results`);
      return results;
    } catch (error) {
      console.error(`Error scraping ${gender === 'M' ? 'men' : gender === 'W' ? 'women' : 'nonbinary'} results:`, error);
      return [];
    }
  }

  /**
   * Scrape nonbinary results
   * @param {number} year - Year to scrape
   * @param {number} limit - Maximum number of results
   * @returns {Promise<Array>} - Array of results
   */
  async scrapeNonbinary(year, limit) {
    try {
      // For nonbinary, we need a different approach since there's no direct filter
      // We'll look for entries where gender place is "–" or missing
      const url = `${this.baseUrl}/${year}/?pid=list&pidp=start`;
      
      console.log(`Scraping nonbinary results from ${url}`);
      
      // Fetch the page content
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });
      
      // Parse the HTML content
      const $ = cheerio.load(response.data);
      const results = [];
      
      // Find each result row
      $('.list-group-item').each((index, element) => {
        // Skip header row
        if ($(element).hasClass('list-group-header')) return;
        
        // Skip if we've already reached our limit
        if (results.length >= limit) return false; // break out of each loop

        try {
          const genderPlace = $(element).find('.list-field.type-place.place-primary').text().trim();
          const divisionPlace = $(element).find('.list-field.type-place.place-secondary.hidden-xs').eq(1).text().trim();
          
          // Only process rows where genderPlace is "–" or divisionPlace is "–"
          // These are likely nonbinary entries
          if (genderPlace === '–' || divisionPlace === '–') {
            const overallPlace = $(element).find('.list-field.type-place.place-secondary.hidden-xs:first-child').text().trim();
            
            // Extract the name - it's in an h4 with a link inside
            const nameElement = $(element).find('.list-field.type-fullname a');
            const name = nameElement.text().trim();
            
            // Parse the splits and times
            const splitElements = $(element).find('.split.list-field.type-time');
            const halfSplit = splitElements.eq(0).text().replace('HALF', '').trim();
            const netFinish = splitElements.eq(1).text().replace('Finish Net', '').trim();
            const gunFinish = splitElements.eq(2).text().replace('Finish Gun', '').trim();
            
            // Process name
            let firstName = '';
            let lastName = '';
            
            if (name.includes(',')) {
              const nameParts = name.split(',');
              lastName = nameParts[0].trim();
              firstName = nameParts[1]?.trim() || '';
            } else {
              const nameParts = name.split(' ');
              firstName = nameParts[0].trim();
              lastName = nameParts.slice(1).join(' ').trim();
            }
            
            // Validate all required athlete and race fields
            const athleteCountry = 'Unknown';
            const athleteName = `${firstName} ${lastName}`.trim();
            const requiredAthleteFields = [athleteName, athleteCountry, 'Other'];
            const requiredRaceFields = [
              `Boston Marathon ${year}`,
              'Boston, MA, USA',
              new Date(`April 15, ${year}`),
              42195,
              'm',
              'Road',
              'Mixed'
            ];
            if (
              requiredAthleteFields.some(f => !f || f === '') ||
              requiredRaceFields.some(f => f === undefined || f === null || f === '') ||
              !netFinish
            ) {
              console.log(
                `Skipping nonbinary entry with missing required fields: `,
                JSON.stringify({
                  name: athleteName,
                  country: athleteCountry,
                  gender: 'Other',
                  raceName: `Boston Marathon ${year}`,
                  location: 'Boston, MA, USA',
                  date: new Date(`April 15, ${year}`),
                  distance: 42195,
                  distanceUnit: 'm',
                  category: 'Road',
                  genderRace: 'Other',
                  netFinish
                }, null, 2)
              );
              return;
            }

            // Create a result object with the correct schema for our database
            const result = {
              athlete: {
                name: athleteName,
                country: athleteCountry,
                gender: 'Other' // Map Nonbinary to 'Other' for Athlete schema compatibility
              },
              race: {
                name: `Boston Marathon ${year}`,
                location: 'Boston, MA, USA',
                date: new Date(`April 15, ${year}`), // Boston Marathon is typically mid-April
                distance: 42195, // Marathon distance in meters
                distanceUnit: 'm',
                category: 'Road',
                gender: 'Mixed', // Map Nonbinary to 'Mixed' for Race model compatibility
                isElite: true
              },
              position: parseInt(overallPlace) || null,
              genderPosition: null, // No gender position for nonbinary
              divisionPosition: null,
              halfSplit: this.convertTimeToSeconds(halfSplit),
              formattedTime: netFinish,
              finishTime: this.convertTimeToSeconds(netFinish),
              gunTime: this.convertTimeToSeconds(gunFinish)
            };
            
            results.push(result);
          }
        } catch (err) {
          console.error('Error parsing nonbinary result row:', err);
        }
      });
      
      console.log(`Found ${results.length} nonbinary results`);
      return results;
    } catch (error) {
      console.error('Error scraping nonbinary results:', error);
      return [];
    }
  }

  /**
   * Main scrape function for Boston Marathon results
   * @param {Object} options - Scraper options
   * @param {number} options.year - Year to scrape (defaults to current year)
   * @param {number} options.limit - Maximum number of results per category (default 100)
   * @returns {Promise<Array>} - Array of result objects
   */
  async scrape(options = {}) {
    try {
      const year = options.year || new Date().getFullYear();
      const limit = options.limit || 100;
      
      console.log(`Scraping Boston Marathon ${year} top ${limit} results for men, women, and nonbinary categories...`);
      
      // Scrape results for each category in parallel
      const [maleResults, femaleResults, nonbinaryResults] = await Promise.all([
        this.scrapeCategory(year, 'M', limit),
        this.scrapeCategory(year, 'W', limit),
        this.scrapeNonbinary(year, limit)
      ]);
      
      console.log(`Total results: ${maleResults.length + femaleResults.length + nonbinaryResults.length}`);
      console.log(`- Men: ${maleResults.length}`);
      console.log(`- Women: ${femaleResults.length}`);
      console.log(`- Nonbinary: ${nonbinaryResults.length}`);
      
      // Combine all results
      return [...maleResults, ...femaleResults, ...nonbinaryResults];
    } catch (error) {
      console.error(`Error scraping Boston Marathon results:`, error);
      throw error;
    }
  }
}

module.exports = new BostonMarathonScraperV2();
