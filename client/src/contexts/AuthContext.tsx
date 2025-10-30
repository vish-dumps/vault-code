import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiRequest } from '@/lib/queryClient';

type AvatarType = 'initials' | 'random' | 'custom';
type AvatarGender = 'male' | 'female';

interface User {
  id: string;
  username: string;
  email: string;
  name?: string;
  leetcodeUsername?: string;
  codeforcesUsername?: string;
  streak: number;
  createdAt: string;
  profileImage?: string | null;
  avatarType?: AvatarType;
  avatarGender?: AvatarGender;
  customAvatarUrl?: string | null;
  randomAvatarSeed?: number | null;
  avatarUrl?: string | null;
}

type LoginResult =
  | {
      status: "otp_required";
      otpSession: string;
      expiresIn: number;
    }
  | {
      status: "authenticated";
    };

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  verifyOtp: (email: string, otp: string, otpSession: string) => Promise<void>;
  register: (
    username: string,
    email: string,
    password: string,
    name: string | undefined,
    avatarGender: AvatarGender
  ) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

function computeAvatarUrl(data: Partial<User> | null | undefined): string | null {
  if (!data) return null;

  if (data.avatarType === 'custom') {
    if (data.profileImage) return data.profileImage;
    if (data.customAvatarUrl) return data.customAvatarUrl;
  }

  if (data.avatarType === 'random') {
    const genderPath = data.avatarGender === 'female' ? 'girl' : 'boy';
    const seed = String(
      data.randomAvatarSeed ?? data.id ?? data.username ?? 'codevault'
    );
    return `https://avatar.iran.liara.run/public/${genderPath}?username=${seed}`;
  }

  return null;
}

function mapUser(data: any): User {
  return {
    ...data,
    avatarUrl: computeAvatarUrl(data),
  };
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on app load
    const storedToken = localStorage.getItem('authToken');
    if (storedToken) {
      setToken(storedToken);
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await apiRequest('GET', '/api/auth/verify', undefined, {
        'Authorization': `Bearer ${token}`
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(mapUser(data.user));
      } else {
        // Token is invalid, remove it
        localStorage.removeItem('authToken');
        setToken(null);
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('authToken');
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<LoginResult> => {
    try {
      const response = await apiRequest('POST', '/api/auth/login', {
        email,
        password,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      if (data.otpRequired) {
        return {
          status: 'otp_required',
          otpSession: data.otpSession,
          expiresIn: data.expiresIn,
        };
      }

      const { token: newToken, user: userData } = data;

      // Store token and user data
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(mapUser(userData));
      return { status: 'authenticated' };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const verifyOtp = async (email: string, otp: string, otpSession: string) => {
    try {
      const response = await apiRequest('POST', '/api/auth/login/verify', {
        email,
        otp,
        otpSession,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'OTP verification failed');
      }

      const data = await response.json();
      const { token: newToken, user: userData } = data;

      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(mapUser(userData));
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  };

  const register = async (
    username: string,
    email: string,
    password: string,
    name: string | undefined,
    avatarGender: AvatarGender
  ) => {
    try {
      const response = await apiRequest('POST', '/api/auth/register', {
        username,
        email,
        password,
        name,
        avatarGender,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const data = await response.json();
      const { token: newToken, user: userData } = data;

      // Store token and user data
      localStorage.setItem('authToken', newToken);
      setToken(newToken);
      setUser(mapUser(userData));
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setToken(null);
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    verifyOtp,
    register,
    logout,
    isLoading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export type { LoginResult };


