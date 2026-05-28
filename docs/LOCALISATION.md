# LOCALISATION.md — Language and Localisation Guide

## The Fundamental Rule

**Translation is not localisation.**

Translating "AI hallucination" into Hindi as "AI मतिभ्रम" is translation. Explaining it as "जैसे कोई बहुत confidence से गलत बात बोले" (like someone saying something wrong with full confidence) is localisation.

Every piece of content must be localised — rewritten for cultural resonance, not translated word-for-word. Bhashini handles translation of UI strings and dynamic data. Humans handle the explanation skins.

---

## The Three Launch Languages

### English (en)

**Who it serves:** Urban professionals, students, Ananya (bank executive), Rohit (engineering student), Arjun in his English register, family bridge users (younger family members checking on elder learners).

**Register:** Clear, warm, conversational. Not corporate. Not academic. Like a trusted colleague explaining something over coffee.

**Rules:**
- Maximum sentence length: 18 words
- Never use passive voice when active works
- Use contractions (it's, don't, can't) — more approachable
- Indian English is acceptable and preferred: "Do the needful" is not; "Check with your doctor first" is fine
- No American slang; no UK idioms; pan-Indian educated English

**Banned words in content:** LLM, hallucination, inference, token, model (when referring to AI), parameter, embedding, neural network (technical usage), API, algorithm

---

### Hindi (hi)

**Who it serves:** Radha (elderly), Ramesh (farmer), Kabir (clerk), Priya (gig worker), Sunita (homemaker), Meena (domestic worker), Arjun in his Hindi register.

**Script:** Devanagari (Unicode). Never Roman transliteration in content. UI labels may use Roman where international symbols are standard (e.g., ✓, ₹).

**Register Spectrum:**
| Persona | Register | Example |
|---|---|---|
| Radha | Respectful, soft, Bihari-influenced | "Aapko maloom hoga..." |
| Ramesh | Rural Vidarbha, practical | "Yeh kaam aata hai..." |
| Kabir | Delhi urban, bilingual | "Yeh samajhna zaruri hai..." |
| Priya | Mumbai street Hindi | "Seedha baat karo..." |
| Meena | Bihar migrant Hindi, simple | "Is message mein..." |

**Rules:**
- Use "aap" (आप) for elderly, Gen X — never "tum" (तुम) or "tu" (तू)
- Use "tum" is acceptable for Arjun and Priya (peer-to-peer)
- Avoid Sanskrit-heavy "शुद्ध हिंदी" — use spoken Hindi
- Avoid over-Englishifying: "AI ne photo dekhi aur bataya" not "AI ne image process karke response generate kiya"
- Numbers: use Devanagari numerals (१, २, ३) in emotional/story content; Arabic numerals (1, 2, 3) in instructional/price content
- Currency: ₹ symbol with Arabic numerals always (₹500, not ₹ पांच सौ)

**Cultural localisation rules:**
- Festival references: Diwali, Holi, Eid, Dussehra are all valid and inclusive — do not assume Hindu-only audience
- Family structure: joint family is the norm in content examples, not nuclear
- Medical examples: reference government hospitals and AYUSH as peer to private healthcare — do not imply private care is always better
- Agricultural examples: use crops relevant to the region (see persona profiles for regional crops)
- Food examples: vegetarian default in health/recipe content; note non-vegetarian options as alternatives

**Hindi-specific jargon replacements:**
| Technical | Hindi localisation |
|---|---|
| AI | AI (use the letters, not translate) — explain as "ek padhi-likhi machine" |
| Hallucination | "Galat jawab jo sahi lagta hai" / "Confident galti" |
| Prompt | "Sawaal" or "baat" — context-dependent |
| Training data | "Jo AI ne padha aur seekha" |
| Knowledge cutoff | "Purani akhbar ki tarah — sach hai, par aaj ki nahi" |
| Verify | "Confirm karo" / "Doosri jagah se check karo" |
| Digital literacy | "Digital samajh" or just "yeh sab samajhna" |
| Scam | "Thaggi" or "dhoka" |

---

### Bengali (bn)

**Who it serves:** Dilip (shop owner), Ananya (bank executive), Rohit (engineering student).

**Script:** Bengali (Unicode). Never Roman transliteration in content.

**Register Spectrum:**
| Persona | Register | Example |
|---|---|---|
| Dilip | Kolkata trader Bengali, warm | "Bhai, eita ki kaaj korbe?" |
| Ananya | Educated Kolkata Bengali, professional | "Eta jante hobe..." |
| Rohit | Young hostel Bengali, bilingual | "Eta ki bujhle?" |

**Rules:**
- Use "apni" (আপনি) for Dilip (older, respect required) and Ananya (professional peer)
- Use "tumi" (তুমি) for Rohit (peer-to-peer)
- Kolkata Bengali has strong English-word integration — this is natural, not a mistake: "computer", "phone", "message" are acceptable Bengali words
- Do not over-purify Bengali with Sanskrit roots that would sound odd in conversation
- Durga Puja is the primary festival context for Dilip — it is a cultural cornerstone, not just religious

**Bengali-specific jargon replacements:**
| Technical | Bengali localisation |
|---|---|
| AI | AI (letters pronounced A-I) — explained as "ekaṭi śikṣita yantrapāṭī" |
| Hallucination | "Vul uttar je thik mone hoy" (wrong answer that seems right) |
| Scam | "Ṭhagbāji" or "prataranā" |
| Verify | "Niścit karo" / "ār ekbār dekho" |
| Training | "Je sab śikheche se theke" (from what it has learned) |

**Regional cultural notes:**
- Kolkata's barir manush (গৃহস্থালি) culture: warmth, community, food, and festivals are primary identity anchors
- Durga Puja (October): the most important commercial and social event — all content referencing festivals should treat Durga Puja as the primary Bengali festival
- Fish is a significant food/cultural reference — acceptable in Bengali content examples
- Political sensitivity: avoid references to specific political parties or movements in West Bengal

---

## Bhashini Integration Rules

### What Bhashini Handles (Machine — automatic)

1. **UI strings**: Navigation labels, button text, system messages, error messages
   - These are short, structured, low-context — machine translation is acceptable
   - Run through Bhashini NMT; cache the results; human spot-check monthly
   
2. **Dynamic data in templates**: Mandi prices, weather, dates, place names
   - Template: "Aaj {{district}} mein {{crop}} ka bhav ₹{{price}} hai"
   - Variables filled programmatically; surrounding text is human-authored in each language

3. **User voice input → text**: Bhashini ASR for all 3 languages
   - Called in sandbox voice input and cookbook voice search
   - Output fed to processing pipeline; never shown directly to user

4. **Text → speech for pre-rendered content**: Bhashini TTS
   - Called during content pipeline, not at runtime
   - Output cached; not re-generated unless content changes

### What Bhashini Does NOT Handle (Human — mandatory)

1. **Explanation skins**: Day 1–5 content for all concepts
2. **Analogies and stories**: All folklore, cinema, myth references
3. **Community stories**: Moderated and formatted by Arnab
4. **Sandbox system prompts**: Per-persona safety prompts
5. **Completion messages**: "Aapne aaj woh seekha..." — must feel personal
6. **Error messages that carry emotional weight**: Streak breaks, quota exceeded, etc.

### Bhashini API Usage

```typescript
// lib/bhashini.ts

// ASR: User speech → text
async function speechToText(audioBase64: string, locale: string): Promise<string>

// TTS: Text → speech (pre-rendering only)
async function textToSpeech(text: string, locale: string, voiceId: string): Promise<Buffer>

// NMT: Text translation (UI strings and dynamic data only)
async function translate(text: string, from: string, to: string): Promise<string>

// Pipeline: ASR + NMT in one call (for sandbox)
async function asrAndTranslate(audioBase64: string, locale: string, targetLocale: string): Promise<string>
```

---

## Content Quality Checklist

Before any skin is marked `status: 'review'`, the content author checks:

**Hindi skins:**
- [ ] Is this written in spoken Hindi, not textbook Hindi?
- [ ] Does it use "aap" appropriately for the persona's age/relationship?
- [ ] Are all numbers and currency in the correct format?
- [ ] Does the analogy use a reference this persona would actually know?
- [ ] Is every technical term replaced with a plain Hindi equivalent?
- [ ] Read aloud test: does it sound like a real person speaking?

**Bengali skins:**
- [ ] Is this written in Kolkata Bengali, not literary Bengali?
- [ ] Does it use "apni" or "tumi" correctly for the persona?
- [ ] Are English words that are naturalized in Bengali left in Bengali?
- [ ] Does the analogy use Kolkata/West Bengal cultural references where appropriate?
- [ ] Read aloud test: does it sound like a real Kolkata person speaking?

**All languages:**
- [ ] Zero technical jargon (see jargon dictionary in PERSONA.md)
- [ ] Maximum 18 words per sentence in explanatory content
- [ ] Audio-first: does this make sense when heard, not just read?
- [ ] Dignity test: would this make Meena feel capable, not helped?
- [ ] Safety test: does this concept card require human_reviewed=true?

---

## Localisation of UI Strings

Maintained in `constants/i18n.ts`. Structure:

```typescript
export const strings = {
  en: {
    nav: {
      home: 'Home',
      learn: 'Learn',
      cookbook: 'Cookbook',
      profile: 'Profile',
    },
    onboarding: {
      languageTitle: 'Choose your language',
      continueBtn: 'Continue',
      skipPersona: 'Skip for now',
    },
    campfire: {
      title: 'Morning Question',
      skip: 'Skip today',
    },
    streak: {
      days: (n: number) => `${n} day${n === 1 ? '' : 's'}`,
      welcome_back: 'Welcome back!',
      milestone_3: 'Three days! You\'re building a habit.',
      milestone_7: 'One week! You\'ve earned the Apprentice level.',
      milestone_30: 'Thirty days. You are now an Elder.',
    },
    errors: {
      offline: 'You\'re offline. Showing your saved content.',
      quota_exceeded: 'You\'ve used your 10 questions for today. Come back tomorrow.',
      content_unavailable: 'This content isn\'t available yet.',
    },
    // ... etc
  },
  hi: {
    nav: {
      home: 'घर',
      learn: 'सीखें',
      cookbook: 'कुकबुक',
      profile: 'प्रोफाइल',
    },
    onboarding: {
      languageTitle: 'अपनी भाषा चुनें',
      continueBtn: 'आगे बढ़ें',
      skipPersona: 'अभी छोड़ें',
    },
    campfire: {
      title: 'सुबह का सवाल',
      skip: 'आज छोड़ें',
    },
    streak: {
      days: (n: number) => `${n} दिन`,
      welcome_back: 'वापसी पर स्वागत है!',
      milestone_3: 'तीन दिन! आदत बन रही है।',
      milestone_7: 'एक हफ्ता! आप अब Apprentice हैं।',
      milestone_30: 'तीस दिन। आप अब Elder हैं।',
    },
    errors: {
      offline: 'इंटरनेट नहीं है। आपका पुराना कंटेंट दिख रहा है।',
      quota_exceeded: 'आज के 10 सवाल हो गए। कल फिर आइए।',
      content_unavailable: 'यह कंटेंट अभी आने वाला है।',
    },
  },
  bn: {
    nav: {
      home: 'হোম',
      learn: 'শিখুন',
      cookbook: 'কুকবুক',
      profile: 'প্রোফাইল',
    },
    onboarding: {
      languageTitle: 'আপনার ভাষা বেছে নিন',
      continueBtn: 'এগিয়ে যান',
      skipPersona: 'এখন বাদ দিন',
    },
    campfire: {
      title: 'সকালের প্রশ্ন',
      skip: 'আজ বাদ দিন',
    },
    streak: {
      days: (n: number) => `${n} দিন`,
      welcome_back: 'স্বাগতম ফিরে!',
      milestone_3: 'তিন দিন! অভ্যাস হচ্ছে।',
      milestone_7: 'এক সপ্তাহ! আপনি এখন Apprentice।',
      milestone_30: 'ত্রিশ দিন। আপনি এখন Elder।',
    },
    errors: {
      offline: 'ইন্টারনেট নেই। আপনার সংরক্ষিত বিষয় দেখাচ্ছে।',
      quota_exceeded: 'আজকের ১০টি প্রশ্ন শেষ। কাল আসুন।',
      content_unavailable: 'এই বিষয়টি শীঘ্রই আসছে।',
    },
  },
}
```

---

## Month 4+ Language Expansion Guide

When adding Tamil (ta) and Telugu (te):

1. **Do not start from existing Hindi skins.** Start from the English canonical node.
2. **Find a domain-appropriate Tamil/Telugu-speaking reviewer** — not a professional translator. A Tamil-speaking farmer or Telugu-speaking shop owner will produce better localisation than a literary translator.
3. **Use region-appropriate analogies.** The Djinn analogy does not resonate in Tamil Nadu as strongly — the village oracle (ஊர் வைத்தியர்) works better. The blind men and elephant (பாஞ்ச தந்திரம் origin) works well in both.
4. **Test with real users before publishing.** One elderly Tamil speaker completing the skin end-to-end is worth more than any review.
5. **Bhashini TTS quality check:** Tamil and Telugu Bhashini voices are good but not perfect. Listen to every audio clip before setting audio_url.
