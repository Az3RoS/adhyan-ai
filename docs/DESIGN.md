# DESIGN.md — Design System

## Design Philosophy

**Claymorphism meets warm editorial.** The platform should feel like a handcrafted notebook that also happens to be digital — warm, physical, trustworthy. Not cold SaaS. Not flat minimalism. Not dark glassmorphism.

The single design question before every decision: **Does this make Radha (63, Patna) feel capable and welcome?**

---

## Colour System

### Palette Tokens

```typescript
// constants/design.ts
export const colors = {
  // Base surfaces
  bg:           '#f6f1e8',   // Warm cream background
  paper:        '#fdfaf4',   // Card surface
  parchment:    '#ede4d0',   // Secondary surface
  white:        '#fffef8',   // Pure white (warm tint)

  // Ink
  ink:          '#1c1308',   // Primary text
  inkSoft:      '#4a3820',   // Secondary text
  muted:        '#9a8060',   // Placeholder, captions
  rule:         'rgba(80,60,30,0.10)',   // Dividers
  rule2:        'rgba(80,60,30,0.18)',   // Stronger dividers

  // Semantic — Pillar colours
  protect:      '#c8390a',   // Scam/safety (terracotta red)
  protectLight: '#fdf0e4',
  understand:   '#3a7828',   // Knowledge (sage green)
  understandLight: '#eaf5e4',
  use:          '#b87a10',   // Action (warm gold)
  useLight:     '#fdf3dc',
  evaluate:     '#882252',   // Critical thinking (deep rose)
  evaluateLight:'#fce8f2',

  // Persona accent colours
  elderly:      '#7c4f2a',
  elderlyLight: '#fdf0e4',
  farmer:       '#3d6b22',
  farmerLight:  '#eef6e6',
  student:      '#0b6b88',
  studentLight: '#e0f4fc',
  gig:          '#1a5090',
  gigLight:     '#e4f0fc',
  clerk:        '#4a3490',
  clerkLight:   '#ece8fc',
  shop:         '#882252',
  shopLight:    '#fce8f2',
  homemaker:    '#8a4870',
  homemakerLight:'#f8eaf4',
  domestic:     '#705030',
  domesticLight:'#f5ece0',

  // Generation colours
  genZ:         '#0e6888',
  genZLight:    '#e0f4fc',
  millennial:   '#5a3890',
  millennialLight: '#eee8fc',
  genX:         '#3a6820',
  genXLight:    '#e8f4e0',
  boomer:       '#8a4020',
  boomerLight:  '#fde8dc',

  // Functional
  success:      '#2e7d32',
  successLight: '#e8f5e9',
  warning:      '#e65100',
  warningLight: '#fff3e0',
  error:        '#c62828',
  errorLight:   '#ffebee',

  // WhatsApp green
  whatsapp:     '#25D166',
} as const;
```

