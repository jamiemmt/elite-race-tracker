/**
 * Service for managing banned athlete detection and updates
 */

const Athlete = require('../models/Athlete');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');
const axios = require('axios');

class BannedAthleteService {
  constructor() {
    this.tempDir = path.join(__dirname, '../temp');
    this.aiuPdfUrl = 'https://www.athleticsintegrity.org/downloads/pdfs/disciplinary-process/en/Global-List-AUG_25.pdf';
    
    // Known banned athletes from Olympic medal stripping and major doping cases
    this.knownBannedAthletes = [
      // Russian state-sponsored doping program athletes
      { name: 'Mariya Savinova', country: 'RUS', reason: 'Olympic 800m gold stripped (2012)' },
      { name: 'Ekaterina Poistogova', country: 'RUS', reason: 'Olympic 800m bronze stripped (2012)' },
      { name: 'Yulia Stepanova', country: 'RUS', reason: 'Whistleblower, previously banned' },
      { name: 'Liliya Shobukhova', country: 'RUS', reason: 'Marathon results annulled' },
      
      // BALCO scandal athletes
      { name: 'Marion Jones', country: 'USA', reason: 'Olympic medals stripped (2000)' },
      { name: 'Tim Montgomery', country: 'USA', reason: 'World record annulled' },
      
      // Other major cases
      { name: 'Ben Johnson', country: 'CAN', reason: 'Olympic 100m gold stripped (1988)' },
      { name: 'Justin Gatlin', country: 'USA', reason: 'Previously banned, returned' },
      { name: 'Tyson Gay', country: 'USA', reason: 'Previously banned, returned' },
      { name: 'Rita Jeptoo', country: 'KEN', reason: 'Boston/Chicago Marathon wins stripped' },
      { name: 'Jemima Sumgong', country: 'KEN', reason: 'Olympic marathon gold, banned' },
      
      // Recent high-profile cases
      { name: 'Shelby Houlihan', country: 'USA', reason: 'American record holder, banned' },
      { name: 'Ryan Crouser', country: 'USA', reason: 'Shot put, previously sanctioned' },
    ];
  }

  /**
   * Download and parse AIU banned athletes PDF
   */
  async downloadAndParseAiuList() {
    try {
      console.log('Downloading AIU banned athletes list...');
      
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempDir)) {
        fs.mkdirSync(this.tempDir, { recursive: true });
      }
      
      // Download PDF
      const response = await axios.get(this.aiuPdfUrl, {
        responseType: 'arraybuffer',
        timeout: 30000
      });
      
      const pdfPath = path.join(this.tempDir, 'aiu-banned-list.pdf');
      fs.writeFileSync(pdfPath, response.data);
      
      // Parse PDF
      const pdfBuffer = fs.readFileSync(pdfPath);
      const pdfData = await pdf(pdfBuffer);
      
      // Clean up temp file
      fs.unlinkSync(pdfPath);
      
      return this.parseAiuPdfText(pdfData.text);
    } catch (error) {
      console.error('Error downloading/parsing AIU list:', error);
      return [];
    }
  }

  /**
   * Parse AIU PDF text to extract banned athlete information
   */
  parseAiuPdfText(text) {
    const bannedAthletes = [];
    const lines = text.split('\n');
    
    let currentAthlete = null;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip empty lines and headers
      if (!line || line.includes('GLOBAL LIST') || line.includes('Page ')) {
        continue;
      }
      
      // Look for athlete entries (typically start with a name in caps)
      if (line.match(/^[A-Z][A-Z\s,'-]+$/)) {
        if (currentAthlete) {
          bannedAthletes.push(currentAthlete);
        }
        
        // Parse name and country
        const parts = line.split(',');
        if (parts.length >= 2) {
          const name = parts[0].trim();
          const country = parts[1].trim();
          
          currentAthlete = {
            name: this.formatName(name),
            country: country,
            source: 'AIU',
            reason: 'Listed on AIU Global Banned List'
          };
        }
      } else if (currentAthlete && line.includes('Ineligible until')) {
        // Extract ban period
        currentAthlete.banDetails = line;
      }
    }
    
    // Add the last athlete
    if (currentAthlete) {
      bannedAthletes.push(currentAthlete);
    }
    
    console.log(`Parsed ${bannedAthletes.length} banned athletes from AIU list`);
    return bannedAthletes;
  }

  /**
   * Format athlete name from ALL CAPS to proper case
   */
  formatName(name) {
    return name.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get all banned athletes from multiple sources
   */
  async getAllBannedAthletes() {
    const aiuAthletes = await this.downloadAndParseAiuList();
    const allBanned = [...aiuAthletes, ...this.knownBannedAthletes];
    
    // Remove duplicates based on name and country
    const uniqueBanned = allBanned.filter((athlete, index, self) => 
      index === self.findIndex(a => 
        a.name.toLowerCase() === athlete.name.toLowerCase() && 
        a.country === athlete.country
      )
    );
    
    console.log(`Total unique banned athletes: ${uniqueBanned.length}`);
    return uniqueBanned;
  }

  /**
   * Update athlete ban status in database
   */
  async updateAthleteBanStatus() {
    try {
      const bannedAthletes = await this.getAllBannedAthletes();
      let updatedCount = 0;
      
      for (const bannedAthlete of bannedAthletes) {
        // Find matching athletes in database (fuzzy matching)
        const athletes = await Athlete.find({
          $or: [
            { name: new RegExp(bannedAthlete.name, 'i') },
            { name: new RegExp(bannedAthlete.name.replace(/\s+/g, '.*'), 'i') }
          ],
          country: bannedAthlete.country
        });
        
        for (const athlete of athletes) {
          if (!athlete.isBanned) {
            athlete.isBanned = true;
            athlete.banReason = bannedAthlete.reason;
            athlete.banSource = bannedAthlete.source || 'Known case';
            await athlete.save();
            updatedCount++;
            console.log(`Marked ${athlete.name} (${athlete.country}) as banned`);
          }
        }
      }
      
      console.log(`Updated ban status for ${updatedCount} athletes`);
      return { updated: updatedCount, total: bannedAthletes.length };
    } catch (error) {
      console.error('Error updating athlete ban status:', error);
      throw error;
    }
  }

  /**
   * Check if an athlete name matches any banned athlete
   */
  async isAthleteBanned(athleteName, country) {
    const bannedAthletes = await this.getAllBannedAthletes();
    
    return bannedAthletes.some(banned => 
      banned.name.toLowerCase().includes(athleteName.toLowerCase()) ||
      athleteName.toLowerCase().includes(banned.name.toLowerCase())
    );
  }
}

module.exports = BannedAthleteService;
