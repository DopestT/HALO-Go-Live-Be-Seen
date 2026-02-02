import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  adultModeEnabled: boolean;
  age?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<void> => {
    // MOCK IMPLEMENTATION - DO NOT USE WITH REAL CREDENTIALS
    // In production, this would authenticate with a secure backend
    // Password parameter intentionally unused in mock to avoid security risks
    // For demonstration, create a mock user
    const mockUser: User = {
      id: '1',
      username: email.split('@')[0],
      email,
      adultModeEnabled: false,
      age: 25,
    };
    
    setUser(mockUser);
  };

  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
