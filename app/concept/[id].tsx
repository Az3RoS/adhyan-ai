/**
 * Concept Card — 5-day micro-lesson experience
 *
 * Day 1 — Hook/Story         day1_hook from skin
 * Day 2 — Explain            day2_reveal
 * Day 3 — Apply / Practice   day3_practice
 * Day 4 — Retrieval question day4_retrieval_q (free-text, evaluated via SM-2)
 * Day 5 — Review + Completion day5_check_prompt + completion_message
 *
 * Data priority: SQLite local_skins (synced) → hardcoded mock fallback
 * On Day 5 completion: SM-2 update → SQLite → background sync to Supabase
 */

import { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, ScrollView, Dimensions, Linking, Animated,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@/lib/UserContext';
import {
  getSkinForConcept, getLocalConcept,
  getConceptProgress, upsertProgress,
  type LocalSkin, type LocalConcept,
} from '@/lib/db';
import { syncProgressUp } from '@/lib/sync';
import { sm2Update, answerToQuality } from '@/lib/sm2';
import {
  colors, fonts, spacing, radius, shadows, type Pillar,
} from '@/constants/design';

const SCREEN_W = Dimensions.get('window').width;

// ── Day phase metadata ──────────────────────────────────────────────────────

type DayPhase = 'story' | 'explain' | 'apply' | 'retrieval' | 'review';

const PHASES: { label: string; phase: DayPhase; color: string }[] = [
  { label: 'Story',      phase: 'story',     color: colors.protect    },
  { label: 'Understand', phase: 'explain',   color: colors.understand },
  { label: 'Apply',      phase: 'apply',     color: colors.use        },
  { label: 'Quiz',       phase: 'retrieval', color: colors.evaluate   },
  { label: 'Review',     phase: 'review',    color: colors.ink        },
];

// ── Mock content fallback (shown when no SQLite skin available) ─────────────

interface MockDay {
  headline: string;
  body: string;
  pullQuote?: string;
  retrieval_q?: string;
  retrieval_ans?: string[];
  // MC fallback for Day 4 when no skin
  choices?: string[];
  correctIndex?: number;
}

const MOCK: Record<string, { title: string; number: number; pillar: Pillar; days: MockDay[] }> = {
  c01: {
    title: 'What AI Is', number: 1, pillar: 'understand',
    days: [
      {
        headline: 'The Student Who Read Everything',
        pullQuote: '"It has read every book ever written. But it has never felt rain."',
        body: 'Imagine a student who, since birth, has done nothing but read. Every newspaper. Every book. Every WhatsApp forward ever sent.\n\nThis student can answer almost any question. But they have never felt hunger. Never lost a job. Never worried about the harvest.\n\nThat is AI. Incredibly well-read. Completely without experience.',
      },
      {
        headline: 'How AI Actually Works',
        body: 'AI looks for patterns in enormous amounts of text. When you ask it a question, it finds the most likely answer based on everything it has read.\n\nIt does not think. It does not feel. It does not know what is true — it knows what was written.\n\nThis is why AI can be confidently wrong. It will give a wrong answer in the same calm, polite tone as a correct one.',
        pullQuote: 'AI is confident by design — not because it knows it is right.',
      },
      {
        headline: 'Your Situation, Your Judgment',
        body: 'AI can tell you the general mandi price for tomatoes. It cannot know that your specific lot is overripe and needs to sell today.\n\nAI can explain loan options. It cannot know your landlord\'s personality or your family\'s real situation.\n\nThis is the rule: AI gives you information. You make the decision. The local knowledge is yours.',
      },
      {
        headline: 'Quick Check',
        body: 'You asked AI about the best crop for this season. It gave a confident answer. What should you do next?',
        retrieval_q: 'You asked AI about the best crop for this season. It gave a confident answer. What should you do next?',
        retrieval_ans: ['verify with a local farmer', 'check with an agri officer', 'confirm from a trusted source', 'AI doesn\'t know my soil'],
        choices: [
          'Follow the advice immediately — AI knows best',
          'Check with a local farmer or agri officer who knows your soil',
          'Ignore AI completely — it is useless',
          'Ask AI the same question again to confirm',
        ],
        correctIndex: 1,
      },
      {
        headline: 'What You Now Know',
        pullQuote: '"AI is a powerful tool in your hands — not a replacement for your judgment."',
        body: 'You have completed Concept 1.\n\nAI is a pattern-matching system trained on text. It is incredibly useful for information, drafting, and checking. But it has no experience, no local knowledge, and no stake in your outcome.\n\nYou — with your experience, your community, and your specific situation — are the decision-maker. AI is the resource.',
      },
    ],
  },
};

// ── Build WA share text ─────────────────────────────────────────────────────

function buildWaText(title: string, completionMessage: string): string {
  return (
    `*Adhyan* — AI Literacy\n\n` +
    `I just completed "${title}"\n\n` +
    completionMessage +
    `\n\nhttps://adhyan.app`
  );
}

// ── Animated completion glow ────────────────────────────────────────────────

function CompletionGlow({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(0.7)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useState(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  });

  return (
    <Animated.View style={[glow.wrap, { opacity, transform: [{ scale }] }]}>
      <View style={[glow.circle, { backgroundColor: color + '20' }]}>
        <View style={[glow.inner, { backgroundColor: color + '30' }]}>
          <Text style={glow.tick}>✓</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const glow = StyleSheet.create({
  wrap: { alignItems: 'center', marginVertical: spacing[5] },
  circle: {
    width: 120, height: 120, borderRadius: 60,
    alignItems: 'center', justifyContent: 'center',
  },
  inner: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: 'center', justifyContent: 'center',
  },
  tick: { fontSize: 36, color: colors.understand, lineHeight: 44 },
});

// ── Day 4 — Free-text retrieval ─────────────────────────────────────────────

function RetrievalView({
  question, acceptableAnswers, onQuality,
}: {
  question: string;
  acceptableAnswers: string[];
  onQuality: (q: number) => void;
}) {
  const [text, setText]     = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [quality, setQuality] = useState<number | null>(null);

  function handleSubmit() {
    if (!text.trim() || submitted) return;
    const q = answerToQuality(text, acceptableAnswers);
    setQuality(q);
    setSubmitted(true);
    setTimeout(() => onQuality(q), 800);
  }

  const feedbackColor  = quality !== null && quality >= 3 ? colors.understand : colors.protect;
  const feedbackLabel  = quality !== null
    ? quality >= 4 ? 'Spot on.' : quality === 3 ? 'Close enough.' : 'Not quite — that is OK.'
    : '';

  return (
    <View style={retrieval.wrap}>
      <Text style={retrieval.question}>{question}</Text>
      <TextInput
        style={[retrieval.input, submitted && retrieval.inputDone]}
        multiline
        placeholder="Type your answer here…"
        placeholderTextColor={colors.muted}
        value={text}
        onChangeText={setText}
        editable={!submitted}
        textAlignVertical="top"
        returnKeyType="done"
        accessibilityLabel="Your answer"
      />
      {!submitted ? (
        <TouchableOpacity
          style={[retrieval.submitBtn, !text.trim() && retrieval.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={!text.trim()}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={retrieval.submitText}>Submit answer</Text>
        </TouchableOpacity>
      ) : (
        <View style={[retrieval.feedback, { backgroundColor: feedbackColor + '15' }]}>
          <Text style={[retrieval.feedbackLabel, { color: feedbackColor }]}>
            {feedbackLabel}
          </Text>
          {acceptableAnswers.length > 0 && (
            <Text style={retrieval.feedbackHint}>
              Sample answer: {acceptableAnswers[0]}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const retrieval = StyleSheet.create({
  wrap: { marginBottom: spacing[4] },
  question: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 26,
    marginBottom: spacing[3],
  },
  input: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
    padding: spacing[3],
    minHeight: 100,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: spacing[3],
    ...shadows.claySubtle,
  },
  inputDone: { borderColor: 'rgba(0,0,0,0.06)', backgroundColor: colors.bg },
  submitBtn: {
    height: 52,
    backgroundColor: colors.evaluate,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: { backgroundColor: colors.muted },
  submitText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
  },
  feedback: {
    padding: spacing[4],
    borderRadius: radius.md,
    gap: spacing[2],
  },
  feedbackLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
  },
  feedbackHint: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
  },
});

// ── Art header area ──────────────────────────────────────────────────────────

function ConceptArt({
  number, title, pillar, phaseLabel, phaseColor,
}: {
  number: number; title: string; pillar: string;
  phaseLabel: string; phaseColor: string;
}) {
  return (
    <View style={art.wrap}>
      <View style={art.arcLarge} />
      <View style={art.arcMid} />
      <Text style={art.ghostNum}>{number}</Text>
      <View style={art.content}>
        <View style={[art.phaseBadge, { backgroundColor: phaseColor + '30' as string }]}>
          <Text style={[art.phaseText, { color: phaseColor }]}>{phaseLabel}</Text>
        </View>
        <Text style={art.conceptTitle}>{title}</Text>
      </View>
    </View>
  );
}

const art = StyleSheet.create({
  wrap: {
    backgroundColor: colors.ink,
    height: 200,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing[5],
  },
  arcLarge: {
    position: 'absolute', top: -80, right: -80,
    width: 280, height: 280, borderRadius: 140,
    borderWidth: 50, borderColor: 'rgba(255,255,255,0.04)',
  },
  arcMid: {
    position: 'absolute', top: 20, right: 60,
    width: 140, height: 140, borderRadius: 70,
    borderWidth: 25, borderColor: 'rgba(255,255,255,0.03)',
  },
  ghostNum: {
    position: 'absolute', right: spacing[5], bottom: spacing[4],
    fontFamily: fonts.display, fontSize: 140,
    color: 'rgba(255,255,255,0.05)', lineHeight: 140,
  },
  content:   { position: 'relative', zIndex: 2 },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3, paddingHorizontal: spacing[3],
    borderRadius: radius.full, marginBottom: spacing[2],
  },
  phaseText: {
    fontFamily: fonts.bodySemiBold, fontSize: 9,
    letterSpacing: 1.5, textTransform: 'uppercase',
  },
  conceptTitle: {
    fontFamily: fonts.display, fontSize: 34,
    color: colors.white, lineHeight: 40,
  },
});

// ── Day progress dots ────────────────────────────────────────────────────────

function DayDots({
  current, onPress,
}: { current: number; onPress: (i: number) => void }) {
  return (
    <View style={dotsStyle.row}>
      {PHASES.map((p, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => i <= current && onPress(i)}
          style={[
            dotsStyle.dot,
            i < current && dotsStyle.dotDone,
            i === current && [dotsStyle.dotActive, { backgroundColor: p.color }],
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Day ${i + 1} — ${p.label}`}
        />
      ))}
    </View>
  );
}

const dotsStyle = StyleSheet.create({
  row: {
    flexDirection: 'row', justifyContent: 'center',
    gap: 8, paddingVertical: spacing[3],
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.rule2,
  },
  dotDone: { backgroundColor: colors.understand + '60' },
  dotActive: { width: 24 },
});

// ── Completion screen (Day 5 post-completion) ────────────────────────────────

function CompletionScreen({
  title, completionMessage, pillarColor,
  onShare, onClose,
}: {
  title: string;
  completionMessage: string;
  pillarColor: string;
  onShare: () => void;
  onClose: () => void;
}) {
  return (
    <ScrollView
      style={done.scroll}
      contentContainerStyle={done.content}
      showsVerticalScrollIndicator={false}
    >
      <CompletionGlow color={pillarColor} />
      <Text style={done.headline}>Concept complete.</Text>
      <Text style={done.message}>{completionMessage}</Text>
      <View style={done.sep} />
      <Text style={done.bridgeLabel}>SHARE WITH FAMILY</Text>
      <Text style={done.bridgeHint}>
        Tap below to send a summary to someone you want to teach this to.
      </Text>
      <TouchableOpacity
        style={[done.shareBtn, { backgroundColor: colors.whatsapp }]}
        onPress={onShare}
        activeOpacity={0.85}
        accessibilityRole="button"
      >
        <Text style={done.shareBtnText}>↗  Share on WhatsApp</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={done.closeBtn}
        onPress={onClose}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        <Text style={done.closeBtnText}>Back to feed →</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const done = StyleSheet.create({
  scroll:    { flex: 1, backgroundColor: colors.bg },
  content:   { paddingHorizontal: spacing[5], paddingBottom: spacing[10], alignItems: 'center' },
  headline: {
    fontFamily: fonts.display, fontSize: 32, color: colors.ink,
    marginBottom: spacing[3], textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft,
    lineHeight: 26, textAlign: 'center', marginBottom: spacing[5],
  },
  sep: {
    width: 40, height: 1, backgroundColor: colors.rule2,
    marginBottom: spacing[5],
  },
  bridgeLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    color: colors.muted, letterSpacing: 1.5,
    textTransform: 'uppercase', marginBottom: spacing[2],
  },
  bridgeHint: {
    fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft,
    lineHeight: 20, textAlign: 'center', marginBottom: spacing[4],
  },
  shareBtn: {
    height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: spacing[6],
    marginBottom: spacing[3],
    width: '100%',
  },
  shareBtnText: {
    fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.white,
  },
  closeBtn: {
    paddingVertical: spacing[3],
    alignItems: 'center',
  },
  closeBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.inkSoft,
  },
});

// ── Main screen ──────────────────────────────────────────────────────────────

export default function ConceptScreen() {
  const router  = useRouter();
  const { id }  = useLocalSearchParams<{ id: string }>();
  const { profile } = useUser();

  const conceptId = id ?? 'c01';
  const locale    = profile?.locale  ?? 'en';
  const persona   = profile?.persona ?? 'generic';

  // Try SQLite first; fall back to mock
  const skin = getSkinForConcept(conceptId, locale, persona);
  const localConcept = getLocalConcept(conceptId);
  const mockMeta  = MOCK[conceptId] ?? MOCK['c01'];

  // Resolve display values (skin > localConcept > mock)
  const title   = localConcept?.canonical_title ?? mockMeta.title;
  const number  = localConcept?.concept_number  ?? mockMeta.number;
  const pillar  = (localConcept?.pillar ?? mockMeta.pillar) as Pillar;
  const colorToken = localConcept?.color_token ?? 'understand';

  // Map pillar/color_token to a hex color
  function pillarToColor(token: string): string {
    switch (token) {
      case 'protect':   return colors.protect;
      case 'understand': return colors.understand;
      case 'use':       return colors.use;
      case 'evaluate':  return colors.evaluate;
      default:          return colors.understand;
    }
  }
  const pillarColor = pillarToColor(colorToken);

  // Resume from saved progress
  const savedProgress = getConceptProgress(conceptId);
  const startDay = Math.min(savedProgress?.current_day ?? 0, 4);

  const [dayIndex, setDayIndex]             = useState(startDay);
  const [retrievalQuality, setRetrievalQuality] = useState<number | null>(null);
  const [completed, setCompleted]           = useState(false);

  const phase = PHASES[dayIndex];

  // ── Build current day content ──
  function getDayContent() {
    if (skin) {
      const days = [
        { text: skin.day1_hook,       q: null,                ans: [] },
        { text: skin.day2_reveal,     q: null,                ans: [] },
        { text: skin.day3_practice,   q: null,                ans: [] },
        { text: skin.day4_retrieval_q, q: skin.day4_retrieval_q, ans: skin.day4_acceptable_ans },
        { text: skin.day5_check_prompt, q: null,              ans: [] },
      ];
      return days[dayIndex];
    }
    // Mock fallback
    const d = mockMeta.days[dayIndex];
    return {
      text: d.body ?? '',
      q: d.retrieval_q ?? null,
      ans: d.retrieval_ans ?? [],
      pullQuote: d.pullQuote,
      headline: d.headline,
      choices: d.choices,
      correctIndex: d.correctIndex,
    };
  }

  const dayContent = getDayContent();
  const isReviewDay = dayIndex === 4;

  // ── Progress + SM-2 write on final day ──
  function handleComplete(quality: number) {
    const existing = getConceptProgress(conceptId);
    const currentState = {
      ease_factor:   existing?.ease_factor   ?? 2.5,
      interval_days: existing?.interval_days ?? 1,
      repetitions:   existing?.repetitions   ?? 0,
    };
    const sm2 = sm2Update(currentState, quality);

    upsertProgress({
      concept_id:     conceptId,
      status:         'mastered',
      current_day:    5,
      mastered_at:    Date.now(),
      review_due_at:  sm2.next_review_at,
      ease_factor:    sm2.ease_factor,
      interval_days:  sm2.interval_days,
      repetitions:    sm2.repetitions,
      last_quality:   quality,
    });

    // Background sync — doesn't block UI
    if (profile?.supabase_user_id) {
      const updated = getConceptProgress(conceptId);
      if (updated) syncProgressUp(profile.supabase_user_id, updated).catch(console.warn);
    }

    setCompleted(true);
  }

  function handleDayAdvance() {
    if (dayIndex < 4) {
      // Save partial progress
      upsertProgress({ concept_id: conceptId, status: 'in_progress', current_day: dayIndex + 1 });
      setDayIndex(i => i + 1);
      setRetrievalQuality(null);
    } else {
      // Day 5 — complete with quality based on retrieval (or 4 if skipped)
      handleComplete(retrievalQuality ?? 4);
    }
  }

  const canAdvance =
    phase.phase !== 'retrieval' ||
    retrievalQuality !== null;

  // ── WhatsApp share ──
  function handleShare() {
    const completionMsg = skin?.completion_message ?? mockMeta.days[4]?.pullQuote ?? '';
    const text = buildWaText(title, completionMsg);
    const url  = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(`https://wa.me/?text=${encodeURIComponent(text)}`)
    );
  }

  // ── Completed state — show completion screen ──
  if (completed) {
    const completionMsg = skin?.completion_message ?? mockMeta.days[4]?.pullQuote ?? '';
    return (
      <SafeAreaView style={styles.safe}>
        <CompletionScreen
          title={title}
          completionMessage={completionMsg}
          pillarColor={pillarColor}
          onShare={handleShare}
          onClose={() => router.replace('/(tabs)')}
        />
      </SafeAreaView>
    );
  }

  // ── Normal day view ──
  return (
    <SafeAreaView style={styles.safe}>

      {/* Art */}
      <ConceptArt
        number={number}
        title={title}
        pillar={pillar}
        phaseLabel={phase.label}
        phaseColor={phase.color}
      />

      {/* Back button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Day dots */}
      <DayDots current={dayIndex} onPress={setDayIndex} />

      {/* Content */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.sheet}
          contentContainerStyle={styles.sheetContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Headline — prefer mock headline if no skin */}
          <Text style={styles.headline}>
            {(dayContent as { headline?: string }).headline ?? phase.label}
          </Text>

          {/* Pull quote */}
          {(dayContent as { pullQuote?: string }).pullQuote && (
            <View style={styles.pullWrap}>
              <Text style={styles.pullQuote}>
                {(dayContent as { pullQuote?: string }).pullQuote}
              </Text>
            </View>
          )}

          {/* Day 4 — retrieval question */}
          {phase.phase === 'retrieval' && dayContent.q ? (
            <RetrievalView
              question={dayContent.q}
              acceptableAnswers={dayContent.ans}
              onQuality={q => setRetrievalQuality(q)}
            />
          ) : (
            <Text style={styles.body}>{dayContent.text}</Text>
          )}
        </ScrollView>

        {/* CTA */}
        <View style={styles.cta}>
          <TouchableOpacity
            style={[
              styles.ctaBtn,
              { backgroundColor: canAdvance ? colors.ink : colors.muted },
            ]}
            onPress={handleDayAdvance}
            activeOpacity={0.85}
            disabled={!canAdvance}
            accessibilityRole="button"
          >
            <Text style={styles.ctaText}>
              {isReviewDay
                ? 'Complete concept  ✓'
                : `Day ${dayIndex + 2} — ${PHASES[dayIndex + 1]?.label ?? ''} →`}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg },
  backBtn: {
    position: 'absolute', top: 52, left: spacing[4],
    width: 44, height: 44, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: { fontSize: 20, color: colors.white, lineHeight: 24 },
  sheet:   { flex: 1, backgroundColor: colors.bg },
  sheetContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[6],
  },
  headline: {
    fontFamily: fonts.display, fontSize: 28,
    color: colors.ink, lineHeight: 34,
    marginBottom: spacing[4],
  },
  pullWrap: {
    borderLeftWidth: 3, borderLeftColor: colors.understand,
    paddingLeft: spacing[4], marginBottom: spacing[4],
  },
  pullQuote: {
    fontFamily: fonts.displayItalic, fontSize: 17,
    color: colors.ink, lineHeight: 26,
  },
  body: {
    fontFamily: fonts.body, fontSize: 15,
    color: colors.inkSoft, lineHeight: 26,
  },
  cta: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5], paddingTop: spacing[3],
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.rule2,
  },
  ctaBtn: {
    height: 56, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.clayButton,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold, fontSize: 16,
    color: colors.white, letterSpacing: 0.3,
  },
});
