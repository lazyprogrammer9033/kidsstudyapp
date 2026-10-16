import { readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { activitiesForAge, MAX_AGE, MIN_AGE, type WeekPack } from '../src/content/types';
import { validateManifest, validateWeek } from '../src/content/validate';

const root = join(__dirname, '..', 'content');
const read = (p: string) => JSON.parse(readFileSync(join(root, p), 'utf8'));
const manifest = read('manifest.json');
const weekFiles = readdirSync(join(root, 'weeks')).filter((f) => f.endsWith('.json'));

describe('published content', () => {
  it('manifest is valid', () => {
    expect(validateManifest(manifest)).toEqual([]);
  });

  it('every manifest entry points at a matching week file', () => {
    for (const entry of manifest.weeks) {
      const week = read(entry.path);
      expect(week.id).toBe(entry.id);
      expect(week.publishedAt).toBe(entry.publishedAt);
      expect(week.title).toBe(entry.title);
    }
  });

  it('every week file is listed in the manifest', () => {
    const listed = manifest.weeks.map((w: { path: string }) => w.path);
    for (const f of weekFiles) expect(listed).toContain(`weeks/${f}`);
  });

  describe.each(weekFiles)('%s', (file) => {
    const week = read(`weeks/${file}`) as WeekPack;

    it('passes schema validation', () => {
      expect(validateWeek(week)).toEqual([]);
    });

    it('has at least 3 activities for every age from 2 to 16', () => {
      const thinAges: number[] = [];
      for (let age = MIN_AGE; age <= MAX_AGE; age++) {
        if (activitiesForAge(week, age).length < 3) thinAges.push(age);
      }
      expect(thinAges).toEqual([]);
    });

    it('has no placeholder activities left', () => {
      expect(week.activities.map((a) => a.id)).not.toContain('replace-me');
    });
  });
});

describe('validateWeek', () => {
  const base = {
    schemaVersion: 1,
    id: '2026-W01',
    title: 'T',
    theme: 'T',
    emoji: '⭐',
    publishedAt: '2026-01-01T00:00:00Z',
  };
  const activity = {
    id: 'a',
    title: 'A',
    emoji: '⭐',
    subject: 'math',
    minAge: 2,
    maxAge: 4,
    instructions: 'Do it',
  };

  it('rejects an out-of-range multiple choice answer', () => {
    const errors = validateWeek({
      ...base,
      activities: [{ ...activity, type: 'multipleChoice', items: [{ prompt: 'p', choices: ['a', 'b'], answer: 2 }] }],
    });
    expect(errors.join()).toMatch(/answer must index choices/);
  });

  it('rejects duplicate ids and bad ages', () => {
    const a = { ...activity, type: 'count', items: [{ emoji: '🍎', count: 3 }] };
    const errors = validateWeek({ ...base, activities: [a, { ...a, minAge: 1 }] });
    expect(errors.join()).toMatch(/duplicate id/);
  });

  it('rejects unknown activity types', () => {
    const errors = validateWeek({ ...base, activities: [{ ...activity, type: 'dance', items: [{}] }] });
    expect(errors.join()).toMatch(/type: must be one of/);
  });
});
