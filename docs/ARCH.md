# ARCH.md — Technical Architecture

## Overview

AI Horizon is a **React Native (Expo) Android application** backed by **Supabase** with a strict offline-first architecture. The application has two distinct layers: a **content layer** (managed by humans via Supabase Studio, never requiring code deployment) and a **code layer** (managed via GitHub → EAS Build → APK). These two layers are completely independent.

---

## Architecture Principles

1. **Content ≠ Code.** Adding a new concept card requires zero code changes. It is a Supabase row insert.
2. **Offline first.** SQLite on device is the source of truth. Supabase syncs when online.
3. **No AI calls client-side.** All LLM inference goes through Supabase Edge Functions.
4. **Pre-render audio.** Bhashini TTS runs at content-creation time, not at user-request time.
5. **Free by design.** Every architecture choice optimises for $0/month at launch scale.
6. **Security by default.** Row Level Security on every Supabase table. No public write access.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    USER'S DEVICE                         │
│                                                          │
│  ┌─────────────┐    ┌──────────────┐   ┌─────────────┐ │
│  │  Expo App   │◄──►│ SQLite Cache │   │ Audio Cache │ │
│  │ (React Native│    │ (expo-sqlite)│   │ (filesystem)│ │
│  └──────┬──────┘    └──────────────┘   └─────────────┘ │
│         │ (sync when online)                             │
└─────────┼───────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────┐
│                    SUPABASE (Backend)                    │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │  PostgreSQL  │  │ Edge Functions│  │   Storage     │ │
│  │  (content +  │  │ (AI sandbox, │  │  (audio files,│ │
│  │  user data)  │  │  daily feed  │  │   images)     │ │
│  └──────────────┘  │  assembly)   │  └───────────────┘ │
│                    └──────┬───────┘                     │
└───────────────────────────┼─────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              ▼             ▼             ▼
     ┌──────────────┐ ┌──────────┐ ┌──────────────┐
     │ Gemini Flash │ │ Bhashini │ │  Live Data   │
     │ (AI sandbox) │ │ (TTS/ASR)│ │  APIs        │
     └──────────────┘ └──────────┘ └──────────────┘
                                   (Agmarknet, IMD,
                                    Cyber Dost)
```

---

## Mobile Application

### Framework
- **React Native 0.74+** via **Expo SDK 51+**
- **Expo Router** for file-based navigation
- **Expo managed workflow** — no native code, no Xcode, no Android Studio required
- **EAS Build** for APK generation

### Navigation Structure
```
app/
├── _layout.tsx              # Root layout + providers
├── (onboarding)/
│   ├── language.tsx         # Step 1: Language selection (EN/HI/BN)
│   ├── persona.tsx          # Step 2: Occupation + age (skippable)
│   └── welcome.tsx          # Step 3: First concept preview
├── (tabs)/
│   ├── _layout.tsx          # Bottom tab bar (4 tabs)
│   ├── index.tsx            # Home: Daily feed
│   ├── learn.tsx            # Learn: Concept path
│   ├── cookbook.tsx         # Cookbook: Saved prompts
│   └── profile.tsx          # Profile: Progress + streak
├── concept/
│   └── [id].tsx             # Full concept card screen
├── sandbox.tsx              # AI chat (gated: Rung 3+)
└── +not-found.tsx
```

### State Management
- **React Context** for user profile, language, and persona state
- **expo-sqlite** for all persistent local data
- **TanStack Query** for server state and cache management
- No Redux; complexity not warranted

### Key Libraries
```json
{
  "expo": "~51.0.0",
  "expo-router": "~3.5.0",
  "expo-sqlite": "~13.4.0",
  "expo-av": "~14.0.0",
  "expo-file-system": "~17.0.0",
  "expo-notifications": "~0.28.0",
  "expo-speech": "~12.0.0",
  "@supabase/supabase-js": "^2.44.0",
  "@tanstack/react-query": "^5.40.0",
  "react-native-reanimated": "~3.10.0",
  "react-native-gesture-handler": "~2.16.0"
}
```

---

## Offline-First Cache Architecture

### Two-Level Cache

**Level 1: SQLite (permanent, device)**
Stores all concept content, user progress, and saved prompts. Never cleared except by user.

**Level 2: In-memory (session)**
TanStack Query cache for currently-viewed content. Hydrated from SQLite on app launch.

### Sync Strategy
```
App launch
  → Load from SQLite (instant, offline-capable)
  → Check network
    → If online: fetch updates from Supabase
      → Compare version timestamps
      → Download only changed content
      → Update SQLite
    → If offline: serve SQLite data with "last updated" indicator
```

### Content Download on First Launch
```
First WiFi connection detected
  → Download all 12 concept canonical nodes (~50KB JSON)
  → Download all skins for user's language + persona (~80KB JSON)
  → Download pre-rendered audio files for concepts 1-6 (~3MB audio)
  → Remaining audio downloads progressively as user advances
  → Progress indicator: "Preparing your content..."
```

### SQLite Schema (on device)
```sql
-- Local copy of content
CREATE TABLE local_concepts (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  pillar TEXT NOT NULL,
  concept_number INTEGER NOT NULL,
  synced_at INTEGER NOT NULL -- unix timestamp
);

CREATE TABLE local_skins (
  skin_id TEXT PRIMARY KEY,
  concept_id TEXT NOT NULL,
  locale TEXT NOT NULL,
  persona TEXT NOT NULL,
  hook TEXT NOT NULL,
  story TEXT NOT NULL,
  concept_bridge TEXT NOT NULL,
  one_liner TEXT NOT NULL,
  retrieval_question TEXT NOT NULL,
  completion_message TEXT NOT NULL,
  primary_format TEXT NOT NULL,
  audio_path TEXT,           -- local filesystem path to cached audio
  synced_at INTEGER NOT NULL,
  FOREIGN KEY (concept_id) REFERENCES local_concepts(id)
);

-- User state
CREATE TABLE user_progress (
  concept_id TEXT PRIMARY KEY,
  status TEXT NOT NULL,      -- 'not_started' | 'in_progress' | 'mastered'
  current_day INTEGER DEFAULT 0,  -- 1-5 for the micro-card sequence
  started_at INTEGER,
  mastered_at INTEGER,
  review_due_at INTEGER,     -- SM-2 next review timestamp
  ease_factor REAL DEFAULT 2.5,
  interval_days INTEGER DEFAULT 1
);

CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY DEFAULT 1,  -- single row
  locale TEXT DEFAULT 'hi',
  persona TEXT DEFAULT 'generic',
  occupation TEXT,
  age_group TEXT,
  streak_days INTEGER DEFAULT 0,
  last_active_date TEXT,    -- YYYY-MM-DD
  highest_milestone INTEGER DEFAULT 0,
  onboarding_complete INTEGER DEFAULT 0
);

