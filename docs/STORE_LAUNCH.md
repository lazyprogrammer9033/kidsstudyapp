# Store launch checklist

## 1. Accounts
- [ ] Apple Developer Program ($99/yr) and Google Play Console ($25 one-time).
- [ ] Expo account; run `npx eas-cli@latest init` to link the project (adds `extra.eas.projectId` to app.json).
- [ ] Confirm the app name is free to use: search the App Store, Google Play and the trademark office (e.g. USPTO TESS / your country's office). Bundle IDs are `com.lazyprogrammer9033.brightweek` in `app.json`; change them before the first upload if you want a company domain.

## 2. Subscriptions (RevenueCat)
1. Create products in both stores (same IDs make life easier):
   - `brightweek_premium_monthly` (e.g. $5.99/month)
   - `brightweek_premium_annual` (e.g. $39.99/year, optional 7-day free trial)
2. In RevenueCat: create a project, add the iOS and Android apps, import the products,
   create entitlement **`premium`** (must match `ENTITLEMENT_ID` in `src/purchases/purchases.ts`),
   and a **current offering** containing the monthly and annual packages.
3. Put the public SDK keys in EAS environment variables:
   `EXPO_PUBLIC_REVENUECAT_IOS_KEY`, `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`.
4. Test with Sandbox (iOS) and license testers (Android) using a `preview` build.

The app downloads for free and sells the subscription in-app. That is the only way to offer a free tier;
a paid-upfront app cannot also have free daily activities.

## 3. Content hosting
- [ ] Repo Settings → Pages → Source: **GitHub Actions**. Merge to `main` and check
      `https://lazyprogrammer9033.github.io/kidsstudyapp/manifest.json` loads.
- GitHub Pages on a private repo needs a paid GitHub plan. Otherwise host `content/` on Cloudflare
  Pages / Netlify / Firebase Hosting and set `EXPO_PUBLIC_CONTENT_BASE_URL`.
- Privacy policy and terms are served from the same site (`privacy.html`, `terms.html`). **Edit the
  templates** (support email, legal entity) and have them reviewed.

## 4. Kids-specific requirements
**Apple — Kids Category (guidelines 1.3 and 5.1.4)**
- [ ] Decide the category. Apple's Kids Category needs a single age band (5 & under, 6–8 or 9–11) and has no teen band, so an app for ages 2–16 usually lists under **Education** with a 4+ rating. Either way, keep following the kids rules below. Decide before the first submission; it is hard to change later.
- [x] Parental gate before purchases, settings and external links (`ParentGate`).
- [x] No third-party ads or analytics. Do not add any without checking the rules.
- [ ] App Privacy label: "Data Not Collected" for the app itself; declare purchase history if RevenueCat requires it (check RevenueCat's privacy guidance).

**Google Play — Families Policy**
- [ ] Target audience: select age groups 5 & under, 6–8, 9–12, 13–15, 16–17 as appropriate.
- [ ] Only use SDKs from Google's Families Self-Certified SDK list (verify RevenueCat is listed for the version you ship).
- [ ] Data safety form: no data collected/shared beyond purchases.
- [ ] Optional: apply for "Teacher Approved".

## 5. Store listing
- [ ] Icon (1024×1024) and splash: replace the placeholders in `assets/`.
- [ ] Screenshots: iPhone 6.9", iPad 13", Android phone + 7"/10" tablet. Show the weekly board, an activity for a young kid and a teen, and the grown-ups area.
- [ ] Description: weekly fresh content, ages 2–16, one subscription for up to 6 kids, no ads, works offline.
- [ ] Subscription disclosure text and links to Terms/Privacy (already on the paywall).

## 6. Build and submit
```bash
npx eas-cli@latest build --platform all --profile production
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```
Before every store release, update `src/content/bundled.ts` to bundle a recent week.
