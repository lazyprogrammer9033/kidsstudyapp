import type { Manifest, WeekPack } from './types';

/**
 * Starter content shipped inside the app binary so the very first launch works offline
 * and store reviewers always see activities. New weeks arrive over the network; bump this
 * to a recent week when you cut a new store release.
 */
const starterWeek = require('../../content/weeks/2026-W42.json') as WeekPack;

export const BUNDLED_WEEKS: Record<string, WeekPack> = {
  [starterWeek.id]: starterWeek,
};

export const BUNDLED_MANIFEST: Manifest = {
  schemaVersion: 1,
  weeks: Object.values(BUNDLED_WEEKS).map((w) => ({
    id: w.id,
    title: w.title,
    emoji: w.emoji,
    publishedAt: w.publishedAt,
    path: `weeks/${w.id}.json`,
  })),
};
