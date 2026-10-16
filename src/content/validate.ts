import { ACTIVITY_TYPES, MAX_AGE, MIN_AGE, SUBJECTS, type Manifest, type WeekPack } from './types';

/**
 * Hand-rolled validator for weekly content. Runs in tests (so a broken week fails CI
 * before it is published) and in the app (so a bad download never crashes a child's session).
 * Returns a list of human-readable problems; empty means valid.
 */
export function validateWeek(data: unknown): string[] {
  const errors: string[] = [];
  const err = (path: string, msg: string) => errors.push(`${path}: ${msg}`);

  if (!isObj(data)) return ['week: must be an object'];
  if (data.schemaVersion !== 1) err('schemaVersion', 'must be 1');
  if (!isStr(data.id) || !/^\d{4}-W\d{2}$/.test(data.id)) err('id', 'must look like 2026-W42');
  for (const k of ['title', 'theme', 'emoji'] as const) if (!isStr(data[k])) err(k, 'required string');
  if (!isStr(data.publishedAt) || Number.isNaN(Date.parse(data.publishedAt))) err('publishedAt', 'must be an ISO date');
  if (!Array.isArray(data.activities) || data.activities.length === 0) {
    err('activities', 'must be a non-empty array');
    return errors;
  }

  const ids = new Set<string>();
  data.activities.forEach((a: unknown, i: number) => {
    const p = `activities[${i}]`;
    if (!isObj(a)) return err(p, 'must be an object');
    const ap = isStr(a.id) ? `${p}(${a.id})` : p;
    if (!isStr(a.id) || !/^[a-z0-9-]+$/.test(a.id)) err(ap, 'id must be kebab-case');
    else if (ids.has(a.id)) err(ap, 'duplicate id');
    else ids.add(a.id);
    for (const k of ['title', 'emoji', 'instructions'] as const) if (!isStr(a[k])) err(`${ap}.${k}`, 'required string');
    if (!SUBJECTS.includes(a.subject as never)) err(`${ap}.subject`, `must be one of ${SUBJECTS.join(', ')}`);
    if (!ACTIVITY_TYPES.includes(a.type as never)) err(`${ap}.type`, `must be one of ${ACTIVITY_TYPES.join(', ')}`);
    if (!isInt(a.minAge) || !isInt(a.maxAge) || a.minAge < MIN_AGE || a.maxAge > MAX_AGE || a.minAge > a.maxAge) {
      err(ap, `minAge/maxAge must be integers within ${MIN_AGE}-${MAX_AGE}`);
    }
    if (!Array.isArray(a.items) || a.items.length === 0) return err(`${ap}.items`, 'must be a non-empty array');
    a.items.forEach((item: unknown, j: number) => {
      const ip = `${ap}.items[${j}]`;
      if (!isObj(item)) return err(ip, 'must be an object');
      validateItem(a.type as string, item, (msg) => err(ip, msg));
    });
  });
  return errors;
}

function validateItem(type: string, it: Record<string, unknown>, err: (msg: string) => void) {
  switch (type) {
    case 'multipleChoice':
      if (!isStr(it.prompt)) err('prompt required');
      if (!isStrArr(it.choices) || it.choices.length < 2 || it.choices.length > 6) err('choices: 2-6 strings');
      else if (!isInt(it.answer) || it.answer < 0 || it.answer >= it.choices.length) err('answer must index choices');
      break;
    case 'count':
      if (!isStr(it.emoji)) err('emoji required');
      if (!isInt(it.count) || it.count < 1 || it.count > 20) err('count must be 1-20');
      break;
    case 'match': {
      const pairs = it.pairs;
      if (!Array.isArray(pairs) || pairs.length < 2 || pairs.length > 6) err('pairs: 2-6 pairs');
      else if (!pairs.every((pr) => isStrArr(pr) && pr.length === 2)) err('each pair must be [left, right]');
      else {
        const lefts = pairs.map((pr) => pr[0]);
        const rights = pairs.map((pr) => pr[1]);
        if (new Set(lefts).size !== lefts.length || new Set(rights).size !== rights.length) err('pair sides must be unique');
      }
      break;
    }
    case 'order':
      if (!isStr(it.prompt)) err('prompt required');
      if (!isStrArr(it.sequence) || it.sequence.length < 2 || it.sequence.length > 7) err('sequence: 2-7 strings');
      else if (new Set(it.sequence).size !== it.sequence.length) err('sequence entries must be unique');
      break;
    case 'spell':
      if (!isStr(it.word) || !/^[A-Za-z]{2,12}$/.test(it.word)) err('word: 2-12 letters');
      if (!isStr(it.hint)) err('hint required');
      if (it.extraLetters !== undefined && (!isStr(it.extraLetters) || !/^[A-Za-z]*$/.test(it.extraLetters))) {
        err('extraLetters: letters only');
      }
      break;
    case 'trueFalse':
      if (!isStr(it.statement)) err('statement required');
      if (typeof it.answer !== 'boolean') err('answer must be true/false');
      break;
    case 'typeAnswer':
      if (!isStr(it.prompt)) err('prompt required');
      if (!isStrArr(it.answers) || it.answers.length === 0) err('answers: at least one');
      if (it.keyboard !== undefined && it.keyboard !== 'numeric' && it.keyboard !== 'text') err('keyboard: numeric|text');
      break;
  }
}

export function validateManifest(data: unknown): string[] {
  if (!isObj(data)) return ['manifest: must be an object'];
  const errors: string[] = [];
  if (data.schemaVersion !== 1) errors.push('schemaVersion: must be 1');
  if (!Array.isArray(data.weeks)) return [...errors, 'weeks: must be an array'];
  data.weeks.forEach((w: unknown, i: number) => {
    if (!isObj(w) || !isStr(w.id) || !isStr(w.title) || !isStr(w.emoji) || !isStr(w.path) || !isStr(w.publishedAt)) {
      errors.push(`weeks[${i}]: needs id, title, emoji, publishedAt, path`);
    }
  });
  return errors;
}

export function asWeek(data: unknown): WeekPack | null {
  return validateWeek(data).length === 0 ? (data as WeekPack) : null;
}

export function asManifest(data: unknown): Manifest | null {
  return validateManifest(data).length === 0 ? (data as Manifest) : null;
}

function isObj(v: unknown): v is Record<string, any> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}
function isStr(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}
function isInt(v: unknown): v is number {
  return typeof v === 'number' && Number.isInteger(v);
}
function isStrArr(v: unknown): v is string[] {
  return Array.isArray(v) && v.every(isStr);
}
