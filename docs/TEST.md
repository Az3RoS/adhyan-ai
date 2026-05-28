# TEST.md — Edge Cases and Test Scenarios

## Testing Philosophy

1. **The Dadi Test is the primary acceptance criterion.** If a 65-year-old first-time user on a low-end Android cannot complete the flow in 60 seconds, the feature fails — regardless of unit tests.
2. **Test on real hardware.** Redmi 9 (or equivalent — 3GB RAM, Android 8, no Play Services assumed).
3. **Test in real conditions.** Airplane mode. Throttled 3G (Chrome DevTools equivalent via Android Developer Mode). Auto-rotate. System font size = Largest.
4. **Safety-critical paths are integration-tested, not mocked.** The scam detection endpoint must be tested with real Bhashini and real LLM calls in staging.

---

## Phase 0 Edge Cases

### Milestone 0.1 — Database

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| DB-01 | Insert skin with `safety_critical: true` and `human_reviewed: false`, then query via app | RLS policy blocks return; no content shown | HIGH — safety gate failure could expose unreviewed content |
| DB-02 | Insert concept with concept_number 13 | Database CHECK constraint rejects; error returned | Low |
| DB-03 | Insert duplicate (concept_id, locale, persona) skin | Unique index rejects; upsert required | Medium |
| DB-04 | Run all 19 migrations on fresh Supabase project | All succeed in order; no FK violations | Medium |
| DB-05 | Supabase free tier storage limit hit (1GB) | App does not crash; shows "content unavailable" gracefully | Medium |
| DB-06 | Edge Function called without valid JWT | Returns 401; app shows "please log in" | High |
| DB-07 | `assemble-daily-feed` called with unknown district | Returns generic state-level feed; does not crash | Medium |
| DB-08 | pg_cron job fails at 6am | Yesterday's feed shown with stale indicator; no crash | Medium |
| DB-09 | User row in `user_profiles` deleted | App creates new profile on next launch; no data leak | High |
| DB-10 | Two devices logged in as same user update progress simultaneously | Last-write-wins; no data corruption; no crash on either device | Medium |

### Milestone 0.2 — Expo Project

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| EXPO-01 | App launched with no internet on first install | Shows "Please connect to WiFi to download your content" screen; language picker still works | High |
| EXPO-02 | App launched on Android 7 (API 25) | Shows "Please update Android" message; does not crash | Medium |
| EXPO-03 | Device storage < 50MB free | Warning shown before content download; graceful skip | Medium |
| EXPO-04 | EAS Build with invalid EXPO_TOKEN | CI fails with clear error; no partial APK | Low |
| EXPO-05 | Supabase URL environment variable missing | App shows configuration error screen; does not crash with JS error | High |

### Milestone 0.3 — Design System

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| DS-01 | System font size set to "Largest" | All text scales up; no text clipped or overlapping | High (elderly use this) |
| DS-02 | Hindi text rendered on device without Noto Sans Devanagari installed | System fallback font used; text readable (not boxes) | High |
| DS-03 | Bengali text rendered — test conjunct consonants (যুক্তাক্ষর) | Renders correctly; no character splitting | High |
| DS-04 | ClayButton tapped and held | Inset shadow animation plays; no state stuck | Low |
| DS-05 | Dark mode enabled at system level | App uses light theme (warm cream) regardless — dark mode not default | Medium |
| DS-06 | Right-to-left system language (user has Urdu as system language) | App renders LTR regardless (none of our 3 languages are RTL) | Medium |

### Milestone 0.4 — Navigation

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| NAV-01 | User on onboarding Screen 1 presses back | Exits app (first screen; no back navigation) | Medium |
| NAV-02 | User skips persona selection | App uses 'generic' persona; still fully functional | Low |
| NAV-03 | Language changed after onboarding (in Profile) | All UI and content immediately switches language; no restart required | High |
| NAV-04 | "I'm Lost" button tapped | Shows 4 options: "This is confusing / I need something easier / I want to try something different / Just browse" | High (core safety feature) |
| NAV-05 | Deep link opened to specific concept while not logged in | Redirects to onboarding → language → then concept | Medium |

---

## Phase 1 Edge Cases

