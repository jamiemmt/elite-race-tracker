/**
 * Utility functions for processing race results with banned athletes
 */
const mongoose = require('mongoose');

// Assuming we have these models available
let Athlete;
let Result;
let Race;

try {
  Athlete = mongoose.model('Athlete');
  Result = mongoose.model('Result');
  Race = mongoose.model('Race');
} catch (e) {
  // Models might not be registered yet, will be handled when used
  console.warn('Models not available yet in bannedAthleteProcessor');
}

/**
 * Check if an athlete has ever been banned
 * 
 * @param {Object} athlete - Athlete object or athlete ID
 * @returns {Promise<Boolean>} - True if athlete has been banned
 */
const isAthleteBanned = async (athlete) => {
  try {
    // Ensure Athlete model is available
    if (!Athlete) {
      Athlete = mongoose.model('Athlete');
    }

    // Get athlete ID
    const athleteId = athlete._id || athlete;
    
    // Find athlete and check if banned
    const athleteDoc = await Athlete.findById(athleteId);
    return athleteDoc && (athleteDoc.isBanned || (athleteDoc.banHistory && athleteDoc.banHistory.length > 0));
  } catch (error) {
    console.error('Error checking if athlete is banned:', error);
    return false;
  }
};

/**
 * Get banned athlete details
 * 
 * @param {Object} athlete - Athlete object or athlete ID
 * @returns {Promise<Array>} - Array of ban objects with details
 */
const getAthleteBanDetails = async (athlete) => {
  try {
    // Ensure Athlete model is available
    if (!Athlete) {
      Athlete = mongoose.model('Athlete');
    }

    // Get athlete ID
    const athleteId = athlete._id || athlete;
    
    // Find athlete and return ban details
    const athleteDoc = await Athlete.findById(athleteId);
    return athleteDoc && athleteDoc.banHistory ? athleteDoc.banHistory : [];
  } catch (error) {
    console.error('Error getting athlete ban details:', error);
    return [];
  }
};

/**
 * Process race results to remove banned athletes
 * 
 * @param {Array} results - Array of race results
 * @returns {Promise<Array>} - Filtered race results without banned athletes
 */
const getCleanResults = async (results) => {
  try {
    const cleanResults = [];
    
    for (const result of results) {
      // Skip result if athlete has been banned
      if (!(await isAthleteBanned(result.athlete))) {
        cleanResults.push(result);
      }
    }
    
    // Recalculate placements for clean results
    cleanResults.sort((a, b) => a.time - b.time);
    cleanResults.forEach((result, index) => {
      result.position = index + 1;
    });
    
    return cleanResults;
  } catch (error) {
    console.error('Error getting clean results:', error);
    return results; // Return original results on error
  }
};

/**
 * Process race results to mark banned athletes
 * 
 * @param {Array} results - Array of race results
 * @returns {Promise<Array>} - Race results with banned athletes marked and corrected placements
 */
const getMarkedResults = async (results) => {
  try {
    const processedResults = [];
    
    for (const result of results) {
      // Convert Mongoose document to plain object and ensure clean serialization
      let plainResult;
      if (result.toObject) {
        plainResult = result.toObject();
      } else {
        plainResult = JSON.parse(JSON.stringify(result));
      }
      
      const isBanned = await isAthleteBanned(plainResult.athlete);
      
      // If banned, add ban details
      if (isBanned) {
        plainResult.banned = true;
        plainResult.banDetails = await getAthleteBanDetails(plainResult.athlete);
      }
      
      processedResults.push(plainResult);
    }
    
    // Sort by finishTime (not 'time')
    processedResults.sort((a, b) => (a.finishTime || 0) - (b.finishTime || 0));
    
    // Calculate two sets of positions: 
    // - originalPosition (includes banned athletes)
    // - correctedPosition (only counts non-banned athletes)
    let correctedPosition = 0;
    
    processedResults.forEach((result, index) => {
      result.originalPosition = index + 1;
      
      if (!result.banned) {
        correctedPosition++;
        result.correctedPosition = correctedPosition;
      }
    });
    
    // Return clean JSON objects
    return JSON.parse(JSON.stringify(processedResults));
  } catch (error) {
    console.error('Error getting marked results:', error);
    return results; // Return original results on error
  }
};

module.exports = {
  isAthleteBanned,
  getAthleteBanDetails,
  getCleanResults,
  getMarkedResults
};
