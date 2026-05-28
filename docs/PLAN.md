# PLAN.md — Development Plan

## Overview

Three phases. Each phase ends with a testable milestone. No code ships to users until it passes the Dadi Test (elderly user, real device, first 60 seconds navigable without help).

**Total timeline: 12 weeks to public launch**

---

## Phase 0 — Foundation (Weeks 1–2)
*Goal: Working database, design system, and empty-but-correct app shell on a real device*

### Milestone 0.1: Database Ready (Week 1, Days 1–3)
- [ ] Supabase project created (region: ap-south-1)
- [ ] All migrations run in order (see SCHEMA.md migration list)
- [ ] Row Level Security policies applied and tested
- [ ] Seed data inserted: 12 concept nodes, starter analogies, tool directory (10 tools), sandbox system prompts
- [ ] Storage buckets created: `audio`, `images`, `wa-cards`
- [ ] Edge Function scaffolds created (empty, correct signatures): `assemble-daily-feed`, `ai-sandbox`, `generate-tts`, `check-scam-message`
- [ ] Supabase local dev environment working (`supabase start`)

**Acceptance: Query `SELECT * FROM concept_nodes WHERE status = 'published'` returns 0 rows (published will happen in Phase 1). Query `SELECT * FROM concept_nodes` returns 12 rows.**

### Milestone 0.2: Expo Project Ready (Week 1, Days 2–4)
- [ ] Expo project initialised with Expo Router
- [ ] All dependencies installed (see ARCH.md library list)
- [ ] Environment variables configured in EAS secrets
- [ ] GitHub repository created with Actions workflow
- [ ] First EAS Build succeeds — blank app installs on test device
- [ ] expo-sqlite working: can write/read user_profile row
- [ ] Supabase client connected: can read from `concept_nodes`

**Acceptance: APK installs on Redmi 9. App opens without crash. Console shows Supabase connection OK.**

### Milestone 0.3: Design System Implemented (Week 1–2, Days 3–7)
- [ ] `constants/design.ts` created with all colour tokens, typography, shadows, spacing
- [ ] `ClayCard` component built and rendered correctly
- [ ] `ClayButton` component built — minimum 56dp height confirmed
- [ ] `AudioPlayer` component built (mock audio URL, wave animation works)
- [ ] `LanguagePicker` component — 3 buttons: English, हिंदी, বাংলা
- [ ] `CampfireCard` component (morning review question)
- [ ] Font loading confirmed for Cormorant Garamond, Plus Jakarta Sans, Noto Sans Devanagari, Noto Sans Bengali
- [ ] Hindi and Bengali text renders correctly on test device (not as boxes)

**Acceptance: A demo screen showing all components, all three languages rendered correctly, on Redmi 9.**

### Milestone 0.4: Navigation Shell (Week 2, Days 6–10)
- [ ] Expo Router configured: onboarding flow + tab navigation
- [ ] Onboarding: Language picker (Screen 1) → Persona optional (Screen 2) → Welcome (Screen 3)
- [ ] 4-tab bottom nav: Home, Learn, Cookbook, Profile
- [ ] Bottom nav tabs all minimum 56dp, icons + labels visible
- [ ] "I'm Lost" compass button visible on all main screens
- [ ] SQLite: `user_profile` table read/write working (stores language + persona choice)
- [ ] Language selection persists across app restarts

**Acceptance: User selects Hindi → restarts app → app opens in Hindi navigation.**

---

## Phase 1 — Core Learning Experience (Weeks 3–6)
*Goal: One complete concept (Scam Literacy) fully playable in all 3 languages. User can learn, complete, and have their progress saved.*

### Milestone 1.1: Content Pipeline Working (Week 3)
- [ ] Concept 10 (Scam Literacy Part 1) canonical node inserted and published in Supabase
- [ ] All explanation skins for C10 × {en, hi, bn} × elderly persona inserted
- [ ] `human_reviewed: true` set on all safety-critical skins (required before publish)
- [ ] `generate-tts` Edge Function implemented and tested
- [ ] Audio generated for all 3 language × elderly skins for C10 (~6 audio files)
- [ ] Audio files stored in Supabase Storage and accessible via public URL
- [ ] Cloudflare R2 connected (optional at this stage — Supabase Storage CDN sufficient)

