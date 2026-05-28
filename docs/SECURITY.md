# SECURITY.md — Privacy and Security

## The Context

AI Horizon launches exclusively in India. All design decisions — data collection, localisation, location handling, interest tracking, regulatory compliance — are India-specific for at least the first year.

Our users include:
- **Elderly women** who have been cheated by digital scams
- **Domestic workers** with no digital safety awareness
- **Farmers** in remote areas who may not understand data rights
- **Gig workers** whose income depends on platform access

For these users, a data breach or privacy failure is not an inconvenience — it can cause direct financial harm, identity theft, or loss of access to government benefits. **Security here is a life-safety issue.**

---

## Location Strategy — India-Specific

### The Principle
We need district/state for personalised daily feeds (mandi prices, weather, scam alerts). We do **not** need precise GPS coordinates. The resolution we need is: district + state. Nothing more.

### Three-Tier Location Resolution

**Tier 1 — GPS (with permission, best result)**
If the user grants location permission, use `expo-location` to get coordinates → reverse geocode to district + state → store only the district/state string. Coordinates are discarded immediately. Never stored.

```typescript
// lib/location.ts
import * as Location from 'expo-location'

async function resolveUserLocation(): Promise<{ district: string | null; state: string }> {
  const { status } = await Location.requestForegroundPermissionsAsync()

  if (status === 'granted') {
    try {
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,  // City-level, not street-level
      })
      const [addr] = await Location.reverseGeocodeAsync({
        latitude:  pos.coords.latitude,
        longitude: pos.coords.longitude,
      })
      // Store ONLY district + state strings. Coordinates discarded immediately.
      return {
        district: addr.subregion || addr.city || null,
        state:    addr.region   || 'India',
      }
    } catch {
      return { district: null, state: 'India' }
    }
  }
  return { district: null, state: 'India' }  // prompts pincode entry in UI
}
```

**Tier 2 — Pincode entry (no permission needed)**
If user declines GPS, a simple pincode input is shown. Resolved via the offline India pincode → district/state lookup table bundled with the app. No API call, no network, no tracking.

```typescript
// assets/pincodes.json — 29,000+ Indian pincodes → { district, state }
// Source: data.gov.in All India Pincode Directory (public domain, updated quarterly)
// File size: ~1.2MB — acceptable for offline bundle
import PINCODE_MAP from '../assets/pincodes.json'

function pincodeToLocation(pincode: string): { district: string; state: string } | null {
  return PINCODE_MAP[pincode] || null
}
```

**Tier 3 — State-only selection (broad fallback)**
If user provides neither GPS nor pincode, a state picker is shown (29 states + 8 UTs). All feeds work at state level. Mandi prices show state-level averages; weather shows state capital forecast.

**Tier 4 — India generic (absolute default)**
If nothing is provided, all feeds use India-level content. Scam alerts (national), general health schemes, national mandi averages. No feed breaks. It is simply less personalised.

### Permission Request UX

The permission dialog must explain clearly **why** location is requested and make declining easy. No dark patterns.

```
Hindi UI:
"आपके जिले की जानकारी से हम दिखा सकते हैं:
• आपके इलाके की मंडी की कीमतें
• आपके जिले का मौसम
• आपके राज्य की scam alerts

सिर्फ जिला-स्तर तक — सटीक पता कभी save नहीं होता।

[अनुमति दें]  [Pincode डालें]  [बाद में]"
```

If user taps "बाद में" (Later): app works fully with India-generic content. The prompt is shown again once after 7 days. After that, never again unless user initiates from Settings.

### What is NEVER Stored
- Raw GPS coordinates (lat/lon) at any point
- Precise street address
- PIN code in user profile (only the resolved district/state string is stored)
- Location history or movement timestamps

---

## Interest Preference Data — Not Sensitive

Users can toggle content interest classes on/off (recipes, entertainment, news, cricket, finance, health, career, business). These preferences are stored as a string array in `user_profiles.interests_enabled`.

**This data is not sensitive personal data under DPDPA 2023.** Knowing someone likes cricket or recipes does not reveal health status, financial status, religion, or any category requiring special protection.

**What we do with interest data:**
- Personalise the daily feed (the only purpose)
- Never sell, share, or use for advertising
- Never infer demographics from interests
- Never use interests to build a profile beyond content delivery

**What we never do:**
- Target advertising based on interests (we have no advertising)
- Share interest data with third parties
- Combine interest data with external data sources
- Use interests to infer age, health conditions, religion, or financial status

**Storage:** `interests_enabled TEXT[]` in the existing `user_profiles` row. No separate tracking table. No analytics event for which interest a user turns on/off — that level of surveillance is not appropriate for this platform.

---

## Data Minimisation: What We Never Collect

