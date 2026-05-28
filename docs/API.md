# API.md — External API Integrations

All API calls from client-side code are prohibited. Every external API is called from Supabase Edge Functions only. API keys live in Supabase secrets, never in the app bundle.

This document covers all APIs used and investigated for AI Horizon, grouped by domain. Each entry states: what it does, cost, reliability, India-specific notes, and exact integration pattern.

---

## API Master Table

| API | Domain | Cost | Auth | Reliability | Priority |
|---|---|---|---|---|---|
| Bhashini (Dhruva) | Language — ASR/TTS/NMT | Free | API key | High | P0 — launch |
| Open-Meteo | Weather | Free | None | High | P0 — launch |
| Agmarknet (data.gov.in) | Mandi prices | Free | API key | Medium | P0 — launch |
| Cyber Dost (MHA) | Scam alerts | Free — scrape | None | Medium | P0 — launch |
| expo-location | Device location → district | Free | Device permission | High | P0 — launch |
| Pincode offline lookup | Location fallback | Free — bundled | None | High (offline) | P0 — launch |
| Gemini Flash | AI sandbox LLM | Free (1500/day) | API key | High | P0 — launch |
| Groq Llama 3.1 8B | AI sandbox fallback | Free tier | API key | High | P0 — launch |
| Expo Push | Push notifications | Free | Expo account | High | P0 — launch |
| WhatsApp Business | WA notifications | Free (1000/mo) | Meta token | Medium | P1 — month 2 |
| Google News RSS | News feed — all personas | Free | None | High | P1 — month 2 |
| Regional news RSS | Hindi/Bengali news | Free | None | High | P1 — month 2 |
| TMDB | Movies & series | Free | API key | High | P1 — month 2 |
| CricAPI | Cricket scores | Free (100/day) | API key | Medium | P1 — month 2 |
| MyScheme (NeGD) | Govt. scheme search | Free | None | Medium | P1 — month 2 |
| API Setu (MeitY) | Govt. data gateway | Free | API key | Medium | P1 — month 2 |
| eNAM | Live mandi trading prices | Free | Registration | Medium | P1 — month 2 |
| MapmyIndia | Reverse geocoding fallback | Free (10k/mo) | API key | High | P1 — fallback |
| IMD district forecast | Precise agri weather | Free — scrape | None | Medium | P2 — month 3 |
| NSP scholarships | Student opportunities | Free — curated | None | High (static) | P2 — month 3 |
| RBI RSS | Finance / policy alerts | Free | None | High | P2 — month 3 |
| Edamam | Recipe nutrition data | Free (500/day) | API key | Medium | P2 — month 3 |
| PM Kisan portal | Farmer scheme guidance | Free — deep link | None | Low | P2 — month 3 |
| ICAR pest advisory | Crop pest alerts | Free — curated | None | Low | P3 — month 4 |
| Kisan Suvidha | Multi-scheme farmer data | Free | Registration | Low | P3 — month 4 |

---

## Section A: Core Infrastructure APIs (P0)

---

### A1. Bhashini (Dhruva API)

**Purpose:** ASR (voice → text), TTS (text → audio), NMT (text translation)
**Cost:** Free — government-funded, no usage cap published
**Docs:** https://bhashini.gov.in / https://dhruva.bhashini.gov.in
**India relevance:** The only production-quality free ASR/TTS for Hindi and Bengali. Built specifically for Indian languages. 22 languages supported.

**Registration:**
1. Register at bhashini.gov.in
2. Apply for Dhruva API access at dhruva.bhashini.gov.in
3. Receive `userID` + `ulcaApiKey`
4. Call `https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline` to discover available models and service IDs

**Base Configuration:**
```typescript
const BHASHINI_AUTH_URL = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline'
const BHASHINI_INFERENCE_URL = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline'

const headers = {
  'userID': process.env.BHASHINI_USER_ID,
  'ulcaApiKey': process.env.BHASHINI_API_KEY,
  'Content-Type': 'application/json',
}
```

**ASR (Speech → Text):**
```typescript
async function asr(audioBase64: string, locale: string): Promise<string> {
  const body = {
    pipelineTasks: [{
      taskType: 'asr',
      config: {
        language: { sourceLanguage: locale },  // 'hi', 'bn', 'en'
        serviceId: '',    // populated from getModelsPipeline
        audioFormat: 'wav',
        samplingRate: 16000,
      }
    }],
    inputData: { audio: [{ audioContent: audioBase64 }] }
  }
  // POST to BHASHINI_INFERENCE_URL
  // Response: { pipelineResponse: [{ output: [{ source: 'transcribed text' }] }] }
}
```