**Acceptance: Query `SELECT audio_url FROM explanation_skins WHERE concept_id = 'concept_10_scam_literacy' AND human_reviewed = TRUE` returns 3+ rows with valid audio URLs that play.**

### Milestone 1.2: Concept Card Screen (Week 3–4)
- [ ] `ConceptCard` screen implemented for all 5 days
- [ ] Day 1 (Hook): story text + audio player + large emoji art
- [ ] Day 2 (Reveal): concept explanation + audio
- [ ] Day 3 (Practice): "Try this" interactive prompt area
- [ ] Day 4 (Retrieval): question + voice/text answer + fuzzy matching against acceptable answers
- [ ] Day 5 (Check): "Did this help you today?" binary tap
- [ ] Progress dots (1–5) update correctly between days
- [ ] Completion moment: warm colour pulse + completion message (no confetti for elderly)
- [ ] User progress saved to SQLite after each day
- [ ] Progress syncs to Supabase when online
- [ ] Audio pre-loads on card open (not on play tap)

**Acceptance: Elderly tester completes all 5 days of C10 in Hindi. Progress shows 'mastered' in SQLite. Audio plays without buffering.**

### Milestone 1.3: Offline Capability (Week 4)
- [ ] SQLite cache layer (`lib/cache.ts`) fully implemented
- [ ] App fetches concept + skin on first launch → writes to SQLite
- [ ] App serves from SQLite on subsequent launches (no network required)
- [ ] Airplane mode test: complete a concept card with no internet
- [ ] "Last updated: X" indicator shown on feed when offline
- [ ] Audio files cached to device filesystem (expo-file-system)
- [ ] First-launch WiFi download: concepts 1–6 audio pre-loaded

**Acceptance: Enable airplane mode after first launch. Navigate to Concept 10. Complete Day 1. Audio plays. Progress saves.**

### Milestone 1.4: Spaced Repetition Engine (Week 4–5)
- [ ] SM-2 algorithm implemented in `lib/sm2.ts`
- [ ] `review_due_at` calculated and saved to SQLite after concept mastery
- [ ] Campfire morning card shown when a concept is due for review
- [ ] Retrieval quality (0–5) mapped from user's answer correctness
- [ ] Ease factor and interval updated after each review
- [ ] SM-2 state synced to Supabase `user_progress` table
- [ ] Campfire card shows in correct language based on user locale

**Acceptance: Master Concept 10. Check SQLite — `review_due_at` is set 3 days ahead. Advance device clock 3 days. Open app — campfire review question appears.**

### Milestone 1.5: Streak System (Week 5)
- [ ] Streak increments when user opens app on consecutive days
- [ ] Streak persists in both SQLite and Supabase
- [ ] Database trigger (`on_progress_update`) fires and updates streak correctly
- [ ] Streak breaks: shows "welcome back" warmly — never shame
- [ ] Milestone detection: Day 3, 7, 14, 21, 30, 45, 60
- [ ] Milestone unlock: bonus card content made available at each milestone
- [ ] Push notification: "Streak reminder" if not opened by 8am (optional, user-controlled)
- [ ] `ai_age_level` updates based on milestones reached

**Acceptance: Open app 7 consecutive days. Day 7 milestone card appears. Uninstall and reinstall — streak preserved (synced from Supabase).**

### Milestone 1.6: Prompt Cookbook (Week 5–6)
- [ ] Cookbook screen renders saved prompts in recipe-book style
- [ ] "Save to cookbook" button on Day 3 (practice) and sandbox screens
- [ ] Prompts stored in SQLite + Supabase `prompt_cookbook`
- [ ] Search: text search across saved prompts
- [ ] Voice search: Bhashini ASR → search query
- [ ] Export: share selected prompt via WhatsApp (pre-formatted message)
- [ ] Use count increments when prompt is tapped/copied
- [ ] Starred prompts sorted to top

