/**
 * Adhyan Design System
 * Claymorphism meets warm editorial.
 * Every decision here runs through one test:
 * "Does this make Radha (63, Patna) feel capable and welcome?"
 */

// ─────────────────────────────────────────────
// COLOUR TOKENS
// ─────────────────────────────────────────────

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
  rule:         'rgba(80,60,30,0.10)',
  rule2:        'rgba(80,60,30,0.18)',

  // Pillar colours
  protect:      '#c8390a',   // Scam/safety — terracotta red
  protectLight: '#fdf0e4',
  understand:   '#3a7828',   // Knowledge — sage green
  understandLight: '#eaf5e4',
  use:          '#b87a10',   // Action — warm gold
  useLight:     '#fdf3dc',
  evaluate:     '#882252',   // Critical thinking — deep rose
  evaluateLight:'#fce8f2',

  // Persona accents
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

  // Functional
  success:      '#2e7d32',
  successLight: '#e8f5e9',
  warning:      '#e65100',
  warningLight: '#fff3e0',
  error:        '#c62828',
  errorLight:   '#ffebee',

  // WhatsApp
  whatsapp:     '#25D166',
} as const;

export type ColorKey = keyof typeof colors;

// ─────────────────────────────────────────────
// TYPOGRAPHY
// TiroDevanagariSanskrit — display/headlines
//   Commissioned by Harvard UP for Murty Classical Library.
//   Single weight (400) — size + spacing create hierarchy, not weight.
//   "Modern yet ancient." Sanskrit editorial authority on mobile.
// Hind   — body/UI (designed for Devanagari + Latin harmony)
// AnandaNepTouch2 — wordmark ("Adhyan" title) ONLY
//   Latin styled like Devanagari strokes. Local TTF asset.
//   ⚠️ Personal-use license only. Buy commercial before launch.
//   Falls back to TiroDevanagariSanskrit until TTF is bundled.
// ─────────────────────────────────────────────

export const fonts = {
  // Display — Tiro Devanagari Sanskrit (single 400 weight, use size for hierarchy)
  display:        'TiroDevanagariSanskrit_400Regular',
  displayItalic:  'TiroDevanagariSanskrit_400Regular_Italic',
  displayMedium:  'TiroDevanagariSanskrit_400Regular',  // same weight; size differs
  displayRegular: 'TiroDevanagariSanskrit_400Regular',
  // Wordmark — same as display (Tiro, OFL licensed, no commercial restriction)
  wordmark:       'TiroDevanagariSanskrit_400Regular',
  // Body / UI — Hind
  body:           'Hind_400Regular',
  bodyMedium:     'Hind_500Medium',
  bodySemiBold:   'Hind_600SemiBold',
  bodyBold:       'Hind_700Bold',
  // Scripts
  hindi:          'NotoSansDevanagari_400Regular',
  hindiSemiBold:  'NotoSansDevanagari_600SemiBold',
  bengali:        'NotoSansBengali_400Regular',
  bengaliSemiBold:'NotoSansBengali_600SemiBold',
  // Mono
  mono:           'DMMono_400Regular',
  monoMedium:     'DMMono_500Medium',
} as const;

export type FontKey = keyof typeof fonts;

export const typography = {
  xs:   { fontSize: 13, lineHeight: 20 },
  sm:   { fontSize: 15, lineHeight: 24 },
  base: { fontSize: 17, lineHeight: 29 },
  lg:   { fontSize: 20, lineHeight: 32 },
  xl:   { fontSize: 24, lineHeight: 34 },
  '2xl':{ fontSize: 30, lineHeight: 36 },
  '3xl':{ fontSize: 38, lineHeight: 42 },
} as const;

/**
 * Font size classes per persona
 * Radha (elderly, 60+) defaults to 'xl'
 */
export type FontSizeClass = 'sm' | 'md' | 'lg' | 'xl';