**TTS (Text → Speech):**
```typescript
async function tts(text: string, locale: string, gender: 'female'|'male' = 'female'): Promise<string> {
  const body = {
    pipelineTasks: [{
      taskType: 'tts',
      config: {
        language: { sourceLanguage: locale },
        serviceId: '',
        gender,
        samplingRate: 8000,   // 8kHz sufficient for speech; smaller files
      }
    }],
    inputData: { input: [{ source: text }] }
  }
  // Response: base64-encoded MP3 audio
}
```

**Voice selection per persona:**

| Locale | Persona | Style | Speed |
|---|---|---|---|
| hi | elderly / Boomer | Warm female | 0.85× |
| hi | all others | Clear female | 1.0× |
| bn | elderly | Warm female | 0.85× |
| bn | youth | Clear female | 1.0× |
| en | all | Neutral female | 1.0× |

**Error handling:** Retry 3× with exponential backoff on 503. On all retries failed: log, return null, text-only mode.

---

### A2. Open-Meteo (Weather)

**Purpose:** Daily weather forecast per district for farmers, gig workers, elderly
**Cost:** Free, no API key, no rate limit published
**Docs:** https://open-meteo.com/en/docs
**Why over IMD direct:** Open-Meteo aggregates IMD + ERA5 + GFS. Better uptime. No auth. Excellent India coverage.

```typescript
const BASE = 'https://api.open-meteo.com/v1/forecast'

async function getDistrictWeather(district: string) {
  const coords = DISTRICT_COORDS[district]   // constants/districts.ts — all ~700 districts bundled
  if (!coords) return null

  const params = new URLSearchParams({
    latitude:  coords.lat.toString(),
    longitude: coords.lon.toString(),
    daily: 'precipitation_sum,precipitation_probability_max,temperature_2m_max,temperature_2m_min,windspeed_10m_max,weathercode',
    timezone: 'Asia/Kolkata',
    forecast_days: '7',
  })

  return await fetch(`${BASE}?${params}`).then(r => r.json())
}
```

**Farmer weather interpretation:**
```typescript
function getFarmerInsight(forecast: WeatherForecast, crop: string, locale: string): string {
  // Rain next 2 days + spray crop → "spray today before rain"
  // Temp > 40°C → "heat stress alert for {crop}"
  // Wind > 25 km/h → "avoid pesticide spray today"
}
```

**WMO weather codes → plain language (hi/bn/en):**
```typescript
const weatherDesc = {
  0:  { hi: 'साफ़ आसमान', bn: 'পরিষ্কার আকাশ', en: 'Clear sky' },
  61: { hi: 'हल्की बारिश', bn: 'হালকা বৃষ্টি', en: 'Light rain' },
  80: { hi: 'बारिश के झोंके', bn: 'বৃষ্টির ঝাপটা', en: 'Rain showers' },
  95: { hi: 'आंधी-तूफान', bn: 'বজ্রঝড়', en: 'Thunderstorm' },
  // ... complete 30-code mapping in constants/weatherCodes.ts
}
```

---

### A3. Agmarknet — Mandi Prices

**Purpose:** Daily agricultural commodity prices across Indian mandis
**Cost:** Free — register at data.gov.in
**Endpoint:** `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070`
**India relevance:** Official NAFED/APMC data. 3,000+ markets. Updated daily by ~10am IST.

```typescript
async function getMandiPrice(state: string, commodity: string): Promise<MandiRecord[]> {
  const today = formatDate(new Date(), 'DD/MM/YYYY')  // Agmarknet requires this format
  const params = new URLSearchParams({
    'api-key': process.env.AGMARKNET_API_KEY!,
    'format': 'json',
    'limit': '10',
    'filters[state]': state,
    'filters[commodity]': CROP_COMMODITY_MAP[commodity],
    'filters[arrival_date]': today,
  })
}

export const CROP_COMMODITY_MAP: Record<string, string> = {
  'tomato': 'Tomato', 'onion': 'Onion', 'potato': 'Potato',
  'cotton': 'Cotton(Long Staple)', 'wheat': 'Wheat',
  'rice': 'Paddy(Dusad)', 'mustard': 'Mustard', 'soybean': 'Soyabean',
  'groundnut': 'Groundnut', 'sugarcane': 'Sugarcane', 'maize': 'Maize',
  'jowar': 'Jowar(Sorghum)', 'bajra': 'Bajra(Pearl Millet)',
  'arhar': 'Arhar (Tur)', 'chilli': 'Dry Chillies',
}
```

**Caching:** Once daily at 6am IST via pg_cron → `daily_mandi_cache`. TTL: 36 hours.

---

### A4. Cyber Dost — Scam Alerts

**Purpose:** Active cyber safety alerts from MHA
**Source:** https://cyberdost.mha.gov.in + PIB press releases
**Cost:** Free — HTML scraping
**Frequency:** Every 6 hours via pg_cron