**Acceptance: Complete C10 Day 3. Tap "Save to Cookbook." Navigate to Cookbook tab. Prompt appears. Tap "Share" — WhatsApp opens with pre-filled message.**

---

## Phase 2 — Full Curriculum + Daily Feed (Weeks 7–10)
*Goal: All 12 concepts playable. Daily feed live. 3 languages. Public beta APK.*

### Milestone 2.1: All 12 Concepts (Week 7–8)
- [ ] All 12 concept canonical nodes published in Supabase
- [ ] All skins for en × elderly persona published (12 skins)
- [ ] All skins for hi × elderly persona published (12 skins)
- [ ] All skins for bn × elderly persona published (12 skins)
- [ ] Audio generated for all 36 skins (12 × 3 languages)
- [ ] Graph traversal working: prerequisite gates enforced
- [ ] Learn screen: shows full concept path with locked/unlocked states
- [ ] Horizon map: visual path of all 12 concepts, fog clears on mastery

**Acceptance: Complete Concept 1. Concept 2 unlocks. Concept 7 (hallucination) remains locked until Concept 1 is mastered.**

### Milestone 2.2: Daily Feed Live (Week 8–9)
- [ ] `assemble-daily-feed` Edge Function fully implemented
- [ ] Agmarknet API integrated (mandi prices by state + crop)
- [ ] IMD / Open-Meteo API integrated (weather by district)
- [ ] Cyber Dost scraper / feed integrated (scam alerts)
- [ ] pg_cron job runs at 6am IST daily
- [ ] Feed assembled per (occupation, locale, district) profile
- [ ] `DailyFeedCard` renders all 6 card types correctly
- [ ] Card types: community, alert, market, lesson, tool, tip
- [ ] WhatsApp share button working on every card
- [ ] Offline: yesterday's feed shown with timestamp

**Acceptance: Set user profile to farmer + Hindi + Maharashtra district. Open app. Daily feed shows: mandi price for tomato, Nashik region weather, scam alert if active, one concept micro-card.**

### Milestone 2.3: AI Sandbox (Week 9)
- [ ] `ai-sandbox` Edge Function implemented with Gemini Flash
- [ ] Groq Llama fallback implemented (automatic on quota exhaustion)
- [ ] Bhashini NMT pipeline: user language → English → LLM → English → user language
- [ ] Sandbox screen built (simple chat interface)
- [ ] Sandbox gated: only available after Concept 7 mastered (Rung 3)
- [ ] Daily quota enforced: 10 questions/user/day (server-side)
- [ ] `check-scam-message` function implemented
- [ ] Scam check accessible from home screen (not gated)
- [ ] Persona-specific system prompts loaded from `sandbox_system_prompts` table

**Acceptance: Ask sandbox a question in Hindi. Response arrives in Hindi. Test Groq fallback by exhausting Gemini quota. Test 11th question — returns quota exceeded message.**

### Milestone 2.4: Farmer + Student Persona Skins (Week 9–10)
- [ ] All 12 skins for hi × farmer persona published
- [ ] All 12 skins for en × student persona published
- [ ] All 12 skins for bn × student persona published
- [ ] Daily feed: farmer-specific streams (pest alerts, mandi, KVK contacts)
- [ ] Daily feed: student-specific streams (exam dates, scholarships, AI tools)
- [ ] Persona selection screen functional
- [ ] App switches content entirely when persona changes

**Acceptance: Switch persona from elderly to farmer. Concept 1 hook changes from "well-read student" analogy to "seed catalogue salesman" analogy. Daily feed shows mandi price instead of medicine scheme.**

