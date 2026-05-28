# Adhyan — Session Context
> Read this before touching any code. Update when phases complete or decisions change.

---

## Phase Status

| Phase | Status | Notes |
|---|---|---|
| 0 — Scaffold | ✅ DONE | All screens, design system, DB layer, i18n, git push |
| 1 — Real Content | 🔲 NEXT | Supabase setup, seed Concept 1, SQLite sync |
| 2 — AI Features | 🔲 BLOCKED on Phase 1 | Bhashini TTS, Gemini scam checker |
| 3 — Distribution | 🔲 BLOCKED on Phase 2 | EAS, Play Store, WhatsApp sharing |

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
  UserContext.tsx      — locale, persona, streak, onboarding state
```

---

## Font Stack (decided 2026-05-28)

| Token | Font | Use |
|---|---|---|
| `fonts.display` | TiroDevanagariSanskrit_400Regular | All headlines, concept titles, screen headers |
| `fonts.displayItalic` | TiroDevanagariSanskrit_400Regular_Italic | Pull quotes |
| `fonts.wordmark` | AnandaNepTouch2 ⚠️ | "Adhyan" title on splash/language screen ONLY |
| `fonts.body` | Hind_400Regular | All body text |
| `fonts.bodySemiBold` | Hind_600SemiBold | Labels, CTAs, nav |
| `fonts.hindi` | NotoSansDevanagari_400Regular | Hindi body |
| `fonts.bengali` | NotoSansBengali_400Regular | Bengali body |
| `fonts.mono` | DMMono_400Regular | Code, prompts |

**Why Tiro:** Commissioned by Harvard UP for Murty Classical Library of India. Built for Sanskrit classical texts. Single 400 weight — size + spacing create hierarchy, not weight. Exact "modern yet ancient" quality requested.

**Why Ananda NepTouch 2 for wordmark:** Latin letters drawn with Devanagari stroke aesthetics. Unique brand identity for the "Adhyan" title. Not in production yet.

---

## Decisions Log

| Date | Decision | Rationale |
|---|---|---|
| 2026-05-28 | Expo SDK 51, React Native 0.74.5 | Stable, broad device support |
| 2026-05-28 | expo-sqlite/next (sync API) | Cleaner code; migrations run sync on startup |
| 2026-05-28 | No icon library (View primitives) | Smaller APK, no font dependency |
| 2026-05-28 | Mock data for feed + concepts | Content goes in Supabase Phase 1 |
| 2026-05-28 | Tiro Devanagari Sanskrit → replace Eczar | More authentic; classical Indian editorial authority |
| 2026-05-28 | Ananda NepTouch 2 for wordmark | Devanagari-stroke Latin; distinctive app identity |

---

## Blockers

| Blocker | Owner | Needed for |
|---|---|---|
| Supabase project creation (Mumbai ap-south-1) | Arnab | Phase 1 start |
| AnandaNepTouch2.ttf commercial license | Arnab | Wordmark in production |
| AnandaNepTouch2.ttf file → `assets/fonts/` | Arnab | Wordmark rendering in dev |
| EAS project ID in app.json (placeholder now) | Arnab | Phase 3 builds |
| Bhashini API key | Arnab | TTS audio in concept cards |

---

## Phase 1 — First Tasks (when ready)

1. Create Supabase project → set `.env` variables
2. Run 19 migration files from `docs/SCHEMA.md` in Supabase SQL editor
3. Seed `concepts` + `concept_skins` for Concept 1 (EN + HI)
4. Wire `lib/db.ts` sync: pull from Supabase → write to SQLite on startup
5. Replace mock data in `app/(tabs)/index.tsx` with `assemble-daily-feed` Edge Function
6. Add Ananda NepTouch 2 TTF as local asset; uncomment in `app/_layout.tsx`

---

## Non-Negotiables (always enforce)

- Min tap target 56×56dp — no exceptions
- No API keys in client code (all via Supabase Edge Functions)
- GPS never stored — district + state strings only
- `human_reviewed: true` required for safety-critical content
- Supabase region: ap-south-1 (Mumbai) only
- No jargon: LLM / hallucination / token / model / RAG banned from all content