```typescript
async function fetchScamAlerts(): Promise<ScamAlert[]> {
  // Source 1: Cyber Dost website HTML
  // Source 2: PIB MHA press releases (keyword filter: cyber, fraud, scam, OTP, phishing)
  // Deduplicate → insert new alerts into scam_alerts table
  // severity='critical' → trigger WhatsApp push within 2 hours
}
```

---

### A5. Location — expo-location + Offline Pincode Table

**Purpose:** Resolve user to district + state for personalised feed. Never store GPS coordinates.

**Three-tier resolution:**
```
1. GPS (if permission granted) → expo-location reverseGeocode → district + state
2. Pincode entry → assets/pincodes.json offline lookup → district + state
3. State picker → state only (district = null)
4. Skip all → India generic
```

```typescript
import * as Location from 'expo-location'
import PINCODE_MAP from '../assets/pincodes.json'  // ~1.2MB, bundled offline

async function resolveLocation(): Promise<{ district: string | null; state: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync()

  if (status === 'granted') {
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
    const [addr] = await Location.reverseGeocodeAsync({
      latitude: pos.coords.latitude,
      longitude: pos.coords.longitude,
    })
    // Discard coordinates. Store only strings.
    return { district: addr.subregion || addr.city || null, state: addr.region || 'India' }
  }

  return { district: null, state: 'India' }  // prompts pincode entry in UI
}

function pincodeToLocation(pincode: string) {
  return PINCODE_MAP[pincode] || null  // no API call — fully offline
}
```

**DISTRICT_COORDS table** (`constants/districts.ts`) — all ~700 Indian districts with lat/lon + state. Static, bundled, no API.

---

### A6. Gemini Flash + Groq Fallback

**Gemini Flash (primary):**
- Endpoint: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
- Free: 1,500 requests/day
- Switch to Groq at 1,400 requests (100-request safety buffer)
- maxOutputTokens: 300

**Groq Llama 3.1 8B (fallback):**
- Endpoint: `https://api.groq.com/openai/v1/chat/completions`
- Free tier, generous limits
- Model: `llama-3.1-8b-instant`

```typescript
async function callLLM(messages: Message[]): Promise<string> {
  const quota = await getGeminiUsageToday()
  if (quota < 1400) {
    try { return await callGemini(messages) }
    catch (e) { if (e.status !== 429) throw e }
  }
  return await callGroq(messages)
}
```

---

## Section B: Daily Feed — Utility APIs (P1)

---

### B1. WhatsApp Business API

**Purpose:** Opt-in morning digest, urgent scam alerts, weekly story
**Cost:** Free — 1,000 conversations/month
**Provider:** Meta Cloud API

**Pre-approved templates (submit to Meta at setup):**

Template 1 — Morning Digest:
```
Name: ai_saathi_morning_digest | Language: hi | Category: UTILITY
Body: "नमस्ते! 🌅 AI Saathi से आज की जानकारी:\n\n{{1}}\n\nMore: {{2}}"
```

Template 2 — Scam Alert:
```
Name: ai_saathi_scam_alert | Language: hi | Category: UTILITY
Body: "⚠️ AI Saathi सुरक्षा अलर्ट:\n\n{{1}}\n\nसावधान रहें। STOP → unsubscribe"
```

Template 3 — Weekly Story:
```
Name: ai_saathi_weekly_story | Language: hi | Category: MARKETING
Body: "🌟 इस हफ्ते की कहानी:\n\n{{1}}\n\nPura padhein: {{2}}"
```

STOP handling: User replies "STOP" → immediately unsubscribe all streams → confirm message sent.
Rate limit: Track monthly count in Supabase. Stop at 950/month (50 buffer).

---

### B2. eNAM — Live Mandi Trading Prices

**Purpose:** Real-time bid/ask prices from connected APMCs (more actionable than Agmarknet daily averages)
**URL:** https://enam.gov.in
**Cost:** Free — registration required (approval 2–3 weeks)
**India relevance:** 1,000+ APMC mandis, 18 states. Shows whether buyers are active today.

