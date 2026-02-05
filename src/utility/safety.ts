/**
 * HALO Guardian Middleware
 * Ensures content delivery matches user permissions.
 */

export const filterContentForUser = (streams: any[], userSettings: { isAdultVerified: boolean, adultModeEnabled: boolean }) => {
  return streams.filter(stream => {
    // If stream is standard, everyone sees it
    if (!stream.isAdult) return true;

    // If stream is 18+, user MUST be verified AND have the mode toggled ON
    if (stream.isAdult && userSettings.isAdultVerified && userSettings.adultModeEnabled) {
      return true;
    }

    // Default: Hide
    return false;
  });
};

export const sanitizeChat = (message: string, blocklist: string[]) => {
  let sanitized = message;
  blocklist.forEach(word => {
    const regex = new RegExp(word, 'gi');
    sanitized = sanitized.replace(regex, '•••');
  });
  return sanitized;
};
