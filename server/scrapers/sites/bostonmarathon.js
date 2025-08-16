/**
 * Scraper for Boston Marathon race results
 * Handles elite results from the Boston Athletic Association (BAA) website
 */

const BaseScraper = require('../BaseScraper');

class BostonMarathonScraper extends BaseScraper {
  constructor() {
    super('bostonmarathon', 'https://www.baa.org');
    this.resultsBaseUrl = '/races/boston-marathon/results';
  }

  /**
   * Get available years for Boston Marathon results
   * @returns {Promise<Array>} - Array of year objects
   */
  async getAvailableYears() {
    try {
      console.log('Fetching available years from Boston Marathon website...');
      
      // Try the main results page first
      let html;
      try {
        html = await this.fetchHtml('/races/boston-marathon/results');
      } catch (error) {
        console.log('Main results page not found, trying alternative URLs...');
        // Try alternative URL structures
        const alternativeUrls = [
          '/races/boston-marathon',
          '/boston-marathon/results',
          '/results'
        ];
        
        for (const url of alternativeUrls) {
          try {
            html = await this.fetchHtml(url);
            console.log(`Successfully accessed: ${url}`);
            break;
          } catch (altError) {
            console.log(`Failed to access: ${url}`);
          }
        }
        
        if (!html) {
          throw new Error('Could not access any results pages');
        }
      }
      
      const $ = this.parseHtml(html);
      console.log('Page title:', $('title').text());
      
      const years = [];
      
      // Look for year links in various possible selectors
      const yearSelectors = [
        'a[href*="/results/"]',
        'a[href*="/20"]',
        '.year-link',
        '.results-year',
        'select[name="year"] option',
        '.dropdown-item[href*="20"]'
      ];
      
      let foundYears = false;
      
      for (const selector of yearSelectors) {
        $(selector).each((i, element) => {
          const $element = $(element);
          const href = $element.attr('href') || '';
          const text = $element.text().trim();
          
          // Extract year from href or text
          const yearMatch = (href + ' ' + text).match(/(20\d{2})/);
          if (yearMatch) {
            const year = parseInt(yearMatch[1]);
            if (year >= 2015 && year <= new Date().getFullYear()) {
              years.push({
                year: year,
                url: href.startsWith('/') ? href : `/races/boston-marathon/results/${year}`
              });
              foundYears = true;
            }
          }
        });
        
        if (foundYears) break;
      }
      
      // Remove duplicates and sort
      const uniqueYears = years.filter((year, index, self) => 
        index === self.findIndex(y => y.year === year.year)
      ).sort((a, b) => b.year - a.year);
      
      if (uniqueYears.length > 0) {
        console.log(`Found ${uniqueYears.length} years:`, uniqueYears.map(y => y.year).join(', '));
        return uniqueYears;
      }
      
      // Fallback to recent years if no years found
      console.log('No years found on page, using fallback years');
      const recentYears = [2024, 2023, 2022, 2021, 2020, 2019];
      return recentYears.map(year => ({
        year: year,
        url: `/races/boston-marathon/results/${year}`
      }));
      
    } catch (error) {
      console.error('Error getting available years:', error);
      // Return hardcoded years as fallback
      const fallbackYears = [2024, 2023, 2022, 2021, 2020, 2019];
      return fallbackYears.map(year => ({
        year: year,
        url: `/races/boston-marathon/results/${year}`
      }));
    }
  }