```typescript
async function getENAMPrices(commodityId: string, mandiId: string, date: string) {
  const url = `https://enam.gov.in/api/dashboard_details_graph?kota_name=${mandiId}&commodity_name=${commodityId}&lan=en&start_date=${date}&end_date=${date}`
  // Returns: live bid prices, arrivals, traded quantity
}
```

**Fallback to Agmarknet** if eNAM unavailable or mandi not connected (silent fallback).

---

### B3. MyScheme (NeGD)

**Purpose:** Government scheme discovery per occupation/state/age
**URL:** https://www.myscheme.gov.in
**Cost:** Free — no formal public REST API; use search endpoint or static curation
**India relevance:** 1,000+ central + state schemes. The official one-stop government scheme platform.

**Integration strategy:**
MyScheme's search is accessible but not formally documented as a public API. Primary approach: curated static Supabase table of top 50 schemes per persona, updated quarterly. Secondary: attempt MyScheme search endpoint.

```sql
-- Supabase table: government_schemes
CREATE TABLE government_schemes (
  id            TEXT PRIMARY KEY,
  name_en       TEXT NOT NULL,
  name_hi       TEXT,
  name_bn       TEXT,
  description_en TEXT NOT NULL,
  description_hi TEXT,
  description_bn TEXT,
  suitable_personas TEXT[] DEFAULT '{all}',
  suitable_states   TEXT[] DEFAULT '{all}',
  min_age       INTEGER,
  max_age       INTEGER,
  apply_url     TEXT NOT NULL,
  helpline      TEXT,
  category      TEXT,   -- 'health' | 'agriculture' | 'education' | 'social' | 'finance'
  is_central    BOOLEAN DEFAULT TRUE,
  last_verified TIMESTAMPTZ
);
```

**Key schemes per persona (pre-loaded at launch):**

| Persona | Top schemes |
|---|---|
| Elderly | IGNOAPS, PM Vaya Vandana, Ayushman Bharat, Senior Citizen Savings |
| Farmer | PM Kisan, PMFBY, Kisan Credit Card, Soil Health Card, eNAM |
| Student | NSP scholarships, PM Vidya Lakshmi, Pragati (AICTE), Post-Matric SC/ST/OBC |
| Gig worker | PMSBY (₹20/year accident cover), PM Jan Dhan, e-Shram, PM SVANidhi |
| Homemaker | Ayushman Bharat family, Sukanya Samriddhi, PM Ujjwala, PM Matru Vandana |
| Domestic worker | e-Shram (unorganised worker card), PMSBY, Jan Dhan, state welfare boards |

---

### B4. API Setu (MeitY / NeGD)

**Purpose:** Single registration point for multiple government APIs
**URL:** https://www.apisetu.gov.in
**Cost:** Free — approval 2–3 weeks
**India relevance:** 2,000+ government APIs under one umbrella. Digital India initiative.

**Register early.** APIs accessible after approval:
- eNAM market data
- EPFO member data (worker PF balance — relevant for gig workers)
- UDISE+ school data (for student education feed)
- DigiLocker document verification (not used — no identity documents collected)

---

### B5. IMD District Forecast (Direct)

**Purpose:** Hyper-local agricultural district weather with monsoon accuracy
**URL:** https://mausam.imd.gov.in
**Cost:** Free — HTML scraping

```typescript
const IMD_URL = (state: string, district: string) =>
  `https://mausam.imd.gov.in/responsive/districtwise_forecast.php?state=${state}&dist=${district}`
// Parse the structured 5-day HTML table
// Output: { date, max_temp, min_temp, rainfall_mm, wind_speed, description }
```

Use **IMD** for farmer rain timing (monsoon accuracy); **Open-Meteo** as fallback if IMD scraping breaks.

---

### B6. MapmyIndia (Mappls) — Reverse Geocoding Fallback

**Purpose:** India-specific fallback geocoder if expo-location built-in fails
**Cost:** Free — 10,000 requests/month
**URL:** https://apis.mappls.com
**India relevance:** Better district-level accuracy than Google for rural India. Supports Hindi output.

```typescript
async function mappmyIndiaReverseGeocode(lat: number, lon: number) {
  const url = `https://apis.mappls.com/advancedmaps/v1/${key}/rev_geocode?lat=${lat}&lng=${lon}`
  // Returns: { results: [{ district, subDistrict, state, pincode }] }
}
```

Only called if expo-location returns null or non-Indian region.

---

## Section C: Interest-Based Content APIs (P1–P2)

Interest-based content keeps users returning daily after the core AI literacy curriculum is complete. Every card in every interest class must carry an AI angle — not just content for its own sake.

**The governing rule:** An interest card without an AI angle is a content aggregator card. That is not what we are building. Every interest card should prompt a thought or action that connects to AI literacy.

**Toggle system:** Each class is toggleable in user preferences. Off = card type removed entirely from feed. Default state per persona in the table below.

| Class | Emoji | Default ON for | Default OFF for |
|---|---|---|---|
| Recipes (Rasoi) | 🍳 | Sunita, Radha, Dilip | Arjun, Kabir, Ananya |
| Entertainment | 🎬 | Arjun, Priya, Rohit, Dilip | Meena, Ramesh |
| News | 📰 | All personas | — (universal default ON) |
| Cricket | 🏏 | Arjun, Ramesh, Rohit, Priya | Ananya, Sunita, Meena |
| Finance Tips | 💰 | Kabir, Ananya, Priya | Ramesh, elderly |
| Health Tips | 🌿 | Radha, Sunita, Meena, Ramesh | Arjun, Rohit |
| Career & Learning | 📚 | Arjun, Rohit, Priya, Kabir | Dilip, Ramesh, Radha |
| Business Tips | 🏪 | Dilip, Ananya | All others |

---

### C1. Google News RSS — News (All Personas)

**Purpose:** Regional and language-filtered news for the daily News card
**Cost:** Free — no auth, no API key
**Reliability:** High — Google infrastructure

```typescript
// Google News RSS — filterable by language and topic
const RSS_ENDPOINTS = {
  hi_national: 'https://news.google.com/rss?hl=hi&gl=IN&ceid=IN:hi',
  bn_national: 'https://news.google.com/rss?hl=bn&gl=IN&ceid=IN:bn',
  en_national: 'https://news.google.com/rss?hl=en&gl=IN&ceid=IN:en',
  hi_business: 'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRGx6TVdZU0FtaHBHZ0pKVGlnQVAB?hl=hi&gl=IN',
  hi_health:   'https://news.google.com/rss/topics/CAAqIQgKIhtDQkFTRGdvSUwyMHZNR3QwTlRZU0FtaHBLQUFQAQ?hl=hi&gl=IN',
  hi_sports:   'https://news.google.com/rss/topics/CAAqJggKIiBDQkFTRWdvSUwyMHZNRFp1ZEdvU0FtaHBHZ0pKVGlnQVAB?hl=hi&gl=IN',
}

