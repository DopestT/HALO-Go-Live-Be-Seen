import { User } from '../contexts/AuthContext';

export interface Content {
  id: string;
  title: string;
  isAdultContent: boolean;
  ageRestriction?: number;
}

/**
 * Filters content based on user's Adult Mode settings
 * @param content - Array of content items
 * @param user - Current user or null if not authenticated
 * @returns Filtered content array based on user settings
 */
export const filterContentForUser = <T extends Content>(
  content: T[],
  user: User | null
): T[] => {
  // If not authenticated, show only non-adult content
  if (!user) {
    return content.filter(item => !item.isAdultContent);
  }

  // If adult mode is disabled, filter out adult content
  if (!user.adultModeEnabled) {
    return content.filter(item => !item.isAdultContent);
  }

  // If adult mode is enabled, check age restriction
  return content.filter(item => {
    // Non-adult content is always visible
    if (!item.isAdultContent) {
      return true;
    }

    // Adult content requires verification
    if (item.ageRestriction && user.age) {
      return user.age >= item.ageRestriction;
    }

    // Default age requirement for adult content
    return user.age ? user.age >= 18 : false;
  });
};

/**
 * Checks if a user can access adult content
 */
export const canAccessAdultContent = (user: User | null): boolean => {
  if (!user) return false;
  if (!user.adultModeEnabled) return false;
  return user.age ? user.age >= 18 : false;
};
