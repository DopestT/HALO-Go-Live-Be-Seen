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
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  isAdultVerified: boolean; // True if DOB confirms 18+
  adultModeEnabled: boolean; // True only if user OPT-IN
  user: any | null;
}

interface AuthContextType extends AuthState {
  signIn: (userData: any) => Promise<void>;
  signOut: () => void;
  verifyAge: (dateOfBirth: Date) => boolean; // Returns success/fail
  toggleAdultMode: () => void;
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
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [isAdultVerified, setIsAdultVerified] = useState(false);
  const [adultModeEnabled, setAdultModeEnabled] = useState(false);

  // Simple mock sign-in
  const signIn = async (userData: any) => {
    setUser(userData);
    // Note: Adult mode always resets to FALSE on new login for safety
    setAdultModeEnabled(false); 
  };

  const signOut = () => {
    setUser(null);
    setIsAdultVerified(false);
    setAdultModeEnabled(false);
  };

  // The Gate Logic
  const verifyAge = (dateOfBirth: Date): boolean => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const m = today.getMonth() - dateOfBirth.getMonth();
    
    // Adjust if birthday hasn't happened yet this year
    if (m < 0 || (m === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    if (age >= 18) {
      setIsAdultVerified(true);
      return true;
    } else {
      setIsAdultVerified(false);
      setAdultModeEnabled(false); // Force disable
      return false;
    }
  };

  // The Toggle (Safety Switch)
  const toggleAdultMode = () => {
    if (!isAdultVerified) {
      console.warn("Guardian Protocol: Cannot enable Adult Mode. User not verified.");
      setAdultModeEnabled(false);
      return;
    }
    setAdultModeEnabled(prev => !prev);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated: !!user, 
        isAdultVerified, 
        adultModeEnabled, 
        signIn, 
        signOut, 
        verifyAge, 
        toggleAdultMode 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