async function fetchNews(locale: string, topic: string): Promise<NewsItem[]> {
  const url = RSS_ENDPOINTS[`${locale}_${topic}`] || RSS_ENDPOINTS[`${locale}_national`]
  const xml = await fetch(url).then(r => r.text())
  return parseRSS(xml).slice(0, 3)  // top 3 items only
}
```

**Additional high-quality Indian RSS feeds (topic-curated):**
```typescript
const CURATED_RSS = {
  // Hindi
  bbc_hindi:         'https://feeds.bbci.co.uk/hindi/rss.xml',
  dainik_bhaskar:    'https://www.bhaskar.com/rss-feed/1061/',
  amar_ujala:        'https://www.amarujala.com/rss/breaking-news.xml',
  navbharat_times:   'https://navbharattimes.indiatimes.com/rssfeedstopstories.cms',
  // Bengali
  anandabazar:       'https://www.anandabazar.com/rss',
  ei_samay:          'https://eisamay.com/feeds/eisamayonline/topheadlines.cms',
  // English (India-focused)
  the_hindu:         'https://www.thehindu.com/news/national/feeder/default.rss',
  indian_express:    'https://indianexpress.com/section/india/feed/',
  ndtv:              'https://feeds.feedburner.com/ndtvnews-top-stories',
  // Agriculture
  krishi_jagran_hi:  'https://hindi.krishijagran.com/feed/',
  // Business
  economic_times:    'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
  rbi_press:         'https://www.rbi.org.in/rss/rss_pressrelease.xml',
}
```

**AI angle on News cards:**
```
Card footer (always): "Kya yeh khabar sahi lagti hai? AI se verify karein →"
If headline contains: 'PM', 'scheme', 'yojana' → show "AI se iske bare mein poochein →"
```

**Caching:** Fetch every 4 hours → store top 5 items in `news_cache` table per (locale, topic).

---

### C2. TMDB — Movies & Series

**Purpose:** New Hindi/Bengali/South Indian film and OTT series recommendations
**Cost:** Completely free — no rate limit issues at our scale
**Docs:** https://developer.themoviedb.org
**Registration:** Register at themoviedb.org → API key (free, instant)
**India relevance:** Excellent Bollywood, regional cinema, and OTT coverage. Supports `with_original_language` filtering.

```typescript
const TMDB_BASE = 'https://api.themoviedb.org/3'
const TMDB_KEY = process.env.TMDB_API_KEY

// Fetch new releases — filtered by Indian languages
async function getNewIndianReleases(language: 'hi'|'bn'|'ta'|'te') {
  const params = new URLSearchParams({
    api_key: TMDB_KEY,
    language: 'en-US',
    with_original_language: language,  // 'hi' = Hindi films, 'bn' = Bengali, etc.
    sort_by: 'release_date.desc',
    'release_date.gte': thirtyDaysAgo(),
    'vote_count.gte': '5',  // avoid obscure releases
    region: 'IN',
  })
  const url = `${TMDB_BASE}/discover/movie?${params}`
  // Response: { results: [{ id, title, overview, poster_path, release_date, vote_average }] }
}

