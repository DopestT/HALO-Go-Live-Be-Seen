/**
 * HALO Safety Utilities
 * Essential safety features for content moderation
 */

interface User {
  isAdultModeEnabled: boolean;
  ageVerified: boolean;
}

interface Content {
  isAdultContent: boolean;
  [key: string]: any;
}

/**
 * Filter content based on user's adult mode settings
 * MUST be used when fetching any feed or stream list
 */
export const filterContentForUser = <T extends Content>(
  content: T[],
  user: User | null
): T[] => {
  // If user hasn't enabled adult mode or isn't age verified, filter out adult content
  if (!user || !user.isAdultModeEnabled || !user.ageVerified) {
    return content.filter(item => !item.isAdultContent);
  }
  
  return content;
};

/**
 * Report a stream or user
 * SAFETY: Must be available in all stream-related features
 */
export const reportContent = async (
  targetId: string,
  targetType: 'stream' | 'user' | 'message',
  reason: string,
  userId: string
): Promise<void> => {
  // TODO: Implement API call to report content
  console.log('Reporting:', {
    targetId,
    targetType,
    reason,
    userId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Block a user
 * SAFETY: Must be available in all stream-related features
 */
export const blockUser = async (
  userId: string,
  blockedUserId: string
): Promise<void> => {
  // TODO: Implement API call to block user
  console.log('Blocking user:', {
    userId,
    blockedUserId,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Validate age for adult mode
 */
export const validateAge = (birthDate: Date): boolean => {
  const today = new Date();
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    return age - 1 >= 18;
  }
  
  return age >= 18;
};
