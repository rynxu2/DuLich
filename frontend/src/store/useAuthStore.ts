import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, AuthResponse, LoginData, RegisterData } from '../api/auth';
import { usersApi, UserProfile, UpdateProfileData } from '../api/users';

interface AuthState {
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  user: UserProfile | null;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
  refreshUser: () => Promise<void>;
  restoreSession: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isLoading: true,
  isAuthenticated: false,
  token: null,
  user: null,

  restoreSession: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      if (token && userData) {
        set({ isLoading: false, isAuthenticated: true, token, user: JSON.parse(userData) });
      } else {
        set({ isLoading: false });
      }
    } catch {
      set({ isLoading: false });
    }
  },

  handleAuthSuccess: async (response: AuthResponse) => {
    await AsyncStorage.setItem('auth_token', response.accessToken);
    await AsyncStorage.setItem('refresh_token', response.refreshToken);

    const basicUserData = {
      userId: response.userId,
      username: response.username,
      email: response.email,
      role: response.role,
    };
    await AsyncStorage.setItem('user_data', JSON.stringify(basicUserData));

    try {
      const profileRes = await usersApi.getProfile(response.userId);
      const user: UserProfile = { ...profileRes.data, userId: response.userId };
      await AsyncStorage.setItem('user_data', JSON.stringify({ ...basicUserData, ...user }));
      set({ isLoading: false, isAuthenticated: true, token: response.accessToken, user });
    } catch {
      const fallbackUser: UserProfile = {
        id: 0,
        userId: response.userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({ isLoading: false, isAuthenticated: true, token: response.accessToken, user: fallbackUser });
    }
  },

  login: async (data: LoginData) => {
    const response = await authApi.login(data);
    await (get() as any).handleAuthSuccess(response.data);
  },

  register: async (data: RegisterData) => {
    const response = await authApi.register(data);
    await (get() as any).handleAuthSuccess(response.data);
  },

  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_data');
    set({ isLoading: false, isAuthenticated: false, token: null, user: null });
  },

  refreshUser: async () => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const { userId } = JSON.parse(userData);
        if (userId) {
          const profileRes = await usersApi.getProfile(userId);
          const user = profileRes.data;
          await AsyncStorage.setItem('user_data', JSON.stringify({ ...JSON.parse(userData), ...user }));
          set({ user });
        }
      }
    } catch {}
  },

  updateProfile: async (data: UpdateProfileData) => {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const { userId } = JSON.parse(userData);
        const res = await usersApi.updateProfile(userId, data);
        const updatedUser = res.data;
        await AsyncStorage.setItem('user_data', JSON.stringify({ ...JSON.parse(userData), ...updatedUser }));
        set({ user: updatedUser });
      }
    } catch {
      const { user } = get();
      if (user) {
        const updatedUser = { ...user, ...data };
        await AsyncStorage.setItem('user_data', JSON.stringify(updatedUser));
        set({ user: updatedUser as UserProfile });
      }
    }
  },
}));