CREATE TABLE prompt_cookbook (
  id TEXT PRIMARY KEY,
  prompt_text TEXT NOT NULL,
  context_note TEXT,
  occupation_tag TEXT,
  created_at INTEGER NOT NULL,
  use_count INTEGER DEFAULT 0
);

CREATE TABLE daily_feed_cache (
  date TEXT PRIMARY KEY,    -- YYYY-MM-DD
  feed_json TEXT NOT NULL,  -- serialised JSON of day's cards
  cached_at INTEGER NOT NULL
);
```

---

## Supabase Backend

### Project Setup
- Region: **ap-south-1 (Mumbai)** — lowest latency for India
- Plan: **Free tier** at launch
- Enable: Row Level Security on all tables, Point-in-Time Recovery when funded

### Database Tables
Full schema in `SCHEMA.md`. Summary:

| Table | Purpose |
|---|---|
| `concept_nodes` | The 12 canonical concept records |
| `explanation_skins` | Per-locale × per-persona content skins |
| `analogies` | Reusable analogy library |
| `exercises` | Interactive exercise definitions |
| `daily_feed_templates` | Templates for auto-assembled daily cards |
| `community_stories` | User-submitted stories (moderated) |
| `user_profiles` | Server-side user records |
| `user_progress` | Concept completion state |
| `messages_in_a_bottle` | Peer tips queued for delivery |
| `whatsapp_subscriptions` | WA delivery preferences |
| `tool_directory` | Curated AI tool listings |

### Edge Functions

**`assemble-daily-feed`**
Runs daily at 6am IST via pg_cron. Fetches from Agmarknet, IMD, Cyber Dost. Assembles personalised feed per occupation/locale profile. Caches result. Called by app on open; serves cached result.

```typescript
// Triggered by: pg_cron ('0 6 * * *') + manual app call
// Input: { occupation, locale, district, crop? }
// Output: { cards: DailyCard[], generated_at: string }
```

**`ai-sandbox`**
Handles user questions in the AI sandbox. Applies Bhashini translation pipeline (user language → English → LLM → English → user language). Enforces daily cap (10 questions/user). Uses Gemini Flash free tier → Groq Llama fallback.

```typescript
// Auth: Required (JWT)
// Input: { message: string, locale: string, conversation_history: Message[] }
// Output: { response: string, remaining_quota: number }
// Rate limit: 10 calls/user/day, enforced server-side
```

**`generate-tts`**
Takes approved skin text → calls Bhashini TTS API → saves audio MP3 to Supabase Storage → returns public CDN URL. Called during content pipeline, not at user request time.

```typescript
// Auth: Service role only (internal)
// Input: { text: string, locale: string, voice_id: string }
// Output: { audio_url: string, duration_seconds: number }
```

**`check-scam-message`**
User forwards a suspicious message → function analyses it against known patterns + calls LLM for classification → returns structured analysis. This is the primary safety feature.

```typescript
// Auth: Required
// Input: { message_text: string, locale: string }
// Output: { is_scam: boolean, confidence: 'high'|'medium'|'low', signs: string[], safe_action: string }
```

### Row Level Security Policies

```sql
-- Users can only read published content
CREATE POLICY "Public read published content"
ON concept_nodes FOR SELECT
USING (status = 'published');