// Fetch what's trending in India this week
async function getTrendingInIndia() {
  return fetch(`${TMDB_BASE}/trending/movie/week?api_key=${TMDB_KEY}&region=IN`)
}

// Search for a specific film (used by sandbox "tell me about this film")
async function searchFilm(query: string, locale: string) {
  const params = new URLSearchParams({ api_key: TMDB_KEY, query, language: locale })
  return fetch(`${TMDB_BASE}/search/movie?${params}`)
}
```

**Poster images:** `https://image.tmdb.org/t/p/w342/{poster_path}` — serve via Cloudflare CDN.

**AI angle on Entertainment cards:**
```
New film card → "Is film ki story 3 lines mein jaanein — AI se poochein →"
              → Prompt pre-filled: "Tell me about [film title] in simple Hindi in 3 lines"
OTT series  → "Kya yeh dekhne layak hai? AI se honest review maangein →"
```

**Content filter:** Only include films with `vote_average >= 5.0` and `vote_count >= 10`. Avoid adult content (`include_adult: false`). No Hollywood content unless user has selected English + entertainment.

---

### C3. CricAPI — Cricket

**Purpose:** Live scores, match summaries, upcoming match schedule
**Cost:** Free — 100 API calls/day on free tier
**Docs:** https://cricapi.com
**Registration:** Register at cricapi.com → API key (instant)

```typescript
const CRIC_BASE = 'https://api.cricapi.com/v1'
const CRIC_KEY = process.env.CRICAPI_KEY

// Current matches (live + recent)
async function getCurrentMatches() {
  return fetch(`${CRIC_BASE}/currentMatches?apikey=${CRIC_KEY}&offset=0`)
  // Response: { data: [{ id, name, status, teams, score }] }
}

// Match details by ID
async function getMatchScore(matchId: string) {
  return fetch(`${CRIC_BASE}/match_info?apikey=${CRIC_KEY}&id=${matchId}`)
}

// Upcoming India matches
async function getUpcomingIndiaMatches() {
  return fetch(`${CRIC_BASE}/matches?apikey=${CRIC_KEY}&offset=0`)
  // Filter client-side for India matches
}
```

**Quota management (100/day is tight):**
- Cache match data for 30 minutes
- Only call during active match days (check match schedule daily)
- Outside match days: no API call, no cricket card in feed

**AI angle on Cricket cards:**
```
During match: "AI can explain cricket rules to your family — try asking AI Saathi"
After match:  "Ask AI: 'What happened in today's India match in 5 sentences in Hindi?'"
Upcoming:     "India vs [team] on [date] — use AI to look up their last 5 head-to-head results"
```

**Fallback:** ESPN Cricinfo RSS feed (`https://www.espncricinfo.com/rss/content/story/feeds/0.xml`) for match news when CricAPI quota exhausted.

---

### C4. Recipes (Rasoi) — Curated + Edamam

**Purpose:** Regional Indian recipes relevant to the season, festival, and persona
**Strategy:** No single reliable free Indian recipe API exists. Primary approach is a curated Supabase table of 300+ regional recipes, maintained weekly. Edamam API supplements with nutritional data.
**Edamam cost:** Free — 500 requests/day

**Recipe Supabase table:**
```sql
CREATE TABLE recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_en      TEXT NOT NULL,
  title_hi      TEXT,
  title_bn      TEXT,
  description_hi TEXT,
  description_bn TEXT,
  ingredients_hi TEXT[],  -- plain language: "2 cup chawal", "1 chammach haldi"
  ingredients_bn TEXT[],
  steps_hi      TEXT[],   -- max 5 steps, each max 20 words
  steps_bn      TEXT[],
  cuisine_region TEXT,    -- 'north', 'east', 'west', 'south', 'universal'
  occasion      TEXT[],   -- ['diwali', 'eid', 'puja', 'everyday', 'winter', 'summer']
  dietary_tags  TEXT[],   -- ['vegetarian', 'diabetic_friendly', 'no_onion_garlic']
  cook_time_min INTEGER,
  is_seasonal   BOOLEAN DEFAULT FALSE,
  suitable_personas TEXT[] DEFAULT '{all}',
  image_key     TEXT,     -- Supabase Storage key
  published_at  DATE
);
```

**Seasonal + occasion auto-selection:**
```typescript
function getRecipesForToday(date: Date, persona: string): Recipe[] {
  const month = date.getMonth()
  const upcomingFestivals = getFestivalsInNext7Days(date)  // from festival calendar DB

  // Priority: upcoming festival > seasonal > everyday
  // For diabetic/health filter: cross-reference user health tags (if set)
}
```