| Data | Why we don't collect it |
|---|---|
| Aadhaar number | Biometric identity; criminal liability if breached; DPDPA 2023 violation |
| Bank account number | Financial fraud risk |
| OTP (any) | Never requested; our own app asking for OTP is itself a red flag |
| Password (plain text) | Never stored; hashed by Supabase auth |
| GPS coordinates | District/state sufficient; precision is surveillance |
| Precise street address | District + state is sufficient for all features |
| Phone contacts | No feature requires it |
| Biometric data | No feature requires it |
| WhatsApp message content | Scam check analyses and discards; not retained |
| Employer names/addresses | Exploitation risk for domestic workers |
| Content consumption patterns | We track completion (for spaced repetition) — not click-through or reading time |

---

## Data We Do Collect (Minimum Viable)

| Data | Purpose | Retention | Encryption |
|---|---|---|---|
| User ID (UUID) | Auth and progress | Account lifetime | Supabase auth |
| Language preference | Content delivery | Account lifetime | At rest |
| Persona / occupation | Feed personalisation | Account lifetime | At rest |
| District + state (strings only) | Local feed assembly | Account lifetime | At rest |
| Interests enabled (string array) | Interest feed | Account lifetime | At rest |
| Learning progress | Spaced repetition | Account lifetime | At rest |
| Streak count | Motivation feature | Account lifetime | At rest |
| Saved prompts | Cookbook feature | User-deletable | At rest |
| WhatsApp phone (opt-in only) | WA notifications | Until opt-out | AES-256 |
| Family bridge phone (opt-in only) | Weekly summary | Until opt-out | AES-256 |
| Push notification token | Push delivery | Until app uninstall | At rest |
| Anonymous usage events | Product improvement | 90 days, then purged | At rest |

Phone numbers stored encrypted using AES-256. Encryption key in Supabase Vault, not in the database column. Application never logs plain-text phone numbers.

---

## India Regulatory Compliance

### Digital Personal Data Protection Act 2023 (DPDPA)
India's DPDPA is the primary governing regulation.

Key obligations and how we meet them:

| Obligation | How we comply |
|---|---|
| Consent before collection | Location permission is always user choice. Explicit opt-in for WhatsApp. No dark patterns. |
| Purpose limitation | Location used only for feed personalisation. Interests used only for feed content. |
| Data minimisation | District + state, not coordinates. No fields collected beyond what is listed above. |
| Right to erasure | One-tap data deletion in Profile → processed within 72 hours. |
| Data localisation | Supabase hosted on ap-south-1 (Mumbai). All user data stays in India. |
| No cross-border transfer | No user data sent to servers outside India. Gemini/Groq API calls send only the question text — no user identity, no stored data. |

### IT Act 2000 — Sensitive Personal Data
Under India's IT Rules, health data and financial data are Sensitive Personal Data requiring explicit consent. Our sandbox includes disclaimers when health or financial topics arise. No health or financial data is ever stored — only the conversation happens, in a session, discarded after.

### API Call Privacy
When calling Gemini Flash or Groq for sandbox responses:
- Only the user's question text is sent
- No user ID, no name, no location, no phone number
- No conversation history beyond the current session
- No PII in the API payload

---

## Supabase Security Configuration

### Region: ap-south-1 (Mumbai)
Required for DPDPA compliance (data localisation) and lowest latency for Indian users. **Never change this region.**

### Row Level Security (Non-Negotiable)
Every table has RLS enabled. No table is left with RLS disabled in production.

```sql
-- Core RLS policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);

ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own progress" ON user_progress
  FOR ALL USING (auth.uid() = user_id);

ALTER TABLE prompt_cookbook ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own cookbook" ON prompt_cookbook
  FOR ALL USING (auth.uid() = user_id);

-- Safety gate: block unreviewed safety-critical content
-- This is enforced in SQL, not in application code
ALTER TABLE explanation_skins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Block unreviewed safety content" ON explanation_skins
  FOR SELECT USING (
    status = 'published'
    AND NOT (is_safety_critical = TRUE AND human_reviewed = FALSE)
  );
```

### API Key Security
- **Anon key** (`EXPO_PUBLIC_SUPABASE_ANON_KEY`): Public, safe. Limited by RLS.
- **Service role key**: Never in client bundle. Only in Edge Functions via Supabase secrets.
- **All third-party API keys** (Bhashini, Gemini, Groq, TMDB, CricAPI, etc.): Only in Supabase secrets.

Verification command (must return zero results before any APK release):
```bash
grep -r "BHASHINI_API_KEY\|GEMINI_API_KEY\|GROQ_API_KEY\|TMDB_API_KEY\|CRICAPI_KEY" app/ components/ lib/ constants/
```

### Supabase Auth Configuration
```
Email auth:       Disabled (no email required)
Phone auth:       Enabled (optional, for cross-device sync)
Anonymous auth:   Enabled (DEFAULT — full app without account)
OAuth:            Disabled at launch
JWT expiry:       1 hour (refresh tokens: 30 days)
```

Anonymous auth is the default. Most users never create an account. All learning progress is stored locally in SQLite first, synced to Supabase only if user opts into account creation.

---

## AI Sandbox Safety

