import React, { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
  email: string;
  isAdultModeEnabled: boolean;
  ageVerified: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  enableAdultMode: () => Promise<void>;
  disableAdultMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string) => {
    // TODO: Implement authentication logic
    console.log('Login:', email);
  };

  const logout = async () => {
    setUser(null);
    // TODO: Implement logout logic
  };

  const signup = async (email: string, password: string, username: string) => {
    // TODO: Implement signup logic
    console.log('Signup:', email, username);
  };

  const enableAdultMode = async () => {
    if (user && user.ageVerified) {
      setUser({ ...user, isAdultModeEnabled: true });
    }
    // TODO: Implement age verification flow
  };

  const disableAdultMode = () => {
    if (user) {
      setUser({ ...user, isAdultModeEnabled: false });
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    signup,
    enableAdultMode,
    disableAdultMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
