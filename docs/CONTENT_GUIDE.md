# Weekly content guide

Every week gets one JSON pack in `content/weeks/<ISO week>.json` plus an entry in
`content/manifest.json`. `npm run content:new-week` creates both.

## Weekly targets

| Age band | Ages | Activities per week | Good types |
|---|---|---|---|
| Tots | 2–4 | 6–8 | `count`, `multipleChoice` with emoji choices, `match` (emoji ↔ emoji), `order` (small → big) |
| Early | 5–7 | 7–9 | `spell` (3–5 letters), simple sums, rhymes, `trueFalse`, word ↔ picture `match` |
| Junior | 8–10 | 7–9 | times tables (`typeAnswer`), grammar, spelling with decoys, patterns, science facts |
| Tween | 11–13 | 7–9 | fractions/percent, vocabulary, timelines, logic puzzles, money math |
| Teen | 14–16 | 7–9 | algebra, biology/chemistry, literary devices, probability, financial literacy |

Ranges can overlap (`minAge`/`maxAge`); CI fails if any age from 2 to 16 has fewer than 3 activities.
Aim for a balance of subjects: `math`, `reading`, `science`, `logic`, `world`, `art`, `life`.

## Rules

- **Original content only.** Write fresh questions every week; do not copy from textbooks, worksheets,
  other apps or websites. Facts are fine; wording, layouts and question sets must be our own.
- Each activity: 3–6 items, about 3–8 minutes.
- Under 6: assume the child cannot read. Prompts are short and read aloud; answers are emoji.
- Add an `explanation` to science, history and teen items so kids learn from mistakes.
- Keep it inclusive and global (festivals, names and foods from many cultures).
- No links, brand names, or anything that asks a child for personal information.
- Double-check every answer. `answer` in `multipleChoice` is a **0-based index**.

## Item formats

```jsonc
{ "type": "multipleChoice", "items": [{ "prompt": "Which one is red?", "choices": ["🍋", "🍎"], "answer": 1, "explanation": "optional" }] }
{ "type": "count",          "items": [{ "emoji": "🍎", "count": 4 }] }                      // 1–20
{ "type": "match",          "items": [{ "prompt": "optional", "pairs": [["cat", "hat"], ["log", "frog"]] }] } // 2–6 unique pairs
{ "type": "order",          "items": [{ "prompt": "Smallest to biggest", "sequence": ["🐜", "🐶", "🐘"] }] } // correct order; app shuffles
{ "type": "spell",          "items": [{ "word": "LEAF", "hint": "🍁", "extraLetters": "S" }] } // letters only, 2–12
{ "type": "trueFalse",      "items": [{ "statement": "…", "answer": true, "explanation": "optional" }] }
{ "type": "typeAnswer",     "items": [{ "prompt": "7 × 8 = ?", "answers": ["56"], "keyboard": "numeric" }] } // any listed answer accepted
```

## Asking Claude to write a week

> Create next week's BrightWeek content pack. Theme: "<theme>". Follow docs/CONTENT_GUIDE.md,
> run `npm run content:new-week`, write original activities for every age band, run `npm test`, and open a PR.

Review the PR (especially facts and answers), then merge. GitHub Pages publishes it within minutes and
apps pick it up on next launch (or via Grown-ups → "Check for new").