### Sensitive Data Detection (Aadhaar, OTP, bank)
```typescript
// Edge Function: ai-sandbox
// Run BEFORE forwarding user message to LLM
const sensitivePatterns = [
  /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/,   // Aadhaar format (12 digits in groups)
  /\b[A-Z]{5}\d{4}[A-Z]\b/,             // PAN format
  /account\s*number/i,
  /bank\s*account/i,
  /\bpin\b.*\b\d{4,6}\b/i,
  /\bOTP\b/i,
  /\bpassword\b/i,
  /\bcvv\b/i,
]

function containsSensitiveData(text: string): boolean {
  return sensitivePatterns.some(p => p.test(text))
}

// If detected: DO NOT forward to LLM
// Return in user's language:
// hi: "Aapne kuch private information type ki hai. Aadhaar, OTP, bank details —
//      yeh kisi bhi AI mein kabhi type mat karein."
// bn: "আপনি কিছু ব্যক্তিগত তথ্য লিখেছেন। Aadhaar, OTP, bank details —
//      এগুলো কোনো AI-তে কখনো লিখবেন না।"
```

### Prompt Injection Prevention
System prompts come from the `sandbox_system_prompts` Supabase table. User input is always the final message. The system prompt string is never constructed by concatenating user input.

```typescript
// CORRECT: system prompt from DB, user input as separate message
const messages = [
  { role: 'user', parts: [{ text: systemPromptFromDB }] },
  { role: 'user', parts: [{ text: userMessage }] }
]

// NEVER:
const systemPrompt = `You are helpful. User says: ${userMessage}`  // injection risk
```

### What the Sandbox Never Does
- Provides specific medical dosages or diagnosis
- Provides legal advice presented as definitive
- Requests personal identification
- Claims to be a government service
- Promises financial returns
- Generates content unrelated to the user's occupation/learning context

These are enforced by the per-persona system prompts in `sandbox_system_prompts`, reviewed monthly by Arnab against random sandbox interactions.

---

## Privacy Policy (Plain Language)

Available in-app in all 3 languages at launch. Key points:

**What we collect:** Language, what you've learned, district/state (for local content), which content types you like (interests), and your AI usage in the app.

**What we never collect:** Aadhaar, bank details, OTP, any password, your precise location.

**Location:** If you give permission, we only save your district and state — not your GPS coordinates. You can enter a pincode instead, or choose your state. You can change or remove this anytime.

**Interests:** Knowing you like recipes or cricket helps us show you more relevant content. We never use this for advertising. We don't share it with anyone. You can turn any interest category off at any time.

**Who sees your data:** Only the AI Horizon team. No advertisers. No third parties. No government agencies unless legally compelled under Indian law.

**Your rights:** Delete your account and all data in one tap. Processed within 72 hours.

**WhatsApp:** Opt-in only. Phone stored encrypted. Reply STOP to stop all messages immediately.

**India only:** All data on servers in India (Mumbai). We do not transfer data outside India.

---

## Data Deletion

User taps "Delete my data" in Profile → confirmation dialog (requires deliberate confirmation, not one tap) → confirmed:

```typescript
async function deleteUserData(userId: string) {
  // Delete all user-owned data
  await supabase.from('user_progress').delete().eq('user_id', userId)
  await supabase.from('prompt_cookbook').delete().eq('user_id', userId)
  await supabase.from('user_profiles').delete().eq('id', userId)

  // Remove from notification systems
  await supabase.auth.admin.deleteUser(userId)   // cascades to auth.users
  await removeWhatsAppSubscription(userId)

  // Compliance log (no PII — just a count and timestamp)
  await supabase.from('deletion_log').insert({
    deleted_at: new Date().toISOString(),
    reason: 'user_requested',
    // NO user_id, NO phone, NO name stored here
  })
}
```

Completion notification sent to user: "Aapka data 72 ghante mein poora delete ho jayega."

---

## Security Checklist (Before Every APK Release)

**Keys and secrets:**
- [ ] No API keys in `app/`, `components/`, `lib/`, `constants/` — grep check passes
- [ ] `supabase/.env` not committed to repository

**Location and data:**
- [ ] GPS coordinates are never stored — only district/state strings written to DB
- [ ] Pincode lookup works fully offline (no network call, no API)
- [ ] Interest preferences stored as string array only — no behavioural tracking

**Database security:**
- [ ] RLS verified for all tables (test with non-admin JWT token)
- [ ] Safety gate tested: insert safety-critical skin with `human_reviewed: false` → client query returns zero rows
- [ ] Phone numbers in DB confirmed as encrypted (not plain text — check via SQL)

**Sandbox safety:**
- [ ] Aadhaar pattern detection tested: enter fake Aadhaar format → app warns, does not call LLM
- [ ] OTP detection tested: type "OTP hai 123456" → blocked before LLM call
- [ ] Rate limits confirmed: sandbox (10/day), scam check (20/day)

**Compliance:**
- [ ] Privacy policy accessible in-app in all 3 languages
- [ ] Data deletion flow tested end-to-end: delete account → all rows gone in all tables
- [ ] Supabase region confirmed as ap-south-1 (Mumbai) — not changed

**APK:**
- [ ] No secrets in client bundle (verify with `npx expo export` and inspect bundle)