### Milestone 1.1 — Content Pipeline

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| CP-01 | `generate-tts` called with empty text string | Returns 400 error; no empty audio file stored | Medium |
| CP-02 | Bhashini TTS API returns 503 | Edge Function retries 3× with backoff; if all fail, logs error and queues retry | High |
| CP-03 | Audio URL stored but file deleted from storage | App shows "audio unavailable" icon; text content still shown | Medium |
| CP-04 | Skin published without audio_url set | App renders card without audio player; no crash | Medium |
| CP-05 | Skin text contains special characters (॰, ₹, ँ ) | TTS handles correctly; no garbled output | Medium |
| CP-06 | Content team publishes skin with `human_reviewed: false` on safety-critical concept | Skin is not returned by any client query (RLS blocks it) | HIGH |

### Milestone 1.2 — Concept Card Screen

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| CC-01 | User on Day 3, app crashes, reopens | Returns to Day 3; progress not lost | High |
| CC-02 | Audio plays, user gets a phone call | Audio pauses automatically; resumes from same position after call | High (elderly have phone calls) |
| CC-03 | User taps "Save to Cookbook" on Day 3 with no account | Prompts to create account OR saves locally (anonymous cookbook) | Medium |
| CC-04 | Day 4 retrieval: user answer is partially correct ("confirm" vs "confirm with doctor") | Fuzzy match accepts; positive feedback given | High |
| CC-05 | Day 4 retrieval: user answers in English when locale is Hindi | Fuzzy match checks English acceptable_answers too | Medium |
| CC-06 | Day 5 check: user taps "No, this didn't help" | Accepts gracefully; does not penalise; optionally shows "What would help?" | Medium |
| CC-07 | User completes all 5 days in one sitting (same day) | Progress advances correctly; Day counter doesn't jump to mastered too fast | Low |
| CC-08 | Concept prerequisite not met; user tries to open locked concept | Shows "Complete [X] first" message; does not crash | Medium |
| CC-09 | Completion message displayed; user immediately navigates away | Progress still saved; doesn't require seeing full completion screen | Medium |
| CC-10 | User is on Day 3; content update changes Day 3 text | Shows updated text; progress day remains at 3 | Low |

### Milestone 1.3 — Offline

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| OFF-01 | App opened with no internet, content not yet cached | Shows "Connect to WiFi to download your content" with warm illustration; not blank screen | High |
| OFF-02 | Internet lost mid-concept (between Days 2 and 3) | Day 3 loads from SQLite; no error shown; no internet needed | High |
| OFF-03 | Network reconnects while on concept card | Silent background sync; no UI disruption | Medium |
| OFF-04 | SQLite database corrupted (simulate by manually corrupting file) | App detects corruption; clears SQLite; triggers fresh download | Medium |
| OFF-05 | Audio file partially downloaded and cached | Re-downloads incomplete file; does not play partial audio | Medium |
| OFF-06 | Daily feed fetch fails (no internet) | Shows last cached feed with "as of [date]" notice | High |
| OFF-07 | User makes progress offline; syncs later | Progress correctly merged with Supabase; no duplicate entries | High |
| OFF-08 | 500MB of audio cached; device storage runs low | App warns user; does not cache more; existing audio playable | Medium |

### Milestone 1.4 — Spaced Repetition

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| SM2-01 | User answers Day 4 retrieval correctly (quality: 5) | Ease factor increases; interval doubles | Low |
| SM2-02 | User answers incorrectly (quality: 1) | Interval resets to 1 day; ease factor decreases | Low |
| SM2-03 | `review_due_at` in past; user has no internet | Campfire question still shows (from SQLite); answer saved locally | High |
| SM2-04 | User has 3 concepts due for review on same day | All 3 campfire questions shown in sequence; all saved | Medium |
| SM2-05 | User hasn't opened app in 30 days | Multiple concepts overdue; shows maximum 2 review questions per session to avoid overwhelm | High |
| SM2-06 | User skips campfire question | No penalty; question re-queued for next day | Medium |

### Milestone 1.5 — Streak

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| STK-01 | User opens app at 11:59pm, closes, opens at 12:01am | Two separate days; streak increments | Medium |
| STK-02 | User in IST misses a day | Streak resets to 1 the next day; shown as "Welcome back!" not "Streak broken!" | High |
| STK-03 | User has `streak_freeze_available = 1`; misses a day | Freeze consumed automatically; streak preserved | Medium |
| STK-04 | Day 30 milestone triggers | Special card shown immediately on next open; AI Age updates to 'elder' | High |
| STK-05 | User uninstalls and reinstalls | Streak restored from Supabase after login | High |
| STK-06 | Two devices; user opens on both same day | Streak increments once (idempotent) | Medium |
| STK-07 | Clock on device set incorrectly (future date) | Server-side date check prevents false streak inflation | Low |