### Milestone 2.5: WhatsApp Notifications (Week 10)
- [ ] WhatsApp Business API integrated in `wa-delivery` Edge Function
- [ ] Morning digest template approved by Meta
- [ ] Urgent alert template approved by Meta
- [ ] Weekly story template approved by Meta
- [ ] Subscription management in user profile (opt-in per stream)
- [ ] Daily digest: assembled at 6:30am, sent by 7am
- [ ] Alert delivery: triggered within 2 hours of Cyber Dost alert
- [ ] Unsubscribe: single reply "STOP" removes from all lists

**Acceptance: Opt in to morning digest. Next morning at 7am, receive WhatsApp message with weather + concept snippet. Reply STOP. Never receive another message.**

---

## Phase 3 — Community + Polish (Weeks 11–12)
*Goal: Community features live. Performance polished. Public launch.*

### Milestone 3.1: Community Stories (Week 11)
- [ ] Story submission form in app (text + voice)
- [ ] Story enters `community_stories` with `moderation_status: 'pending'`
- [ ] Supabase Studio view for Arnab to moderate (approve/reject)
- [ ] Approved stories enter daily feed queue on `publish_date`
- [ ] 20 seed stories pre-loaded (written by content team, realistic)
- [ ] Story geographic tagging working (surfaces near-user stories first)

### Milestone 3.2: Message in a Bottle (Week 11)
- [ ] Bottle authoring: available after Day 30 milestone (Keeper of Fire)
- [ ] Bottles enter moderation queue
- [ ] Approved bottles tagged to target concept + day
- [ ] Delivery: user reaching target concept + day sees bottle card in feed
- [ ] 20 seed bottles pre-loaded
- [ ] Anonymous delivery confirmed (no author identifier shown)

### Milestone 3.3: Tool Directory (Week 11–12)
- [ ] Tool directory screen: browsable, filterable by occupation
- [ ] "Tool of the Week" featured card in daily feed
- [ ] 15+ tools in directory at launch (see CONTENT.md)
- [ ] Each tool: name, description (EN/HI/BN), free/paid, one user review
- [ ] Direct link to tool opens in in-app browser

### Milestone 3.4: Performance + Launch Readiness (Week 12)
- [ ] Performance audit on Redmi 9 (Android 8): all targets met (see ARCH.md)
- [ ] APK size under 30MB
- [ ] Dadi Test passed with 3 real elderly users (not family members)
- [ ] Accessibility audit: all tap targets, all labels, reduce motion
- [ ] Hindi and Bengali rendering audit: all screens correct
- [ ] Security audit: no secrets in client bundle, RLS verified
- [ ] Crash rate monitoring configured (Expo EAS Diagnostics)
- [ ] Analytics: basic event tracking (concept started, completed, helpfulness)
- [ ] Privacy policy + terms published (non-profit, plain language)
- [ ] Play Store or direct APK distribution ready

**Launch acceptance: 3 elderly users independently complete Concept 10 (scam literacy) in Hindi with no assistance from the team. 0 crashes during 30-minute session.**

---

## Post-Launch Roadmap (Month 4+)

### Month 4: Language Expansion
- Tamil + Telugu skins for all 12 concepts
- Regional daily feed data (Tamil Nadu, Andhra Pradesh, Telangana)

### Month 5: Additional Personas
- Shop owner (Millennial) full skin set
- Govt. clerk (Millennial) full skin set
- Domestic worker (GenX) full skin set

### Month 6: Community Hub
- Deliberation feature: community can post questions, others respond
- Peer mentor designation: 60+ day users can guide newer users
- Council of Dissent mechanic (the "13th person must disagree" feature)

### Month 7–9: Kannada + Marathi
- Tier 3 language integration
- Regional content partnerships (agricultural universities, state governments)

---

## Weekly Rhythm (Content Production, Not Code)

**Every week, forever:**
- Monday: Claude drafts next week's concept micro-cards (all 5 days, all 3 languages)
- Tuesday–Wednesday: Arnab reviews, corrects cultural nuance
- Thursday: Approved content entered in Supabase Studio; TTS triggered
- Friday: Metrics review; identify any underperforming skins
- Saturday: Community story moderation (30 min)
- Sunday 7am: Content goes live (scheduled Supabase function)