### Usage Rules
- **Never** use `bg` (#f6f1e8) on top of `bg` — use `paper` for card surfaces on the background
- **Never** use pure black (#000000) — always `ink` (#1c1308)
- **Never** use blue as a primary action colour — this is not a tech product
- Scam/safety content always uses `protect` (terracotta). Never green. Never neutral.
- Completion states use `understand` (sage green). Never confetti colours.

---

## Typography

### Font Stack

```typescript
export const fonts = {
  display:  'Cormorant Garamond',    // Serif, editorial weight — headlines
  body:     'Plus Jakarta Sans',      // Clean sans-serif — UI text
  hindi:    'Noto Sans Devanagari',   // Hindi content text
  bengali:  'Noto Sans Bengali',      // Bengali content text
  mono:     'DM Mono',                // Code, prompt cookbook
} as const;
```

### Type Scale

```typescript
export const typography = {
  // Elderly-first scale (large defaults, user-adjustable)
  xs:   { size: 13, lineHeight: 1.5 },
  sm:   { size: 15, lineHeight: 1.6 },
  base: { size: 17, lineHeight: 1.7 },   // Body text — 17sp minimum
  lg:   { size: 20, lineHeight: 1.6 },
  xl:   { size: 24, lineHeight: 1.4 },
  '2xl':{ size: 30, lineHeight: 1.2 },
  '3xl':{ size: 38, lineHeight: 1.1 },
} as const;
```

### Text Style Presets

```typescript
// In practice: use these presets, not raw size values
export const textStyles = {
  heading1:   { fontFamily: fonts.display, size: 38, weight: '700', letterSpacing: -0.02 },
  heading2:   { fontFamily: fonts.display, size: 30, weight: '700' },
  heading3:   { fontFamily: fonts.display, size: 24, weight: '600' },
  cardTitle:  { fontFamily: fonts.display, size: 20, weight: '700', lineHeight: 1.25 },
  quote:      { fontFamily: fonts.display, size: 18, weight: '400', fontStyle: 'italic' },
  bodyLarge:  { fontFamily: fonts.body,    size: 18, weight: '400', lineHeight: 1.7 },
  body:       { fontFamily: fonts.body,    size: 17, weight: '400', lineHeight: 1.7 },
  bodySmall:  { fontFamily: fonts.body,    size: 15, weight: '400', lineHeight: 1.6 },
  label:      { fontFamily: fonts.body,    size: 13, weight: '600', letterSpacing: 0.1, textTransform: 'uppercase' },
  caption:    { fontFamily: fonts.body,    size: 12, weight: '400' },
  prompt:     { fontFamily: fonts.mono,    size: 14, weight: '400', lineHeight: 1.6 },
} as const;
```

### Font Size Accessibility Classes
Set by the app based on persona, overrideable by user in settings:

| Class | Body size | Headline size | Who it's for |
|---|---|---|---|
| `sm` | 15sp | 24sp | Youth (GenZ) |
| `md` | 17sp | 28sp | Default (everyone) |
| `lg` | 20sp | 32sp | GenX+ default |
| `xl` | 24sp | 38sp | Elderly 60+, low vision |

---

## Claymorphism System

All cards and interactive elements use the clay shadow system. This gives the UI its warm, physical, touchable quality.

### Shadow Tokens

```typescript
export const shadows = {
  clay: {
    // Standard clay card — elevation 2
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
    // Note: clay also needs a light highlight on top-left
    // Achieved via border: '1.5px solid rgba(255,255,255,0.85)'
  },
  clayHover: {
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 6,
  },
  clayInset: {
    // Pressed state
    shadowColor: '#5a3c1e',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 0,
  },
  clayButton: {
    // Smaller, for buttons
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  claySubtle: {
    // Minimal, for list items
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
} as const;
```

### Clay Card Base Style

```typescript
export const clayCard = {
  backgroundColor: colors.paper,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.85)',
  ...shadows.clay,
} as const;
```

---

## Spacing System

```typescript
export const spacing = {
  1:  4,
  2:  8,
  3:  12,
  4:  16,
  5:  20,
  6:  24,
  8:  32,
  10: 40,
  12: 48,
  16: 64,
} as const;
```

---

## Border Radius

```typescript
export const radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   24,
  full: 100,  // Pill shapes
} as const;
```

---

## Touch Target Sizes

**Minimum 56×56dp for all interactive elements.** No exceptions.

```typescript
export const touchTargets = {
  minimum:    { width: 56, height: 56 },   // Absolute minimum
  button:     { height: 56 },               // Full-width buttons
  iconButton: { width: 56, height: 56 },   // Icon-only buttons
  listItem:   { minHeight: 64 },            // List rows
  tab:        { height: 56 },               // Bottom nav tabs
} as const;
```

---

## Component Library

### `ClayCard`
```typescript
// Usage: wrapper for all content cards
interface ClayCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'inset';
  accentColor?: string;   // Top border stripe colour (pillar colour)
  onPress?: () => void;
}
// Renders: clay shadow + white border + optional top stripe + inner padding
```

### `ClayButton`
```typescript
interface ClayButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?: string;         // Background colour for primary
  icon?: string;          // Emoji icon
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  loading?: boolean;
  disabled?: boolean;
}
// Minimum height: 56dp. Never smaller.
```

### `AudioPlayer`
```typescript
interface AudioPlayerProps {
  audioUrl: string;
  locale: string;
  duration: number;      // seconds
  color?: string;        // Wave visualiser colour
  autoPlay?: boolean;
}
// Features: play/pause, wave visualiser (5 animated bars), progress indicator
// Large tap target (full row, 64dp tall)
```

### `ConceptCard`
```typescript
interface ConceptCardProps {
  conceptId: string;
  day: 1 | 2 | 3 | 4 | 5;
  locale: string;
  persona: string;
  onComplete: () => void;
  onSavePrompt?: (prompt: string) => void;
}
// The main learning screen. Renders:
// - Card art area (SVG illustration + floating emoji)
// - Audio player
// - Day-specific content (hook/reveal/practice/retrieval/check)
// - Progress dots (1-5)
// - Completion moment
```

### `DailyFeedCard`
```typescript
interface DailyFeedCardProps {
  card: DailyCard;   // { type, headline, body, cta, source, emoji, color }
  onShare?: () => void;   // WhatsApp share
  onReadMore?: () => void;
}
// Types: 'community' | 'alert' | 'market' | 'weather' | 'lesson' | 'tool' | 'tip'
// Each type has its own colour theme and art style
```

### `CampfireCard`
```typescript
interface CampfireCardProps {
  question: string;
  locale: string;
  onAnswer: (answer: string) => void;
  onSkip: () => void;
}
// The morning spaced review. Warm ember aesthetic.
// Voice answer primary. Text fallback.
```

### `StreakDisplay`
```typescript
interface StreakDisplayProps {
  days: number;
  milestoneNext: number;   // days until next milestone
}
// Shows: fire emoji + day count + progress to next milestone
// Never shows "streak broken" — always "welcome back" framing
```

### `LanguagePicker`
```typescript
interface LanguagePickerProps {
  onSelect: (locale: string) => void;
  current?: string;
}
// Renders 3 large buttons: English, हिंदी, বাংলা
// Language name in the language itself
// Minimum 80dp tall per button
// This is Screen 1. No account required.
```

---

## Screen-Level Design Rules

### All Screens
- Safe area padding: respect device notch and home indicator
- Scroll: avoid horizontal scroll on main content
- Background: always `colors.bg` (#f6f1e8)
- Never show a blank white screen during loading — use skeleton placeholders

### Onboarding Screens
- One thing per screen. One question. One action.
- No "skip all" on language selection — this is mandatory
- Progress indicator visible (dots)
- Large, single-tap actions only

### Concept Card Screen
- Full screen artwork in top 50%
- Content in bottom 50% with light background
- Audio player always visible (sticky)
- Day progress dots at bottom of art area
- Completion moment: warm colour pulse, 2-second hold, single message

### Daily Feed Screen
- Cards are swipeable (left/right navigation)
- Progress dots at top show position in daily stack
- WhatsApp share button on every card — bottom right, always visible
- Auto-advance after 6 seconds (optional, user can disable)
- "I'm lost" button: always visible, bottom left corner, compass icon

### Cookbook Screen
- Recipe book visual metaphor — worn edges, parchment texture
- Entries in handwriting-adjacent font
- Search at top (text + voice)
- Export button prominent (PDF or share to WhatsApp)

### Profile Screen
- Streak prominently displayed (fire emoji + day count)
- Journey map (Horizon map thumbnail)
- AI Age indicator (which level: Curious Child → Keeper of Fire)
- Family bridge section
- No statistics that could feel shaming (no "you missed X days")

---

## Animation Guidelines

### Principles
- Animations serve clarity, not decoration
- Maximum 400ms for transitions
- Use `react-native-reanimated` for all animations
- Respect `Reduce Motion` accessibility setting

### Key Animations

```typescript
// Card entrance (concept card loads)
const cardEntrance = {
  from: { opacity: 0, translateY: 20, scale: 0.96 },
  to:   { opacity: 1, translateY: 0,  scale: 1.0 },
  duration: 380,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

// Completion pulse
const completionPulse = {
  sequence: [
    { backgroundColor: '#eaf5e4', duration: 200 },  // flash sage green
    { backgroundColor: '#eaf5e4', duration: 800 },  // hold
    { backgroundColor: colors.bg,  duration: 400 },  // fade back
  ]
};

// Audio wave bars
const waveBar = {
  scaleY: { from: 0.4, to: 1.0 },
  duration: 600,
  repeat: Infinity,
  easing: 'ease-in-out',
  // Each bar has a different delay: 0ms, 100ms, 200ms, 300ms, 400ms
};

// Floating emoji (card art)
const floatEmoji = {
  translateY: { from: 0, to: -10 },
  rotate: { from: '-1deg', to: '1deg' },
  duration: 3000,
  repeat: Infinity,
  easing: 'ease-in-out',
  direction: 'alternate',
};

// Streak fire pulse
const firePulse = {
  scale: { from: 1.0, to: 1.08 },
  duration: 1500,
  repeat: Infinity,
  easing: 'ease-in-out',
  direction: 'alternate',
};
```

### What NOT to Animate
- Do not animate list items on scroll (performance on low-end devices)
- Do not use spring animations for page transitions (too bouncy for elderly)
- Do not animate error states (they need immediate clarity)
- Disable all animations if `AccessibilityInfo.isReduceMotionEnabled()`

---

## Icon System

Use emoji as primary icons throughout (no icon library dependency, renders in all languages, universally understood).

### Concept Icons
| Concept | Emoji |
|---|---|
| AI is a pattern matcher | 🔍 |
| Knowledge horizon | 📅 |
| No memory | 🪣 |
| Djinn principle | 🧞 |
| Give context | 📍 |
| Iterate | 🔄 |
| Hallucination | 🌀 |
| Verify | ✅ |
| Bias | 🎭 |
| Scam literacy | 🚨 |
| Privacy | 🔐 |
| You are in control | 👑 |

### Navigation Icons
| Tab | Icon |
|---|---|
| Home / Feed | 🏠 |
| Learn | 💡 |
| Cookbook | 📖 |
| Profile | 👤 |

### Action Icons
| Action | Icon |
|---|---|
| Audio play | 🔊 |
| Share WhatsApp | WhatsApp SVG (official green) |
| Voice input | 🎙️ |
| I'm lost | 🧭 |
| Bookmark | 🔖 |
| Scam alert | 🚨 |
| Family bridge | 👨‍👩‍👧 |

---

## Accessibility Requirements

| Requirement | Implementation |
|---|---|
| Minimum tap target | 56×56dp, enforced via `ClayButton` and `TouchableOpacity` wrapper |
| Font scaling | Respect system font size; use `sp` not `px` |
| Screen reader | All interactive elements have `accessibilityLabel` |
| Reduce motion | Check `AccessibilityInfo.isReduceMotionEnabled()` at app launch |
| Contrast ratio | All text meets WCAG AA (4.5:1 minimum) |
| Voice input | `🎙️` button on all text inputs |
| Language of UI | UI language matches selected locale automatically |
| Error messages | Always in user's selected language, never English fallback |

---

## Dark Mode

Dark mode is available but **not the default**. Elderly users and low-literacy users perform better with the warm light theme.

Default: **Light (warm cream)**
Available: Dark mode (toggleable in profile settings)
Never: Force dark mode, or make dark mode the system-following default

Dark mode palette (when implemented):
- bg → `#1a1208`
- paper → `#241a10`
- ink → `#f0e8d8`
- Retain all semantic colours (protect, understand, etc.) but increase their lightness by 20%
