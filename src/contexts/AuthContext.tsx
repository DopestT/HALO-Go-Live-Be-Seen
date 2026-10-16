import React, { createContext, useState, useContext, ReactNode } from 'react';
import { loginWithApi } from '../api/authClient';

export interface User {
  id: string;
  username: string;
  email: string;
  adultModeEnabled: boolean;
  age?: number;
}

interface AuthState {
  isAuthenticated: boolean;
  isAdultVerified: boolean;
  adultModeEnabled: boolean;
  user: User | null;
  token: string | null;
}

interface AuthContextType extends AuthState {
  signIn: (userData: User, token?: string) => Promise<void>;
  signOut: () => void;
  verifyAge: (dateOfBirth: Date) => boolean;
  toggleAdultMode: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAdultVerified, setIsAdultVerified] = useState(false);
  const [adultModeEnabled, setAdultModeEnabled] = useState(false);

  const signIn = async (userData: User, tokenValue?: string) => {
    setUser(userData);
    setToken(tokenValue ?? null);
    setAdultModeEnabled(false);
  };

  const signOut = () => {
    setUser(null);
    setToken(null);
    setIsAdultVerified(false);
    setAdultModeEnabled(false);
  };

  const verifyAge = (dateOfBirth: Date): boolean => {
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDelta = today.getMonth() - dateOfBirth.getMonth();

    if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < dateOfBirth.getDate())) {
      age--;
    }

    if (age >= 18) {
      setIsAdultVerified(true);
      return true;
    }

    setIsAdultVerified(false);
    setAdultModeEnabled(false);
    return false;
  };

  const toggleAdultMode = () => {
    if (!isAdultVerified) {
      console.warn('Guardian Protocol: Cannot enable Adult Mode. User not verified.');
      setAdultModeEnabled(false);
      return;
    }

    setAdultModeEnabled((previous) => !previous);
  };

  const login = async (email: string, password: string): Promise<void> => {
    const result = await loginWithApi(email, password);
    setUser(result.user);
    setToken(result.token);
    setIsAdultVerified(result.isAdultVerified);
    setAdultModeEnabled(result.user.adultModeEnabled);
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
        token,
        isAuthenticated: !!user,
        isAdultVerified,
        adultModeEnabled,
        signIn,
        signOut,
        verifyAge,
        toggleAdultMode,
        login,
        logout,
        updateUser,
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