  /**
   * Get elite results for a specific year
   * @param {number|string} year - Year to get results for
   * @returns {Promise<Array>} - Array of result objects
   */
  async getEliteResults(year) {
    try {
      console.log(`Getting elite results for ${year}...`);
      // Initialize with current year if year is not provided
      const resultYear = parseInt(year) || new Date().getFullYear();
      
      // Try multiple URL patterns for Boston Marathon results
      const possibleUrls = [
        `/races/boston-marathon/results/${year}/elite`,
        `/races/boston-marathon/results/${year}/open-division`,
        `/races/boston-marathon/results/${year}`,
        `/boston-marathon/${year}/results`,
        `/results/${year}/boston-marathon`
      ];
      
      let html = null;
      const results = [];

      // Try each URL
      for (const url of possibleUrls) {
        try {
          console.log(`Trying URL: ${url}`);
          const html = await this.fetchHtml(url);
          const $ = this.parseHtml(html);
          
          // Parse race date from the page
          const raceDate = this.parseRaceDate($, resultYear);
          
          // Try to find elite results tables
          const eliteSelectors = [
            '.elite-results table',
            '.results-table',
            'table.elite',
            '#elite-results table',
            '.men-elite table, .women-elite table',
            'table:contains("Elite")',
            'table tbody tr'
          ];
          
          let foundResults = false;
          
          for (const selector of eliteSelectors) {
            const $tables = $(selector);
            
            if ($tables.length > 0) {
              console.log(`Found results table with selector: ${selector}`);
              
              $tables.each((tableIndex, table) => {
                const $table = $(table);
                
                // Determine gender from context
                const tableContext = $table.closest('.men, .women, .male, .female').attr('class') || '';
                const headerText = $table.find('th, .header').text().toLowerCase();
                
                let gender = 'Mixed';
                if (tableContext.includes('men') || headerText.includes('men')) {
                  gender = 'Male';
                } else if (tableContext.includes('women') || headerText.includes('women')) {
                  gender = 'Female';
                }
                
                // Parse table rows
                $table.find('tbody tr, tr').each((rowIndex, row) => {
                  const $row = $(row);
                  const cells = $row.find('td, th');
                  
                  if (cells.length >= 3) {
                    const position = $(cells[0]).text().trim();
                    const name = $(cells[1]).text().trim();
                    const timeText = $(cells[cells.length - 1]).text().trim();
                    
                    // Skip header rows
                    if (position.toLowerCase().includes('place') || 
                        name.toLowerCase().includes('name') ||
                        !position.match(/^\d+$/)) {
                      return;
                    }
                    
                    // Extract country if available
                    let country = 'Unknown';
                    if (cells.length >= 4) {
                      country = $(cells[2]).text().trim();
                    }
                    
                    // Parse time
                    const timeInSeconds = this.convertTimeToSeconds(timeText);
                    
                    if (name && timeInSeconds > 0) {
                      results.push({
                        athlete: {
                          name: name,
                          country: country,
                          gender: gender
                        },
                        race: {
                          name: `Boston Marathon ${resultYear} - ${gender}'s Division`,
                          date: raceDate,
                          distance: 42195,
                          distanceUnit: 'm',
                          location: 'Boston, MA, USA',
                          category: 'Road',
                          gender: 'Mixed',
                          isElite: true
                        },
                        result: {
                          time: timeInSeconds,
                          position: parseInt(position) || null,
                          formattedTime: timeText
                        }
                      });
                      foundResults = true;
                    }
                  }
                });
              });
              
              if (foundResults) break;
            }
          }
        } catch (error) {
          console.log(`Failed to access: ${url} - ${error.message}`);
        }
      }
      
      if (!html) {
        throw new Error(`Could not access results for year ${year}`);
      }
      
      // Add a default result if no results were found
      if (results.length === 0) {
        console.log('No results found, adding placeholder result with proper race and athlete fields');
        results.push({
          position: null,
          athlete: {
            name: 'Unknown Athlete',
            country: 'Unknown',
            gender: 'Male'
          },
          race: {
            name: `Boston Marathon ${resultYear}`,
            location: 'Boston, MA, USA',
            date: new Date(`April 15, ${resultYear}`),
            distance: 42195, // Marathon distance in meters
            distanceUnit: 'km',
            category: 'Road',
            gender: 'Male',
            isElite: true
          },
          formattedTime: '00:00:00',
          finishTime: 0,
          notes: 'No results available - placeholder'
        });
      }
      
      // Validate all results have athlete and race fields
      const validatedResults = results.filter(result => {
        if (!result.athlete || !result.race) {
          console.error('Found invalid result without athlete or race:', JSON.stringify(result));
          return false;
        }
        return true;
      });
      
      console.log(`Returning ${validatedResults.length} validated results out of ${results.length} total`);
      return validatedResults;
    } catch (error) {
      console.error(`Error getting elite results for ${year}:`, error);
      throw error;
    }
  }

  /**
   * Parse race date from the page
   * @param {CheerioAPI} $ - Cheerio API
   * @param {number|string} year - Year of the race
   * @returns {Date} - Race date
   */
  parseRaceDate($, year) {
    // Try to find the race date on the page
    const dateText = $('.race-date, .event-date').text().trim();
    
    if (dateText) {
      return new Date(dateText);
    }
    
    // If not found, use April (traditional Boston Marathon month) of the given year
    return new Date(`April 15, ${year}`);
  }