-- Safety gate: no unreviewed safety-critical content
CREATE POLICY "Block unreviewed safety content"
ON explanation_skins FOR SELECT
USING (
  NOT (is_safety_critical = true AND human_reviewed = false)
);

-- Users can only read/write their own progress
CREATE POLICY "Own progress only"
ON user_progress FOR ALL
USING (auth.uid() = user_id);

-- Community stories only after moderation approval
CREATE POLICY "Approved community content only"
ON community_stories FOR SELECT
USING (moderation_status = 'approved');
```

---

## Audio Pipeline

### Pre-Render Strategy
Audio is never generated at user request time. It is pre-rendered when content is approved and cached at Cloudflare.

```
Content approved in Supabase
  → Webhook triggers generate-tts Edge Function
  → Bhashini TTS API called with skin text + locale + voice params
  → MP3 stored in Supabase Storage (supabase.co/storage)
  → Cloudflare CDN mirrors the file
  → audio_url written to explanation_skins table
  → App downloads audio on first encounter, caches locally
```

### Voice Selection (Bhashini)
| Locale | Voice ID | Style | Speed |
|---|---|---|---|
| `hi` (elderly) | `hi_female_warm_01` | Warm, slow | 0.85× |
| `hi` (youth) | `hi_female_clear_01` | Clear, normal | 1.0× |
| `bn` (elderly) | `bn_female_warm_01` | Warm, slow | 0.85× |
| `bn` (youth) | `bn_female_clear_01` | Clear, normal | 1.0× |
| `en` | `en_female_neutral_01` | Neutral | 1.0× |

### Audio File Specs
- Format: MP3, 64kbps mono (sufficient for speech; minimises file size)
- Target duration: Hook card ≤ 45s; Full concept ≤ 4 min
- Max file size: 2MB per card (fits comfortably in 2G budget)

---

## Bhashini Integration

### Services Used
1. **ASR (Automatic Speech Recognition)** — User voice → text in their language
2. **TTS (Text-to-Speech)** — Skin text → natural speech audio
3. **NMT (Neural Machine Translation)** — For daily feed dynamic content only

### API Pattern
```typescript
// Base URL
const BHASHINI_BASE = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'

// Pipeline config: ASR + NMT (for sandbox: user speaks → translate → LLM)
const pipeline = {
  pipelineTasks: [
    { taskType: 'asr', config: { language: { sourceLanguage: locale } } },
    { taskType: 'translation', config: { language: { sourceLanguage: locale, targetLanguage: 'en' } } }
  ]
}

// Pipeline config: TTS only (for pre-rendering content audio)
const ttsPipeline = {
  pipelineTasks: [
    { taskType: 'tts', config: { language: { sourceLanguage: locale }, gender: 'female', samplingRate: 8000 } }
  ]
}
```

### Caching Strategy
- All TTS outputs cached in Cloudflare R2
- Common ASR patterns cached (spaced review questions asked by thousands of users)
- Cache-Control: `public, max-age=31536000, immutable` for pre-rendered audio

---

## AI Sandbox Architecture

### Request Flow
```
User types/speaks question
  → App sends to ai-sandbox Edge Function (JWT auth)
  → Function checks daily quota (10 req/user/day)
  → If user language ≠ English:
    → Bhashini NMT: user_language → English
  → LLM call (Gemini Flash free tier)
  → If Gemini quota exhausted: Groq Llama 3.1 8B fallback
  → Response translated back: English → user_language (Bhashini)
  → Returned to app
