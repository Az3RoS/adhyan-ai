# AI Horizon — AI Literacy for Everyone

> Teaching AI to people who need it most — farmers, elderly, gig workers, shop owners, domestic workers, students — in English, Hindi, and Bengali. Free. Forever.

---

## What This Is

AI Horizon is a **non-profit, open-source Android application** that teaches AI literacy through daily micro-lessons, hyper-local content, and occupation-specific guidance. It is not a course. It is a daily companion that helps real people use AI safely, spot scams, and improve their lives — starting from the first 90 seconds.

**The single sentence:** A clever computer that reads, writes, and answers — and here is how to use it without getting fooled.

We never use the word "LLM." We never say "hallucination" to a 63-year-old. We never assume literacy, bandwidth, or technical confidence. We design for the hardest user first.

---

## Who It Is For

| Persona | Age | Language | Primary Need |
|---|---|---|---|
| Radha — Retired teacher | 63 | Hindi | Scam protection, pension navigation |
| Ramesh — Cotton farmer | 45 | Hindi | Crop advisory, market prices |
| Arjun — JEE student | 16 | Hindi + English | Study tools, academic integrity |
| Priya — Swiggy delivery | 23 | Hindi | Income safety, fake job offers |
| Kabir — Govt. clerk | 32 | Hindi + English | Safe AI use in official work |
| Sunita — Homemaker | 35 | Hindi | Family health, children's education |
| Dilip — Saree shop | 52 | Bengali | Customer communication, festival marketing |
| Ananya — Bank executive | 38 | Bengali + English | Productivity, job future |
| Rohit — Engineering student | 19 | Bengali + English | Study, career, AI ethics |
| Meena — Domestic worker | 38 | Hindi | Scam protection, labour rights |

---

## Core Principles

### 1. The Dadi Test
Every screen must be navigable by a 65-year-old with reading glasses on a Redmi 9 at 3G in the first 60 seconds. If she hesitates, it's a bug.

### 2. Problem First, Theory Never Demanded
A user should solve a real problem in their first 90 seconds. The concept name comes after the experience — not before it. Never open with "What is AI."

### 3. No Jargon, Ever
- ❌ LLM → ✅ "AI assistant / clever computer that reads and writes"
- ❌ Hallucination → ✅ "When AI makes things up confidently"
- ❌ Prompt engineering → ✅ "How to ask better questions"
- ❌ Training data → ✅ "Everything AI has read and learned from"
- ❌ Tokens → ✅ Never mention
- ❌ Model → ✅ The product name (ChatGPT, Gemini) or just "AI"
- Full list: see `LOCALISATION.md`

### 4. Voice First
Every piece of content is listenable. Reading is optional. Voice input is the primary interaction for low-literacy users. Bhashini TTS pre-renders audio for all content.

### 5. Offline Capable
Core curriculum (all 12 concepts) downloads on first WiFi sync. Daily feed degrades gracefully offline — shows last-known content with timestamp.

### 6. Free At Point of Use
No paywall on any learning content. Ever. The platform is free to launch ($0/month), sustained by grants, and open-source so the community can contribute.

### 7. Safety Critical Content Is Human-Reviewed
Any content touching health, finance, legal, or scam/fraud must have `human_reviewed: true` and a reviewer ID before it reaches users. No exceptions.

### 8. Dignity Above Everything
We serve people who have been talked down to by institutions their entire lives. Every word, every animation, every completion message must convey: "You are capable. This is for you."

---

## Tech Stack Summary

| Layer | Tool | Why |
|---|---|---|
| Mobile app | React Native + Expo | Arnab knows it; managed workflow; no native code |
| Backend | Supabase | Postgres + auth + storage + real-time; free tier generous |
| Audio | Bhashini API | Free; 22 Indian languages; ASR + TTS + translation |
| CDN | Cloudflare R2 | Zero egress fees; serves media at 2G speeds |
| AI sandbox | Gemini Flash (free) → Groq fallback | 1,500 req/day free; no cost at launch |
| Notifications | Expo Push + WhatsApp Business API | Free tiers cover launch scale |
| Live data | Agmarknet + IMD + Cyber Dost | Free government APIs |
| CI/CD | GitHub Actions + EAS Build | Free for open-source; APK in 10 min |

Full details: see `ARCH.md`

---

## Content Structure

- **12 universal concepts** across 4 pillars: Understand, Use, Evaluate, Protect
- **Daily micro-cards**: one concept sliced across 5 days (Hook → Reveal → Practice → Retrieval → Check)
- **Weekly Good Read**: one curated external article/video per week
- **Daily feed**: 5 cards personalised by occupation + age, assembled from live APIs
- **3 languages at launch**: English, Hindi, Bengali
- **Weekly content drops**: every Sunday at 7am

Full 3-month content plan: see `CONTENT.md`

---

## Repository Structure

```
ai-horizon/
├── app/                     # Expo Router screens
│   ├── (tabs)/              # Main tab navigation
│   │   ├── index.tsx        # Home / Daily Feed
│   │   ├── learn.tsx        # Concept cards + path
│   │   ├── cookbook.tsx     # Saved prompts
│   │   └── profile.tsx      # Progress + streak + family bridge
│   ├── concept/[id].tsx     # Individual concept screen
│   ├── onboarding/          # Language + persona setup
│   └── sandbox.tsx          # AI chat (upper rungs only)
├── components/
│   ├── cards/               # ConceptCard, DailyFeedCard, StreakCard
│   ├── audio/               # AudioPlayer with wave visualiser
│   └── ui/                  # Design system components
├── lib/
│   ├── supabase.ts          # Supabase client
│   ├── cache.ts             # SQLite offline cache
│   ├── sm2.ts               # Spaced repetition algorithm
│   └── bhashini.ts          # Bhashini API wrapper
├── content/seeds/           # Fallback offline content (JSON)
├── constants/               # Design tokens, language metadata
├── docs/                    # All .md documentation files
└── supabase/
    ├── migrations/          # Database migrations
    └── functions/           # Edge functions
```

---

## Development Rules for Claude Code

1. **Never hardcode content.** All content comes from Supabase or the seed JSON files.
2. **Never call AI APIs client-side.** All LLM calls go through Supabase Edge Functions.
3. **Always cache before network.** SQLite is the source of truth; Supabase syncs on connectivity.
4. **Test on low-end device profile.** Use React Native Performance Monitor; target 60fps on Redmi 9.
5. **All tap targets minimum 56×56dp.** The Dadi Test is a CI check, not a guideline.
6. **Every screen works in all 3 languages.** No screen ships without Hindi and Bengali rendering tested.
7. **Audio is never decorative.** If content exists, it plays. Bhashini TTS is pre-rendered, not runtime.
8. **Safety gates are code, not policy.** `human_reviewed: false` on safety-critical content = blocked at the query level.

---

## Getting Started (for Claude Code)

1. Read `ARCH.md` for full technical architecture
2. Read `SCHEMA.md` for all database tables and relationships
3. Read `DESIGN.md` for the complete design system before touching any UI
4. Read `PERSONA.md` before writing any content or copy
5. Read `PLAN.md` for the phased build order
6. Start with Phase 0: database setup → design system → onboarding flow → concept card screen

---

## Founding Team

**Arnab** — Product, content direction, cultural review, domain knowledge
**Claude** — Architecture, code, content drafts, schema design, UI/UX

This is a non-profit. Every decision optimises for the user, not the metric.