### Milestone 1.6 — Cookbook

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| CB-01 | User saves 100+ prompts | Cookbook scrolls smoothly; search still fast | Low |
| CB-02 | Prompt text contains Devanagari + emoji | Saved and displayed correctly | Medium |
| CB-03 | User exports cookbook as WhatsApp message | Message formatted correctly; cookbook isn't shared to wrong person (requires confirmation) | High (privacy) |
| CB-04 | User deletes a prompt | Soft-delete; removed from view; synced to Supabase | Low |
| CB-05 | Cookbook search with voice input in Bengali | Bhashini ASR transcribes; search runs against Bengali prompt text | High |

---

## Phase 2 Edge Cases

### Milestone 2.1 — All 12 Concepts

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| C12-01 | User completes all 12 concepts | "Keeper of Fire" status granted; community features unlock | High |
| C12-02 | User masters Concept 1 then loses progress (device reset) | Concept 1 still shows mastered after Supabase sync | High |
| C12-03 | Concept prerequisite is a chain (7 requires 1; 8 requires 7) | User cannot access 8 without completing 7 → 1 chain | Medium |
| C12-04 | Concept published with wrong pillar tag | Content team catches in review; no data impact | Low |

### Milestone 2.2 — Daily Feed

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| DF-01 | Agmarknet API down | Feed shows without mandi card; no crash; cached data if available | High |
| DF-02 | IMD API returns data for wrong district | App uses state-level weather as fallback | Medium |
| DF-03 | No scam alert active for user's state | Scam alert card not shown; other cards fill the space | Low |
| DF-04 | Community story queue empty | Story card not shown; other cards fill gracefully | Low |
| DF-05 | User changes occupation (farmer → elderly) | Next feed refresh reflects new occupation; same-day cache still shows | Medium |
| DF-06 | User in Maharashtra but Agmarknet shows Karnataka prices | Location mismatch; app uses registered state, not GPS | Medium |
| DF-07 | Feed card with very long headline | Text truncates at 2 lines with ellipsis; tap for full text | Low |
| DF-08 | WhatsApp share: user hasn't installed WhatsApp | System share sheet opens instead; no crash | High |

### Milestone 2.3 — AI Sandbox

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| SBX-01 | User asks about medical dosage in sandbox | Response includes "please consult your doctor" disclaimer; does not give specific dosage | HIGH (safety) |
| SBX-02 | User pastes Aadhaar number into sandbox | Response warns user never to share Aadhaar with AI; data not logged | HIGH (privacy) |
| SBX-03 | Gemini quota (1500/day) exhausted | Automatic fallback to Groq Llama 3.1 8B; user sees no difference | High |
| SBX-04 | Both Gemini and Groq unavailable | "Service temporarily unavailable" message; tries again in 5 min | High |
| SBX-05 | User sends 10 questions (daily limit) | 11th attempt shows quota message in their language; helpful, not technical | High |
| SBX-06 | User asks question in mix of Hindi and English (Hinglish) | Bhashini handles transliteration; sensible response returned | Medium |
| SBX-07 | Very long user input (> 500 words) | Truncated with note; or chunked; not crashed | Medium |
| SBX-08 | `check-scam-message` called with valid-looking but suspicious message | Function correctly classifies as potential scam; shows confidence level | HIGH (safety) |
| SBX-09 | `check-scam-message` called with real bank message | Classified as likely-real; note to always verify directly | High |
| SBX-10 | Sandbox accessed before Concept 7 mastered | "Complete your learning path first" shown; sandbox locked | Medium |

### Milestone 2.4 — Multiple Personas

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| PRS-01 | User changes persona after completing 3 concepts | Progress preserved; new persona skins loaded; graph traversal unchanged | High |
| PRS-02 | Farmer persona has no skin for Concept 9 (bias) yet | Falls back to 'generic' persona skin; no crash; note shown "more content coming" | Medium |
| PRS-03 | Student persona selected; user is 45 years old | App trusts user's self-selection; does not enforce age verification | Low |

