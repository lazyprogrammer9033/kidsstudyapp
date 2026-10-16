/**
 * Weekly content schema. Content lives as JSON in /content and is published
 * to a static host every week, so new activities reach the app without a store update.
 * See docs/CONTENT_GUIDE.md for authoring rules.
 */

export const SUBJECTS = ['math', 'reading', 'science', 'logic', 'world', 'art', 'life'] as const;
export type Subject = (typeof SUBJECTS)[number];

export const ACTIVITY_TYPES = [
  'multipleChoice',
  'count',
  'match',
  'order',
  'spell',
  'trueFalse',
  'typeAnswer',
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

/** Pick one answer. `answer` is the index into `choices`. Choices may be emoji or words. */
export interface MultipleChoiceItem {
  prompt: string;
  emoji?: string;
  choices: string[];
  answer: number;
  explanation?: string;
}

/** Show `count` copies of `emoji`; the child taps the right number. */
export interface CountItem {
  emoji: string;
  count: number;
  prompt?: string;
}

/** Connect each left card to its right card. */
export interface MatchItem {
  prompt?: string;
  pairs: [string, string][];
}

/** Tap the cards in the correct order. `sequence` is the correct order; the app shuffles it. */
export interface OrderItem {
  prompt: string;
  sequence: string[];
}

/** Build `word` from letter tiles. `extraLetters` adds decoys. */
export interface SpellItem {
  word: string;
  hint: string;
  extraLetters?: string;
}

export interface TrueFalseItem {
  statement: string;
  answer: boolean;
  explanation?: string;
}

/** Free-typed answer. Any entry in `answers` is accepted (case/space-insensitive). */
export interface TypeAnswerItem {
  prompt: string;
  answers: string[];
  keyboard?: 'numeric' | 'text';
  explanation?: string;
}

interface ActivityBase {
  id: string;
  title: string;
  emoji: string;
  subject: Subject;
  minAge: number;
  maxAge: number;
  instructions: string;
  /** Minutes, shown to parents. */
  minutes?: number;
}

export type Activity =
  | (ActivityBase & { type: 'multipleChoice'; items: MultipleChoiceItem[] })
  | (ActivityBase & { type: 'count'; items: CountItem[] })
  | (ActivityBase & { type: 'match'; items: MatchItem[] })
  | (ActivityBase & { type: 'order'; items: OrderItem[] })
  | (ActivityBase & { type: 'spell'; items: SpellItem[] })
  | (ActivityBase & { type: 'trueFalse'; items: TrueFalseItem[] })
  | (ActivityBase & { type: 'typeAnswer'; items: TypeAnswerItem[] });

export type ActivityOf<T extends ActivityType> = Extract<Activity, { type: T }>;

export interface WeekPack {
  schemaVersion: 1;
  id: string; // ISO week, e.g. "2026-W42"
  title: string;
  theme: string;
  emoji: string;
  /** ISO date; the app only shows a week once this date has passed, so weeks can be published ahead of time. */
  publishedAt: string;
  activities: Activity[];
}

export interface ManifestWeek {
  id: string;
  title: string;
  emoji: string;
  publishedAt: string;
  path: string; // relative to the content base URL
}

export interface Manifest {
  schemaVersion: 1;
  weeks: ManifestWeek[];
}

export const MIN_AGE = 2;
export const MAX_AGE = 16;

export function activitiesForAge(week: WeekPack, age: number): Activity[] {
  return week.activities.filter((a) => a.minAge <= age && age <= a.maxAge);
}

export const SUBJECT_LABELS: Record<Subject, { label: string; color: string }> = {
  math: { label: 'Math', color: '#FF8A5B' },
  reading: { label: 'Reading', color: '#7B6CF6' },
  science: { label: 'Science', color: '#2BB673' },
  logic: { label: 'Logic', color: '#F5B700' },
  world: { label: 'World', color: '#1EA7E1' },
  art: { label: 'Art & Music', color: '#E85A9B' },
  life: { label: 'Life Skills', color: '#8D6E63' },
};