export const fontSizeClasses: Record<FontSizeClass, { body: number; headline: number }> = {
  sm:  { body: 15, headline: 24 },   // GenZ students
  md:  { body: 17, headline: 28 },   // Default
  lg:  { body: 20, headline: 32 },   // GenX default
  xl:  { body: 24, headline: 38 },   // Elderly 60+, low vision
};

// ─────────────────────────────────────────────
// CLAY SHADOW SYSTEM
// The warm, physical, touchable quality.
// ─────────────────────────────────────────────

export const shadows = {
  clay: {
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 4,
  },
  clayHover: {
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 8, height: 10 },
    shadowOpacity: 0.20,
    shadowRadius: 22,
    elevation: 6,
  },
  clayInset: {
    shadowColor: '#5a3c1e',
    shadowOffset: { width: -3, height: -3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 0,
  },
  clayButton: {
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  claySubtle: {
    shadowColor: '#5a3c1e',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
} as const;

// Base clay card style — extend this in component StyleSheets
export const clayCardBase = {
  backgroundColor: colors.paper,
  borderRadius: 20,
  borderWidth: 1.5,
  borderColor: 'rgba(255,255,255,0.85)',
  ...shadows.clay,
} as const;

// ─────────────────────────────────────────────
// SPACING
// ─────────────────────────────────────────────

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

// ─────────────────────────────────────────────
// BORDER RADIUS
// ─────────────────────────────────────────────

export const radius = {
  sm:   10,
  md:   14,
  lg:   20,
  xl:   24,
  full: 100,
} as const;

// ─────────────────────────────────────────────
// TOUCH TARGETS
// 56×56dp minimum. No exceptions.
// ─────────────────────────────────────────────

export const touchTargets = {
  minimum:    { width: 56, height: 56 },
  button:     { height: 56 },
  iconButton: { width: 56, height: 56 },
  listItem:   { minHeight: 64 },
  tab:        { height: 56 },
} as const;

// ─────────────────────────────────────────────
// PILLAR → COLOUR MAP (convenience helper)
// ─────────────────────────────────────────────

export type Pillar = 'protect' | 'understand' | 'use' | 'evaluate';

export const pillarColors: Record<Pillar, { main: string; light: string; text: string }> = {
  protect:    { main: colors.protect,    light: colors.protectLight,    text: '#7a1a00' },
  understand: { main: colors.understand, light: colors.understandLight, text: '#1a4a0e' },
  use:        { main: colors.use,        light: colors.useLight,        text: '#6a4400' },
  evaluate:   { main: colors.evaluate,   light: colors.evaluateLight,   text: '#5a0e36' },
};

// ─────────────────────────────────────────────
// PERSONA → COLOUR MAP
// ─────────────────────────────────────────────

export type PersonaKey =
  | 'elderly' | 'farmer' | 'student' | 'gig_worker'
  | 'clerk' | 'shop_owner' | 'homemaker' | 'domestic_worker'
  | 'professional' | 'generic';

export const personaColors: Record<PersonaKey, { main: string; light: string; fontSizeClass: FontSizeClass }> = {
  elderly:         { main: colors.elderly,   light: colors.elderlyLight,   fontSizeClass: 'xl' },
  farmer:          { main: colors.farmer,    light: colors.farmerLight,    fontSizeClass: 'lg' },
  student:         { main: colors.student,   light: colors.studentLight,   fontSizeClass: 'sm' },
  gig_worker:      { main: colors.gig,       light: colors.gigLight,       fontSizeClass: 'md' },
  clerk:           { main: colors.clerk,     light: colors.clerkLight,     fontSizeClass: 'md' },
  shop_owner:      { main: colors.shop,      light: colors.shopLight,      fontSizeClass: 'lg' },
  homemaker:       { main: colors.homemaker, light: colors.homemakerLight, fontSizeClass: 'md' },
  domestic_worker: { main: colors.domestic,  light: colors.domesticLight,  fontSizeClass: 'xl' },
  professional:    { main: colors.clerk,     light: colors.clerkLight,     fontSizeClass: 'md' },
  generic:         { main: colors.ink,       light: colors.parchment,      fontSizeClass: 'md' },
};
