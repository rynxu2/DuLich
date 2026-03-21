/**
 * AuthContext — Global authentication state
 * 
 * Provides login/logout/register/updateProfile actions and user state
 * to all components via React Context. Persists JWT access token,
 * refresh token, and user data in AsyncStorage for session persistence.
 * 
 * Architecture:
 * - Auth (login/register/refresh) → Auth Service
 * - Profile (get/update) → User Service
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthResponse, LoginData, RegisterData } from '../api/auth';
import { usersApi, UserProfile, UpdateProfileData } from '../api/users';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
}

interface AuthContextType extends AuthState {
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    token: null,
    user: null,
  });

  // Check for existing session on app start
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('auth_token');
        const userData = await AsyncStorage.getItem('user_data');
        if (token && userData) {
          setState({
            isLoading: false,
            isAuthenticated: true,
            token,
            user: JSON.parse(userData),
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };
    restoreSession();
  }, []);

  /**
   * Handle successful auth response:
   * 1. Save accessToken + refreshToken to AsyncStorage
   * 2. Fetch full profile from User Service
   * 3. Update state
   */
  const handleAuthSuccess = async (response: AuthResponse) => {
    // Save both tokens
    await AsyncStorage.setItem('auth_token', response.accessToken);
    await AsyncStorage.setItem('refresh_token', response.refreshToken);

    // Save basic user data (for X-User-Id header)
    const basicUserData = {
      userId: response.userId,
      username: response.username,
      email: response.email,
      role: response.role,
    };
    await AsyncStorage.setItem('user_data', JSON.stringify(basicUserData));

    // Fetch full profile from User Service
    try {
      const profileRes = await usersApi.getProfile(response.userId);
      const profile = profileRes.data;
      const user: UserProfile = {
        ...profile,
        userId: response.userId,
      };
      await AsyncStorage.setItem('user_data', JSON.stringify({
        ...basicUserData,
        ...user,
      }));
      setState({
        isLoading: false,
        isAuthenticated: true,
        token: response.accessToken,
        user,
      });
    } catch {
      // Use basic info from auth response if profile fetch fails
      // (profile may not exist yet if user.registered event hasn't been processed)
      const fallbackUser: UserProfile = {
        id: 0,
        userId: response.userId,
        fullName: undefined,
        phone: undefined,
        avatarUrl: undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setState({
        isLoading: false,
        isAuthenticated: true,
        token: response.accessToken,
        user: fallbackUser,
      });
    }
  };

  const login = async (data: LoginData) => {
    const response = await authApi.login(data);
    await handleAuthSuccess(response.data);
  };

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data);
    await handleAuthSuccess(response.data);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_data');
    setState({
      isLoading: false,
      isAuthenticated: false,
      token: null,
      user: null,
    });
  };

  const refreshUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const { userId } = JSON.parse(userData);
        if (userId) {
          const profileRes = await usersApi.getProfile(userId);
          const user = profileRes.data;
          await AsyncStorage.setItem('user_data', JSON.stringify({ ...JSON.parse(userData), ...user }));
          setState(prev => ({ ...prev, user }));
        }
      }
    } catch {
      // Keep current user data
    }
  };

  const updateProfileAction = async (data: UpdateProfileData) => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const { userId } = JSON.parse(userData);
        const res = await usersApi.updateProfile(userId, data);
        const updatedUser = res.data;
        await AsyncStorage.setItem('user_data', JSON.stringify({ ...JSON.parse(userData), ...updatedUser }));
        setState(prev => ({ ...prev, user: updatedUser }));
      }
    } catch {
      // Optimistic local update if server fails
      if (state.user) {
        const updatedUser = { ...state.user, ...data };
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
        setState(prev => ({ ...prev, user: updatedUser as UserProfile }));
      }
    }
  };

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateProfile: updateProfileAction, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
