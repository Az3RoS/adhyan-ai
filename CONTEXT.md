# Adhyan — Session Context
> Read this before touching any code. Update when phases complete or decisions change.

---

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| 0 — Scaffold | ✅ DONE | All screens, design system, DB layer, i18n, git push |
| 1 — Real Content | ✅ DONE | Supabase wired, 20 migrations run, Edge Function live, feed calls API |
| 2 — AI Features | ✅ DONE | 5-day flow, SM-2, Bhashini TTS, Gemini scam checker, skins c01–c10, community stories |
| 3 — Distribution | 🔲 NEXT | EAS builds, Play Store internal track, WhatsApp sharing deep-link |

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
                         syncProfileUp, syncProgressUp; DailyFeedCard type
  UserContext.tsx      — locale, persona, streak, onboarding, supabase_user_id

supabase/
  config.toml          — Project ref, anonymous auth enabled
  migrations/          — 20 files: 001-014 schema, 015-020 seed data
  functions/
    _shared/cors.ts
    assemble-daily-feed/index.ts — main feed Edge Function
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

**To run migrations:** Supabase Dashboard → SQL Editor → paste each file in order 001→020.

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

## Blockers

| Blocker | Owner | Needed for |
|---|---|---|
| Run migrations 001–020 in Supabase SQL Editor | Arnab | Live data in app |
| Deploy assemble-daily-feed Edge Function | Arnab (`supabase functions deploy assemble-daily-feed`) | Live feed |
| Bhashini API key | Arnab | TTS audio in concept cards |

---

## Phase 2 — Task Status

| Task | Status |
|---|---|
| concept/[id].tsx 5-day flow | ✅ DONE |
| SM-2 after Day 5 completion | ✅ DONE |
| syncSkinsDown() on startup | ✅ DONE |
| Learn screen — real SQLite data + unlock chain | ✅ DONE |
| Bhashini TTS Edge Function | 🔲 NEXT |
| Gemini Flash scam checker Edge Function | 🔲 |
| Seed explanation skins for Concepts 2–10 | ✅ DONE (migrations 021–024) |
| Community Stories + Messages in a Bottle in feed | ✅ DONE |

## Phase 2 — Next Steps

1. `supabase/functions/bhashini-tts/index.ts` — takes text + language → returns audio URL
2. Wire TTS into `concept/[id].tsx` — play audio for day1_hook if available
3. `supabase/functions/check-scam/index.ts` — takes text/URL → Gemini Flash → returns risk analysis
4. Seed explanation skins for c02–c10 (EN + HI minimum)
5. Add Community Stories section to home feed

---

## Non-Negotiables (always enforce)

- Min tap target 56×56dp — no exceptions
- No API keys in client code (all via Supabase Edge Functions)
- GPS never stored — district + state strings only
- `human_reviewed: true` required for safety-critical content
- Supabase region: ap-south-1 (Mumbai) only
- No jargon: LLM / hallucination / token / model / RAG banned from all content
