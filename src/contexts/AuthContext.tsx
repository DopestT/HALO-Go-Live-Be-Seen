import React, { createContext, useState, useContext, ReactNode } from 'react';

export interface User {
  id: string;
  username: string;
  email: string;
  adultModeEnabled: boolean;
  age?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdultVerified: boolean; // True if DOB confirms 18+
  adultModeEnabled: boolean; // True only if user OPT-IN
  user: User | null;
}

interface AuthContextType extends AuthState {
  signIn: (userData: any) => Promise<void>;
  signOut: () => void;
  verifyAge: (dateOfBirth: Date) => boolean; // Returns success/fail
  toggleAdultMode: () => void;
  login: (email: string, password: string) => Promise<void>; // Backward compatibility
  logout: () => void; // Backward compatibility
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
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

  // Backward compatibility methods
  const login = async (email: string, password: string): Promise<void> => {
    // MOCK IMPLEMENTATION - DO NOT USE WITH REAL CREDENTIALS
    const mockUser: User = {
      id: '1',
      username: email.split('@')[0],
      email,
      adultModeEnabled: false,
      age: 25,
    };
    signIn(mockUser);
  };

  const logout = () => {
    signOut();
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
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
        toggleAdultMode,
        login,
        logout,
        updateUser
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