```

### System Prompt (per persona)
Persona-specific system prompts stored in Supabase (`sandbox_system_prompts` table). Selected based on user's occupation + locale. Never generic. Examples:

```
Radha (elderly, Hindi):
"You are a helpful assistant speaking Hindi. The user is a retired teacher, 63 years old. 
Explain everything in simple Hindi as if talking to a respected elder. 
Never use technical terms. Keep responses under 100 words. 
Always suggest verifying health and financial advice with a professional."

Kabir (govt clerk):
"You are a helpful assistant for a government clerk in India.
Help with document summarisation, formal letter writing, and government scheme queries.
CRITICAL: Never ask for or process personal citizen information. 
Remind the user to verify AI outputs before including in official records."
```

### Cost Control
- Gemini Flash: 1,500 requests/day free (Google AI Studio API)
- Groq Llama 3.1 8B: Free tier fallback
- Hard cap: 10 questions/user/day (server-enforced)
- Semantic caching: cache responses to common questions (hash-based)
- Estimated cost at 500 DAU with sandbox: $0 (free tier sufficient)

---

## Live Data APIs

### Agmarknet (Mandi Prices)
```
Endpoint: https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
Auth: API key (free registration at data.gov.in)
Params: filters[state]=Maharashtra&filters[commodity]=Tomato&api-version=1.0
Frequency: Once daily at 6am IST via Edge Function
Cache: Supabase table `daily_mandi_cache` keyed by (state, commodity, date)
```

### IMD Weather
```
Endpoint: https://internal.imd.gov.in/section/nhac/dynamic/fcast_dis.php
Alt: Open-Meteo (open-source, no auth): https://api.open-meteo.com/v1/forecast
Params: latitude, longitude, daily=precipitation_sum,temperature_2m_max
Frequency: Once daily at 6am IST
Cache: Supabase table `daily_weather_cache` keyed by (district, date)
```

### Cyber Dost (Scam Alerts)
```
Source: https://cyberdost.mha.gov.in (scrape or RSS)
Also: https://pib.gov.in (press releases on cyber crime)
Frequency: 4× daily check for new alerts
Storage: Supabase table `scam_alerts` with geographic tagging
```

### WhatsApp Business API
```
Provider: Meta WhatsApp Business API (direct)
Free tier: 1,000 conversations/month
Endpoint: https://graph.facebook.com/v19.0/{phone_id}/messages
Auth: Bearer token (permanent token from Meta Business)
Use: Morning digest, urgent alerts, weekly community story
Template messages only (must be pre-approved by Meta)
```

---

## Notification Architecture

### Expo Push Notifications
Used for: streak reminders, new content Sunday, concept review due

```typescript
// Push notification schedule
const notificationSchedule = {
  'streak_reminder': '08:00 local',     // if not yet opened app
  'new_content':     'Sunday 07:00',    // weekly concept drop
  'review_due':      '09:00 local',     // spaced review campfire
  'streak_milestone': 'immediate',      // on achievement
}
```

### WhatsApp Delivery (Opt-in)
Three subscription tiers (user chooses):
1. **Morning digest**: Weather + price + one tip. Daily 7am. Image card format.
2. **Urgent alerts only**: Scam warnings when Cyber Dost issues alert for user's state.
3. **Weekly story**: One community story every Sunday.

---

## Performance Targets

| Metric | Target | Measurement |
|---|---|---|
| App launch to first screen | < 2s (cached) | Flipper / Expo DevTools |
| Concept card load | < 1s (cached) | User-perceived |
| Audio playback start | < 500ms (cached) | expo-av timing |
| Network data per session | < 500KB | Packet capture |
| APK size | < 30MB | EAS Build output |
| Minimum supported Android | API 26 (Android 8.0) | Expo minimum |
| Minimum RAM | 2GB device | Redmi 9 baseline |
| Offline capability | 100% curriculum | Manual test |

---

## CI/CD Pipeline

```yaml
# .github/workflows/build.yml
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install
      - run: npx expo install --check       # dependency validation
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: eas build --platform android --profile preview --non-interactive
```

**Content changes**: Supabase row insert → immediate (no build). 
**Code changes**: Push to main → GitHub Action → EAS Build → APK (~8 min).

---

## Environment Variables

```bash
# .env (never committed; set in EAS secrets)
EXPO_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
BHASHINI_API_KEY=...                # server-side only (Edge Function)
BHASHINI_USER_ID=...                # server-side only
GEMINI_API_KEY=...                  # server-side only
GROQ_API_KEY=...                    # server-side only
WHATSAPP_TOKEN=...                  # server-side only
AGMARKNET_API_KEY=...               # server-side only
```

No secrets in client-side code. All API keys are accessed only via Edge Functions.
