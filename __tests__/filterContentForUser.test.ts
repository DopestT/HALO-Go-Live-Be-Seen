import { filterContentForUser, canAccessAdultContent } from '../src/utils/filterContentForUser';
import { User } from '../src/contexts/AuthContext';

describe('filterContentForUser', () => {
  const mockContent = [
    {
      id: '1',
      title: 'Safe Content',
      isAdultContent: false,
    },
    {
      id: '2',
      title: 'Adult Content',
      isAdultContent: true,
    },
    {
      id: '3',
      title: 'Age Restricted Content',
      isAdultContent: true,
      ageRestriction: 21,
    },
  ];

  it('should filter out adult content for unauthenticated users', () => {
    const result = filterContentForUser(mockContent, null);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should filter out adult content when adult mode is disabled', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: false,
      age: 25,
    };
    const result = filterContentForUser(mockContent, user);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should show adult content when adult mode is enabled and age is verified', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: true,
      age: 25,
    };
    const result = filterContentForUser(mockContent, user);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });

  it('should respect age restrictions on adult content', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: true,
      age: 19,
    };
    const result = filterContentForUser(mockContent, user);
    expect(result).toHaveLength(2);
    expect(result.map(c => c.id)).toEqual(['1', '2']);
  });

  it('should show age-restricted content when user meets age requirement', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: true,
      age: 21,
    };
    const result = filterContentForUser(mockContent, user);
    expect(result).toHaveLength(3);
  });
});

describe('canAccessAdultContent', () => {
  it('should return false for unauthenticated users', () => {
    expect(canAccessAdultContent(null)).toBe(false);
  });

  it('should return false when adult mode is disabled', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: false,
      age: 25,
    };
    expect(canAccessAdultContent(user)).toBe(false);
  });

  it('should return false when user is under 18', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: true,
      age: 17,
    };
    expect(canAccessAdultContent(user)).toBe(false);
  });

  it('should return true when adult mode is enabled and user is 18+', () => {
    const user: User = {
      id: '1',
      username: 'testuser',
      email: 'test@example.com',
      adultModeEnabled: true,
      age: 18,
    };
    expect(canAccessAdultContent(user)).toBe(true);
  });
});