**Edamam integration (nutrition data):**
```typescript
const EDAMAM_BASE = 'https://api.edamam.com/api/nutrition-details'

async function getRecipeNutrition(ingredientList: string[]): Promise<NutritionData> {
  // POST with ingredient list → returns calories, protein, carbs, fat
  // Used only when user asks "kitni calories hai is recipe mein?"
  // NOT called for every recipe — only on demand
}
```

**AI angle on Recipe cards:**
```
Recipe card footer: "Is recipe ko diabetes ke liye adapt karna hai? AI se poochein →"
                    "Koi ingredient nahi hai ghar mein? AI se substitute poochein →"
Pre-filled prompt: "Mujhe [recipe name] recipe chahiye lekin mere ghar mein [X] nahi hai.
                    Alternative batao Hindi mein."
```

---

### C5. Finance Tips (Paisa)

**Purpose:** Personal finance tips, scheme updates, RBI alerts for Kabir, Ananya, Priya
**Sources:** All free RSS feeds, no API keys required

```typescript
const FINANCE_RSS = {
  rbi_press:       'https://www.rbi.org.in/rss/rss_pressrelease.xml',
  economic_times:  'https://economictimes.indiatimes.com/rssfeedstopstories.cms',
  money_control:   'https://www.moneycontrol.com/rss/personalfinance.xml',
  sebi_circulars:  'https://www.sebi.gov.in/sebi_data/rss/rssCirculars.xml',
}
```

**Content rules:**
- Never give investment advice. Surface information only.
- RBI alerts → "RBI ne ek naya rule nikala — AI se samjhein →"
- Never mention specific stocks or mutual funds
- Focus: schemes, savings accounts, insurance, UPI rules, tax basics

**AI angle on Finance cards:**
```
"Yeh RBI circular kya kehti hai? AI se plain Hindi mein samjhein →"
"PMSBY mein apply karna hai? AI se eligibility check karein →"
```

---

### C6. Health Tips (Swasthya)

**Purpose:** Seasonal health tips, medicine information, scheme awareness for Radha, Sunita, Meena
**Sources:** NHM website, WHO India RSS, Ayushman Bharat updates — all free, no auth

```typescript
const HEALTH_RSS = {
  nhm_india:       'https://nhm.gov.in/New_Updates_2018/rss.xml',
  who_india:       'https://www.who.int/india/rss-feeds',
  mohfw_press:     'https://pib.gov.in/RssMain.aspx?ModId=6&Lang=1&Regid=3',  // Health Ministry
}
```

**Content rules:**
- Never give specific medical dosages or diagnosis
- Always end with "apne doctor se confirm zaroor karein"
- Focus: scheme eligibility, seasonal prevention, medicine side effects (general), nutrition

**AI angle on Health cards:**
```
"Yeh dawa kya kaam karti hai? AI se simple Hindi mein poochein →"
"Kya main Ayushman Bharat ke liye eligible hoon? AI se check karein →"
Pre-filled: "Mere ghar mein ek 65 saal ke bade hain jinhe diabetes hai.
             Monsoon mein kya precautions leni chahiye? Hindi mein batao."
```

---

### C7. Career & Learning (Padhna)

**Purpose:** Exam calendar, scholarship alerts, skill development for Arjun, Rohit, Priya
**Sources:** NSP portal (curated), competitive exam calendars (curated Supabase table), Google News education RSS

```sql
-- Curated table updated twice yearly
CREATE TABLE scholarship_calendar (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en       TEXT NOT NULL,
  name_hi       TEXT,
  name_bn       TEXT,
  deadline      DATE NOT NULL,
  eligibility_summary_hi TEXT,
  apply_url     TEXT NOT NULL,
  amount        INTEGER,       -- annual amount in INR
  category      TEXT,          -- 'central' | 'state' | 'minority' | 'sc_st' | 'merit'
  suitable_states TEXT[] DEFAULT '{all}'
);

-- Exam calendar (major competitive exams)
CREATE TABLE exam_calendar (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_name     TEXT NOT NULL,
  exam_date     DATE,
  notification_date DATE,
  apply_by      DATE,
  exam_type     TEXT,  -- 'board' | 'entrance' | 'govt_job' | 'bank'
  description_hi TEXT,
  apply_url     TEXT
);
```

**AI angle on Career cards:**
```
Scholarship deadline → "Is scholarship ke liye apply karna hai? AI se documents checklist maangein →"
Exam upcoming →       "JEE ke liye AI study partner kaise banayein — 5 ways →"
New tech trend →      "Is field mein AI kya badal raha hai? Honest jawab →"
```

---

### C8. Business Tips (Dukaan)

**Purpose:** Festival calendar, GST updates, market trends for Dilip, shop owners
**Sources:** Festival calendar (curated Supabase table), GSTN press releases (RSS), Google Trends India (weekly report)

