/**
 * Utility functions for formatting race times
 */

/**
 * Format seconds into HH:MM:SS or MM:SS format
 * 
 * @param {Number} seconds - Time in seconds
 * @returns {String} - Formatted time string
 */
export const formatTime = (seconds) => {
  if (seconds === null || seconds === undefined) return '--:--';
  
  // Convert seconds to hours, minutes, seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  // Format with leading zeros
  const formattedMinutes = String(minutes).padStart(2, '0');
  const formattedSeconds = String(remainingSeconds).padStart(2, '0');
  
  // Include hours only if present
  if (hours > 0) {
    const formattedHours = String(hours).padStart(2, '0');
    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
  }
  
  return `${formattedMinutes}:${formattedSeconds}`;
};

/**
 * Parse time string into seconds
 * 
 * @param {String} timeString - Time in format HH:MM:SS or MM:SS
 * @returns {Number} - Time in seconds
 */
export const parseTimeToSeconds = (timeString) => {
  if (!timeString) return null;
  
  const parts = timeString.split(':').map(part => parseInt(part, 10));
  
  if (parts.length === 3) {
    // Format: HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    // Format: MM:SS
    return parts[0] * 60 + parts[1];
  }
  
  return null;
};