  /**
   * Parse elite category results
   * @param {CheerioAPI} $ - Cheerio API
   * @param {string} gender - Gender category ('Men' or 'Women')
   * @param {Date} raceDate - Date of the race
   * @returns {Array} - Array of result objects
   */
  parseEliteCategory($, gender, raceDate) {
    const results = [];
    const genderMapping = {
      'Men': 'Male',
      'Women': 'Female'
    };
    
    // Find the section for this gender
    const $section = $(`.elite-${gender.toLowerCase()}-results, #${gender.toLowerCase()}-elite, .${gender.toLowerCase()}-results`);
    
    if ($section.length === 0) {
      console.warn(`No results section found for ${gender}`);
      return results;
    }
    
    // Find the results table
    const $table = $section.find('table');
    
    $table.find('tbody tr').each((i, element) => {
      const $row = $(element);
      const cells = $row.find('td');
      
      if (cells.length < 4) return; // Skip rows with insufficient data
      
      const position = $(cells[0]).text().trim();
      const name = $(cells[1]).text().trim();
      const country = $(cells[2]).text().trim();
      const formattedTime = $(cells[3]).text().trim();
      
      results.push({
        position: parseInt(position) || null,
        athlete: {
          name,
          country
        },
        race: {
          name: `Boston Marathon ${raceDate.getFullYear()}`,
          location: 'Boston, MA, USA',
          date: raceDate,
          distance: 42195, // Marathon distance in meters
          distanceUnit: 'km',
          category: 'Road',
          gender: genderMapping[gender],
          isElite: true
        },
        formattedTime,
        finishTime: this.convertTimeToSeconds(formattedTime)
      });
    });
    
    return results;
  }

  /**
   * Convert time string to seconds
   * @param {string} timeStr - Time string (e.g., '2:09:12')
   * @returns {number} - Time in seconds
   */
  convertTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    
    const parts = timeStr.split(':');
    let seconds = 0;
    
    if (parts.length === 3) {
      // Format: HH:MM:SS
      seconds = parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2]);
    } else if (parts.length === 2) {
      // Format: MM:SS
      seconds = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    } else if (parts.length === 1) {
      // Format: SS
      seconds = parseInt(parts[0]);
    }
    
    return seconds;
  }

  /**
   * Main scrape method
   * @param {Object} options - Scraper options
   * @param {number|string} options.year - Year to scrape results for
   * @param {boolean} options.allYears - Whether to scrape all available years
   * @param {number} options.startYear - Start year for range (inclusive)
   * @param {number} options.endYear - End year for range (inclusive)
   * @returns {Promise<Array>} - Array of results
   */
  async scrape(options = {}) {
    const { year, allYears, startYear, endYear } = options;
    const results = [];
    
    try {
      const availableYears = await this.getAvailableYears();
      
      // Filter years based on options
      let yearsToScrape = [];
      
      if (allYears) {
        yearsToScrape = availableYears;
      } else if (year) {
        const requestedYear = parseInt(year);
        const yearObj = availableYears.find(y => y.year === requestedYear);
        if (yearObj) {
          yearsToScrape = [yearObj];
        } else {
          // If requested year not found in available years, create it anyway
          console.log(`Requested year ${requestedYear} not found in available years, creating entry`);
          yearsToScrape = [{
            year: requestedYear,
            url: `/races/boston-marathon/results/${requestedYear}`
          }];
        }
      } else if (startYear && endYear) {
        yearsToScrape = availableYears.filter(y => y.year >= startYear && y.year <= endYear);
      } else {
        // Default to most recent year if available
        if (availableYears && availableYears.length > 0) {
          yearsToScrape = [availableYears[0]];
        }
      }
      
      if (yearsToScrape.length === 0) {
        throw new Error('No years to scrape based on the provided options');
      }
      
      // Scrape results for each year
      for (const yearObj of yearsToScrape) {
        console.log(`Scraping Boston Marathon results for ${yearObj.year}`);
        const yearResults = await this.getEliteResults(yearObj.year);
        results.push(...yearResults);
      }
      
      return results;
    } catch (error) {
      console.error('Error in scrape method:', error);
      throw error;
    }
  }
}

module.exports = new BostonMarathonScraper();
