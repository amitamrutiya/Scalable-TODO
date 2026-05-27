import React, { createContext, useContext, useState, useCallback } from 'react';
import type { UserWithStats } from '@/types';

interface AuthContextType {
  user: UserWithStats | null;
  isAuthenticated: boolean;
  setUser: (user: UserWithStats | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserWithStats | null>(null);

  const setUser = useCallback((newUser: UserWithStats | null) => {
    setUserState(newUser);
  }, []);

  const logout = useCallback(() => {
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
