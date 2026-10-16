import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { BUNDLED_MANIFEST, BUNDLED_WEEKS } from './bundled';
import type { Manifest, ManifestWeek, WeekPack } from './types';
import { asManifest, asWeek } from './validate';

/**
 * Where weekly content is published. Defaults to the GitHub Pages site built by
 * .github/workflows/publish-content.yml; override with EXPO_PUBLIC_CONTENT_BASE_URL.
 */
export const CONTENT_BASE_URL = (
  process.env.EXPO_PUBLIC_CONTENT_BASE_URL ?? 'https://lazyprogrammer9033.github.io/kidsstudyapp/'
).replace(/\/?$/, '/');

const FETCH_TIMEOUT_MS = 8000;
const MANIFEST_KEY = 'content:manifest';
const weekKey = (id: string) => `content:week:${id}`;

async function fetchJson(path: string): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    // Cache-buster so a CDN never serves last week's manifest.
    const res = await fetch(`${CONTENT_BASE_URL}${path}?t=${Date.now()}`, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${path}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

async function readCache<T>(key: string, parse: (d: unknown) => T | null): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? parse(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

/** Weeks whose publish date has passed, newest first. */
export function publishedWeeks(manifest: Manifest, now: Date = new Date()): ManifestWeek[] {
  return manifest.weeks
    .filter((w) => Date.parse(w.publishedAt) <= now.getTime())
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
}

/** Network first, then cache, then the starter week bundled with the app. Always returns something valid. */
async function loadManifest(): Promise<{ manifest: Manifest; offline: boolean }> {
  try {
    const manifest = asManifest(await fetchJson('manifest.json'));
    if (manifest) {
      await AsyncStorage.setItem(MANIFEST_KEY, JSON.stringify(manifest)).catch(() => {});
      return { manifest, offline: false };
    }
  } catch {
    // fall through to cache
  }
  const cached = await readCache(MANIFEST_KEY, asManifest);
  return { manifest: cached ?? BUNDLED_MANIFEST, offline: true };
}

async function loadWeek(entry: ManifestWeek): Promise<WeekPack | null> {
  // Weeks never change after publishing, so cache first.
  const cached = await readCache(weekKey(entry.id), asWeek);
  if (cached) return cached;
  try {
    const week = asWeek(await fetchJson(entry.path));
    if (week) {
      await AsyncStorage.setItem(weekKey(entry.id), JSON.stringify(week)).catch(() => {});
      return week;
    }
  } catch {
    // fall through to bundled
  }
  return BUNDLED_WEEKS[entry.id] ?? null;
}

interface ContentState {
  status: 'idle' | 'loading' | 'ready';
  offline: boolean;
  weeks: ManifestWeek[];
  currentWeekId: string | null;
  loaded: Record<string, WeekPack>;
  refresh: () => Promise<void>;
  ensureWeek: (id: string) => Promise<WeekPack | null>;
}

export const useContentStore = create<ContentState>((set, get) => ({
  status: 'idle',
  offline: false,
  weeks: [],
  currentWeekId: null,
  loaded: {},

  refresh: async () => {
    set({ status: 'loading' });
    const { manifest, offline } = await loadManifest();
    let weeks = publishedWeeks(manifest);
    if (weeks.length === 0) weeks = BUNDLED_MANIFEST.weeks;
    const currentWeekId = weeks[0]?.id ?? null;
    set({ weeks, currentWeekId, offline });
    if (currentWeekId) await get().ensureWeek(currentWeekId);
    set({ status: 'ready' });
  },

  ensureWeek: async (id) => {
    const existing = get().loaded[id];
    if (existing) return existing;
    const entry = get().weeks.find((w) => w.id === id);
    if (!entry) return null;
    const week = await loadWeek(entry);
    if (week) set((s) => ({ loaded: { ...s.loaded, [id]: week } }));
    return week;
  },
}));