```typescript
const BUSINESS_RSS = {
  gst_council:   'https://www.gst.gov.in/newsandupdates/read/rss.xml',
  msme_ministry: 'https://pib.gov.in/RssMain.aspx?ModId=27&Lang=1',
}
```

**Festival calendar (pre-loaded, updated annually):**
```sql
CREATE TABLE festival_calendar (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  festival_name TEXT NOT NULL,
  festival_name_hi TEXT,
  festival_name_bn TEXT,
  festival_date DATE NOT NULL,
  year          INTEGER NOT NULL,
  regions       TEXT[] DEFAULT '{all}',   -- which states this is commercially significant in
  suitable_occupations TEXT[] DEFAULT '{shop_owner}',
  whatsapp_prompt_hi TEXT,   -- Ready-made WA message prompt in Hindi
  whatsapp_prompt_bn TEXT,   -- Ready-made WA message prompt in Bengali
  prep_days_notice INTEGER DEFAULT 7  -- how many days before to surface the card
);
```

**AI angle on Business cards:**
```
Festival approaching → "AI se Puja customer message likhein — ready prompt →"
GST update →          "Yeh GST change aapke dukaan pe kya asar dalta hai? AI se samjhein →"
```

---

## Section D: Interest Content — Supabase Schema

```sql
-- User interest preferences (toggled per class)
-- Stored in user_profiles JSONB column (no separate table needed)
-- Default: persona-based defaults applied at onboarding

-- In user_profiles, add column:
ALTER TABLE user_profiles
ADD COLUMN interests_enabled TEXT[] DEFAULT '{news,health}';

-- Values: 'recipes' | 'entertainment' | 'news' | 'cricket' | 'finance' | 'health' | 'career' | 'business'
-- Empty array = all interest content OFF (only core content shown)

-- Daily feed card types (expanded to include interest types)
-- In daily_feed_cache.feed_json, card type field now includes:
-- 'recipe' | 'entertainment' | 'news' | 'cricket' | 'finance_tip' | 'health_tip' | 'career' | 'business_tip'
-- alongside existing: 'community' | 'alert' | 'market' | 'lesson' | 'tool' | 'tip'
```

---

## Section E: API Registration Checklist

### Before Launch (P0)
- [ ] data.gov.in — register → Agmarknet API key
- [ ] bhashini.gov.in → dhruva.bhashini.gov.in — register, request Dhruva API access (can take 1 week)
- [ ] Google AI Studio — Gemini API key (free tier, instant)
- [ ] Groq console — create account, get API key (instant)
- [ ] themoviedb.org — TMDB API key (instant, free)
- [ ] Expo EAS — account setup, push notification project ID

### Month 2 (P1)
- [ ] Meta Developer — WhatsApp Business API, phone number, 3 templates submitted for approval
- [ ] cricapi.com — free tier API key (instant)
- [ ] mappls.com — MapmyIndia free tier key (instant, 10k/month geocoding)
- [ ] apisetu.gov.in — API Setu gateway registration (approval 2–3 weeks)
- [ ] enam.gov.in — eNAM API access registration (approval 2–3 weeks)

### Month 3 (P2)
- [ ] edamam.com — recipe nutrition API key (free 500/day, instant)
- [ ] Apply for Anthropic nonprofit API credits — anthropic.com/nonprofit

---

## Section F: API Failure Hierarchy

| API | Primary failure | Fallback | User-visible |
|---|---|---|---|
| Bhashini ASR | Retry 3× | Text input shown | "Text likh sakte hain" |
| Bhashini TTS | Retry 3× | Text-only mode | Audio button hidden |
| Open-Meteo | Unavailable | IMD scrape | "Weather unavailable" if both fail |
| Agmarknet | Unavailable | eNAM fallback, then cached | "Kal ka bhav" label |
| eNAM | Unavailable | Agmarknet | Transparent |
| Cyber Dost | Unreachable | Last 7-day alert cached | "Recent alert" label |
| Gemini Flash | 429 quota | Switch to Groq | None (transparent) |
| Groq | Unavailable | "Try again in 5 min" | Hindi message |
| Google News RSS | Unavailable | Regional RSS fallback | None |
| TMDB | Unavailable | No entertainment card today | Card absent, no error |
| CricAPI | Quota (100/day) | ESPN Cricinfo RSS | None |
| MyScheme | Unavailable | Bundled static scheme list | None |
| WhatsApp | Error | Queue retry 2 hours | None (silent) |
| Expo Push | Token expired | Re-register next open | None |
| GPS location | Denied or failed | Pincode entry prompt | Soft UI prompt |
| Pincode lookup | Not found | State picker | "Pincode nahi mila" |
