#!/usr/bin/env node
// Scaffold next week's content pack and register it in the manifest.
//
//   npm run content:new-week -- --title "Spooky Science" --emoji 🎃 --theme "Bats, bones and pumpkins"
//   npm run content:new-week -- --week 2026-W44 --publish 2026-10-26
//
// Defaults: the ISO week after the newest one in the manifest, published on that week's Monday (00:00 UTC).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'content');
const manifestPath = join(root, 'manifest.json');

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc), []),
);

function mondayOfIsoWeek(id) {
  const [y, w] = id.split('-W').map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return monday;
}

function isoWeekId(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const week = Math.ceil(((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const latest = [...manifest.weeks].sort((a, b) => b.id.localeCompare(a.id))[0];
const id =
  args.week ??
  (latest ? isoWeekId(new Date(mondayOfIsoWeek(latest.id).getTime() + 7 * 86400000)) : isoWeekId(new Date()));
if (!/^\d{4}-W\d{2}$/.test(id)) throw new Error(`Bad week id ${id}`);
if (manifest.weeks.some((w) => w.id === id)) throw new Error(`${id} is already in the manifest`);

const publishedAt = args.publish ? new Date(args.publish).toISOString() : mondayOfIsoWeek(id).toISOString();
const title = args.title ?? 'New Week';
const emoji = args.emoji ?? '🌟';
const path = `weeks/${id}.json`;
const file = join(root, path);
if (existsSync(file)) throw new Error(`${file} already exists`);

const week = {
  schemaVersion: 1,
  id,
  title,
  theme: args.theme ?? 'Describe this week’s theme',
  emoji,
  publishedAt,
  activities: [
    {
      id: 'replace-me',
      type: 'multipleChoice',
      title: 'Replace me',
      emoji: '✨',
      subject: 'logic',
      minAge: 2,
      maxAge: 16,
      minutes: 3,
      instructions: 'Replace this placeholder with real activities (see docs/CONTENT_GUIDE.md).',
      items: [{ prompt: 'Which one is a star?', choices: ['⭐', '🌙'], answer: 0 }],
    },
  ],
};

writeFileSync(file, JSON.stringify(week, null, 2) + '\n');
manifest.weeks.push({ id, title, emoji, publishedAt, path });
manifest.weeks.sort((a, b) => a.id.localeCompare(b.id));
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Created content/${path} (publishes ${publishedAt}) and added it to content/manifest.json`);
