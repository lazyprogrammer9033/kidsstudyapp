import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { recordStart, type DailyUsage } from '../logic/access';
import { daysBetween, localDayKey } from '../logic/dates';
import type { Stars } from '../logic/scoring';

export const AVATARS = ['🦊', '🐼', '🦄', '🐯', '🐸', '🐙', '🦁', '🐧', '🐨', '🦋', '🐢', '🚀'] as const;
export const MAX_PROFILES = 6;

export interface Profile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  createdAt: string;
  streak: number;
  lastActiveDay: string | null;
}

export interface ActivityResult {
  stars: Stars;
  completedAt: string;
  plays: number;
}

interface AppState {
  profiles: Profile[];
  activeProfileId: string | null;
  /** profileId -> activityKey ("2026-W42/apple-count") -> best result */
  results: Record<string, Record<string, ActivityResult>>;
  dailyUsage: DailyUsage | undefined;
  /** Last known entitlement, so the app works offline. RevenueCat remains the source of truth. */
  isPremium: boolean;
  soundOn: boolean;

  addProfile: (p: Pick<Profile, 'name' | 'age' | 'avatar'>) => Profile;
  updateProfile: (id: string, patch: Partial<Pick<Profile, 'name' | 'age' | 'avatar'>>) => void;
  removeProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  markStarted: (key: string) => void;
  recordResult: (profileId: string, key: string, stars: Stars) => void;
  setPremium: (v: boolean) => void;
  setSoundOn: (v: boolean) => void;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,
      results: {},
      dailyUsage: undefined,
      isPremium: false,
      soundOn: true,

      addProfile: ({ name, age, avatar }) => {
        const profile: Profile = {
          id: newId(),
          name: name.trim(),
          age,
          avatar,
          createdAt: new Date().toISOString(),
          streak: 0,
          lastActiveDay: null,
        };
        set((s) => ({ profiles: [...s.profiles, profile] }));
        return profile;
      },

      updateProfile: (id, patch) =>
        set((s) => ({ profiles: s.profiles.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),

      removeProfile: (id) =>
        set((s) => {
          const { [id]: _removed, ...results } = s.results;
          return {
            profiles: s.profiles.filter((p) => p.id !== id),
            activeProfileId: s.activeProfileId === id ? null : s.activeProfileId,
            results,
          };
        }),

      setActiveProfile: (id) => set({ activeProfileId: id }),

      markStarted: (key) => set((s) => ({ dailyUsage: recordStart(s.dailyUsage, localDayKey(), key) })),

      recordResult: (profileId, key, stars) => {
        const today = localDayKey();
        const prev = get().results[profileId]?.[key];
        const result: ActivityResult = {
          stars: prev ? (Math.max(prev.stars, stars) as Stars) : stars,
          completedAt: new Date().toISOString(),
          plays: (prev?.plays ?? 0) + 1,
        };
        set((s) => ({
          results: { ...s.results, [profileId]: { ...s.results[profileId], [key]: result } },
          profiles: s.profiles.map((p) => {
            if (p.id !== profileId || p.lastActiveDay === today) return p;
            const continues = p.lastActiveDay !== null && daysBetween(p.lastActiveDay, today) === 1;
            return { ...p, streak: continues ? p.streak + 1 : 1, lastActiveDay: today };
          }),
        }));
      },

      setPremium: (v) => set({ isPremium: v }),
      setSoundOn: (v) => set({ soundOn: v }),
    }),
    {
      name: 'brightweek-app',
      version: 1,
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

export function useActiveProfile(): Profile | undefined {
  return useAppStore((s) => s.profiles.find((p) => p.id === s.activeProfileId));
}

export function totalStars(results: Record<string, ActivityResult> | undefined): number {
  return Object.values(results ?? {}).reduce((sum, r) => sum + r.stars, 0);
}
