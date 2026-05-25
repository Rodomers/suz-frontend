import { create } from 'zustand';
import type { UserProfile } from '../types/auth.types';

interface AuthState {
  user: UserProfile | null;
  isAuth: boolean;
  isInitialized: boolean;
  login: (userData: UserProfile) => void;
  logout: () => void;
  setAuth: (userData: UserProfile) => void;
  setInitialized: (val: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuth: false,
  isInitialized: false,
  login: (userData) => set({ user: userData, isAuth: true }),
  logout: () => set({ user: null, isAuth: false, isInitialized: true }),
  setAuth: (userData) => set({ user: userData, isAuth: true, isInitialized: true }),
  setInitialized: (val) => set({ isInitialized: val }),
}));