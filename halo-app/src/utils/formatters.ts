/**
 * HALO Formatting Utilities
 * Calm, respectful formatting helpers
 */

/**
 * Format viewer count with calm language (no "K" or aggressive abbreviations)
 */
export const formatViewerCount = (count: number): string => {
  if (count === 0) return 'No viewers';
  if (count === 1) return '1 viewer';
  if (count < 1000) return `${count} viewers`;
  
  const thousands = Math.floor(count / 1000);
  const remainder = count % 1000;
  
  if (remainder === 0) {
    return `${thousands},000 viewers`;
  }
  
  return `${thousands},${Math.floor(remainder / 100)}00+ viewers`;
};

/**
 * Format duration in a calm, readable way
 */
export const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  }
  
  return `${secs}s`;
};

/**
 * Format timestamp in a calm, non-urgent way
 */
export const formatTimestamp = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }
  
  if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  
  if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  
  return 'Just now';
};

/**
 * Sanitize user input (no shame-based language allowed)
 */
export const sanitizeInput = (input: string): string => {
  return input.trim().slice(0, 500); // Max 500 characters
};