### Milestone 2.5 — WhatsApp

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| WA-01 | User opts in to WhatsApp but number unverified | Cannot send; prompts OTP verification | High |
| WA-02 | User replies to morning digest with a question | Auto-response: "For questions, open the AI Saathi app"; not a live chat | High |
| WA-03 | Message template not approved by Meta | Feature disabled gracefully; opt-in form shows "coming soon" | Medium |
| WA-04 | 1000 conversation/month free limit hit | Stops sending; queues for next month OR escalates to paid if funded | High |
| WA-05 | User sends STOP | Immediately unsubscribed from all streams; confirmation message sent | High (legal) |
| WA-06 | Urgent scam alert sent at 2am | Message sent regardless of time (scam is urgent); user can mute WA notifications | Medium |

---

## Phase 3 Edge Cases

### Milestone 3.1 — Community Stories

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| CS-01 | User submits story with phone number in text | Moderation catches; number redacted before approval | HIGH (privacy) |
| CS-02 | User submits story in Kannada (unsupported language) | Story accepted; shown in original language with note; not translated | Low |
| CS-03 | Story submission queue > 100 pending | Arnab's moderation view shows oldest-first; no backlog shown to users | Medium |
| CS-04 | Approved story goes live; original submitter requests deletion | Story removed; feed updated; handled within 24 hours | High (privacy) |

### Milestone 3.2 — Message in a Bottle

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| MB-01 | Bottle text contains personal information | Moderation catches; rejected | HIGH (privacy) |
| MB-02 | All bottles for a concept have been delivered; new user reaches that concept | Oldest approved bottle is re-used; shown with "from someone who walked this path" | Low |
| MB-03 | User hasn't reached Day 30 milestone; tries to author a bottle | Feature locked; message explains milestone required | Low |

### Milestone 3.3 — Tool Directory

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| TD-01 | Tool URL is dead (404) | App shows "link may be broken — verify" warning; reports to admin | Medium |
| TD-02 | Tool's free tier has changed to paid | User sees outdated "Free" label; flagging mechanism for users to report | Medium |
| TD-03 | User on 2G tries to open tool link | Opens in in-app browser with "this may load slowly on your connection" | High |

### Milestone 3.4 — Launch Readiness

| ID | Scenario | Expected | Risk |
|---|---|---|---|
| LR-01 | 3 elderly users complete Concept 10 without assistance | All 3 succeed; 0 crashes; 0 moments of "I don't understand what this wants" | HIGH (launch gate) |
| LR-02 | APK installed on Android 8, 9, 10, 11, 12, 13 | Works on all; visual differences acceptable | High |
| LR-03 | App opened in system Accessibility > High Contrast mode | Text still readable; no invisible text | Medium |
| LR-04 | 100 simulated concurrent users | Supabase free tier handles without rate limiting | Medium |
| LR-05 | Malicious user sends XSS payload via story submission | Supabase parameterised queries prevent injection; stored as literal text | HIGH (security) |
| LR-06 | User tries to access another user's cookbook via URL manipulation | RLS blocks it; 403 returned | HIGH (security) |
| LR-07 | APK reverse-engineered to extract API keys | No API keys in client bundle; all keys server-side only | HIGH (security) |

---

## Regression Test Checklist (Before Every APK Release)

Run before every production build:

- [ ] Language picker works (all 3 languages)
- [ ] Concept 10 Day 1 loads with audio in Hindi
- [ ] Concept 10 Day 1 loads with audio in Bengali
- [ ] Offline mode: airplane mode, concept card still loads
- [ ] Streak increments correctly (test with date override)
- [ ] Prompt cookbook saves and loads
- [ ] Daily feed loads (or shows offline gracefully)
- [ ] AI sandbox returns response in user's language
- [ ] Scam check returns correct classification for known test cases
- [ ] All tap targets ≥ 56dp (visual inspection on device)
- [ ] Hindi and Bengali text renders (no boxes)
- [ ] System font "Largest" — no clipped text
- [ ] APK size < 30MB

---

## Known Acceptable Limitations (Not Bugs)

1. **Bhashini ASR accuracy for regional dialects** — Bhojpuri-accented Hindi may have lower accuracy. Accepted. Text fallback always available.
2. **Mandi prices delayed by 24–48 hours** — Agmarknet data is not real-time. Clearly labelled with "as of [date]" in the card.
3. **Sandbox unavailable at 6am IST** — Daily feed assembly Edge Function runs at this time; may briefly increase response times. Not a bug.
4. **Bengali conjunct consonants in TTS** — Some rare conjuncts may sound slightly off in Bhashini TTS. Acceptable at launch; will improve as Bhashini models improve.
5. **No iOS support at launch** — Explicit decision. Android only. Not a bug.
