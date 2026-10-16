# BrightWeek Kids

Interactive learning activities for kids aged **2 to 16**, on phones and tablets (iOS and Android).
New activities arrive **every week** without an app update.

- **Free:** 2 activities a day, current week only.
- **Premium (subscription):** unlimited activities, every past week, up to 6 child profiles.

Built with Expo (React Native) + Expo Router, TypeScript, Zustand, and RevenueCat for subscriptions.

## How it works

```
content/                 ← weekly activity packs (JSON), published to GitHub Pages
  manifest.json          ← list of weeks + publish dates
  weeks/2026-W42.json    ← one pack per ISO week, activities for ages 2–16
  privacy.html, terms.html
src/
  app/                   ← screens (Expo Router): profiles, weekly board, activity, paywall, grown-ups
  activities/            ← activity player + 7 interactive engines
  content/               ← schema, validator, network/cache loader
  logic/                 ← free-tier rules, scoring, dates (pure, unit tested)
  purchases/             ← RevenueCat wrapper (demo mode when no keys)
  store/                 ← profiles, progress, streaks (on-device only)
```

**Activity types:** multiple choice, counting, matching, ordering, spelling with letter tiles,
true/false, and typed answers. All have big touch targets, read-aloud (🔊) for pre-readers, haptics,
and 1–3 stars based on first-try accuracy.

**Weekly delivery:** the app downloads `manifest.json`, shows the newest week whose `publishedAt`
has passed, and caches weeks for offline use. One week is bundled in the app so the first launch
works offline. You can publish weeks ahead of time; they appear on their date.

## Run it

```bash
npm install
npm start            # then press i / a, or scan the QR code with a development build
npm test             # logic + content validation
npm run typecheck
```

Subscriptions use native code, so on a device use a development build
(`npx eas-cli@latest build --profile development`) instead of Expo Go. Without RevenueCat keys the
app runs in **demo mode** (purchases are simulated in development builds).

## Publish a new week

```bash
npm run content:new-week -- --title "Spooky Science" --emoji 🎃 --theme "Bats, bones and pumpkins"
```

Fill in the generated `content/weeks/<week>.json` (or ask Claude to write the week, see
[docs/CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md)), open a PR, and merge. CI validates every
activity, then `.github/workflows/publish-content.yml` deploys `content/` to GitHub Pages.

## Launching on the stores

See [docs/STORE_LAUNCH.md](docs/STORE_LAUNCH.md) for the full checklist (bundle IDs, RevenueCat,
subscription products, Kids Category / Families policy, privacy labels, screenshots).

Market research and how this app is different from existing ones:
[docs/MARKET_RESEARCH.md](docs/MARKET_RESEARCH.md).
