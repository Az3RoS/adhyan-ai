# Adhyan — Session Context
> Read this before touching any code. Update when phases complete or decisions change.

---

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| 0 — Scaffold | ✅ DONE | All screens, design system, DB layer, i18n, git push |
| 1 — Real Content | ✅ DONE | Supabase wired, 26 migrations, Edge Functions live, feed calls API |
| 2 — AI Features | ✅ DONE | 5-day flow, SM-2, Bhashini TTS, Gemini scam checker, skins c01–c10, community stories |
| 3 — Distribution | ✅ DONE | EAS build/submit workflows, push notifications, DPDPA GPS fix, streak reminder |
| 4 — Polish | 🔲 NEXT | Onboarding flow polish, settings screen, accessibility audit, prod build |

---

## Architecture Quick-Ref

```
app/
  _layout.tsx          — Root: fonts, QueryClient, UserProvider, Stack
  (onboarding)/        — language → persona → welcome (3 steps)
  (tabs)/              — index (feed), learn, cookbook, profile
  concept/[id].tsx     — 5-day micro-lesson (Story/Explain/Apply/Quiz/Review)
  +not-found.tsx

constants/
  design.ts            — Colors, fonts, spacing, radius, shadows, pillar/persona maps
  i18n.ts              — EN/HI/BN strings (StringsShape type)

lib/
  db.ts                — SQLite via expo-sqlite/next (sync API)
  sm2.ts               — SM-2 spaced repetition
  supabase.ts          — Singleton Supabase client (EXPO_PUBLIC_ env vars)
  sync.ts              — ensureSupabaseSession, fetchDailyFeed, syncConceptsDown,
                         syncProfileUp, syncProgressUp, registerPushToken; DailyFeedCard type
  UserContext.tsx      — locale, persona, streak, onboarding, supabase_user_id, push token reg

supabase/
  config.toml          — Project ref, anonymous auth enabled, 4 edge functions registered
  migrations/          — 26 files: 001-014 schema, 015-026 seed + push_token column
  functions/
    _shared/cors.ts
    assemble-daily-feed/index.ts — main feed Edge Function
    bhashini-tts/index.ts        — Hindi/Bengali/English TTS via Bhashini ULCA
    check-scam/index.ts          — Gemini Flash → Groq fallback scam checker
    send-streak-reminder/index.ts — daily cron: streak nudge via Expo Push

.github/workflows/
  eas-build.yml    — CI build on push to master (preview APK)
  eas-submit.yml   — Manual submit to Play Store internal track
```

---

## Supabase Project

| Key | Value |
|---|---|
| URL | https://cleuulcscytdrmttbxyu.supabase.co |
| Region | ap-south-1 (Mumbai) ✅ |
| Anon key | in .env.example (safe for client) |
| Service role | ONLY in Edge Function env secrets |
| Anonymous auth | enabled |

**To run migrations:** Supabase Dashboard → SQL Editor → paste each file in order 001→026.

---

## Font Stack (decided 2026-05-28)

| Token | Font | Use |
|---|---|---|
| `fonts.display` | TiroDevanagariSanskrit_400Regular | All headlines, concept titles, screen headers |
| `fonts.displayItalic` | TiroDevanagariSanskrit_400Regular_Italic | Pull quotes |
| `fonts.wordmark` | TiroDevanagariSanskrit_400Regular | "Adhyan" title on splash/language screen |
| `fonts.body` | Hind_400Regular | All body text |
| `fonts.bodySemiBold` | Hind_600SemiBold | Labels, CTAs, nav |
| `fonts.hindi` | NotoSansDevanagari_400Regular | Hindi body |
| `fonts.bengali` | NotoSansBengali_400Regular | Bengali body |
| `fonts.mono` | DMMono_400Regular | Code, prompts |

**All fonts: SIL Open Font License — free for all use, no exceptions.**

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-28 | Expo SDK 51, React Native 0.74.5 | Stable, broad device support |
| 2026-05-28 | expo-sqlite/next (sync API) | Cleaner code; migrations run sync on startup |
| 2026-05-28 | No icon library (View primitives) | Smaller APK, no font dependency |
| 2026-05-28 | Tiro Devanagari Sanskrit → replace Eczar | More authentic; classical Indian editorial authority |
| 2026-05-28 | Wordmark = Tiro (not Ananda NepTouch 2) | Only free/OFL fonts; Tiro is consistent and sufficient |
| 2026-05-28 | supabase/functions excluded from tsconfig | Deno runtime; tsc can't resolve esm.sh imports |
| 2026-05-28 | DailyFeedCard fields: card_type, card_id, title, body, cta_label, cta_route | Matches Edge Function response; lib/sync.ts + index.tsx aligned |

---

## Blockers — Arnab Action Items

| Action | Command / Where | Needed for |
|---|---|---|
| Run migrations 001–026 in order | Supabase Dashboard → SQL Editor | Live data, push token column |
| Deploy all 4 Edge Functions | `supabase functions deploy assemble-daily-feed bhashini-tts check-scam send-streak-reminder` | All AI features |
| Set Supabase secrets | Dashboard → Edge Functions → Secrets | TTS + Scam checker |
| `BHASHINI_API_KEY` + `BHASHINI_USER_ID` | Supabase secret | Hindi/Bengali TTS |
| `GEMINI_API_KEY` | Supabase secret | Scam checker primary |
| `GROQ_API_KEY` | Supabase secret | Scam checker fallback |
| Set GitHub Actions secrets | Repo → Settings → Secrets | CI builds + Play Store |
| `EXPO_TOKEN` | GitHub secret | EAS build in CI |
| `EXPO_PUBLIC_SUPABASE_URL` | GitHub secret | Build env |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | GitHub secret | Build env |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | GitHub secret (base64 encoded) | Play Store submit |
| Create Play Store listing | play.google.com/console | First internal track upload |
| Upload app assets | `assets/` folder | icon.png 1024×1024, splash.png, notification-icon.png |
| Set up pg_cron for streak reminder | Supabase Dashboard → Database → Cron Jobs | Daily streak nudge |
| pg_cron schedule | `0 1 * * *` → `supabase functions/send-streak-reminder` | 6:30 AM IST daily |

---

## Phase 3 — Task Status

| Task | Status |
|---|---|
| EAS build CI workflow (eas-build.yml) | ✅ DONE |
| EAS submit workflow (eas-submit.yml) | ✅ DONE |
| Remove GPS permissions (DPDPA fix) | ✅ DONE |
| Expo Push token registration | ✅ DONE |
| Migration 026: push_token column | ✅ DONE |
| send-streak-reminder Edge Function | ✅ DONE |
| WhatsApp share on concept completion | ✅ DONE (Phase 2) |
| pg_cron setup | 🔲 Arnab (see Blockers) |
| Play Store listing created | 🔲 Arnab |
| App assets (icon, splash) uploaded | 🔲 Arnab |

## Phase 4 — Next Steps (Polish)

1. Settings screen: locale/persona change post-onboarding, clear data option
2. Onboarding flow polish — progress indicator, back navigation
3. Profile screen: streak calendar, milestone badges
4. Accessibility audit: font scale, contrast, tap targets
5. First production EAS build + Play Store internal track submission

---

## Non-Negotiables (always enforce)

- Min tap target 56×56dp — no exceptions
- No API keys in client code (all via Supabase Edge Functions)
- GPS never stored — district + state strings only
- `human_reviewed: true` required for safety-critical content
- Supabase region: ap-south-1 (Mumbai) only
- No jargon: LLM / hallucination / token / model / RAG banned from all content
