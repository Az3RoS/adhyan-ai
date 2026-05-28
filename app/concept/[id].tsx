/**
 * Concept Card — 5-day micro-lesson experience
 * Each concept has 5 days: Story → Explain → Apply → Test → Review
 * Art area inspired by Sanskrit manuscript aesthetics.
 * Offline: reads from local_concepts SQLite table.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  colors, fonts, spacing, radius, shadows,
  pillarColors, type Pillar,
} from '@/constants/design';

const SCREEN_W = Dimensions.get('window').width;

// ── Types ──

type DayPhase = 'story' | 'explain' | 'apply' | 'test' | 'review';

interface DayContent {
  day: number;
  phase: DayPhase;
  phaseLabel: string;
  headline: string;
  body: string;
  pullQuote?: string;
  question?: string;
  choices?: string[];
  correctIndex?: number;
}

// ── Mock content for Concept 1 (replaced by Supabase in Phase 2) ──

const CONCEPT_META: Record<string, {
  title: string; number: number; pillar: Pillar; days: DayContent[]
}> = {
  c01: {
    title: 'What AI Is',
    number: 1,
    pillar: 'understand',
    days: [
      {
        day: 1, phase: 'story', phaseLabel: 'Story',
        headline: 'The Student Who Read Everything',
        pullQuote: '"It has read every book ever written. But it has never felt rain."',
        body: 'Imagine a student who, since birth, has done nothing but read. Every newspaper. Every book. Every WhatsApp forward ever sent.\n\nThis student can answer almost any question. But they have never felt hunger. Never lost a job. Never worried about the harvest.\n\nThat is AI. Incredibly well-read. Completely without experience.',
      },
      {
        day: 2, phase: 'explain', phaseLabel: 'Understand',
        headline: 'How AI Actually Works',
        body: 'AI looks for patterns in enormous amounts of text. When you ask it a question, it finds the most likely answer based on everything it has read.\n\nIt does not think. It does not feel. It does not know what is true — it knows what was written.\n\nThis is why AI can be confidently wrong. It will give you a wrong answer in the same calm, polite tone as a correct one.',
        pullQuote: 'AI is confident by design — not because it knows it is right.',
      },
      {
        day: 3, phase: 'apply', phaseLabel: 'Apply',
        headline: 'Your Situation, Your Judgment',
        body: 'AI can tell you the general mandi price for tomatoes. It cannot know that your specific lot is overripe and needs to sell today.\n\nAI can explain loan options. It cannot know your landlord\'s personality or your family\'s real situation.\n\nThis is the rule: AI gives you information. You make the decision. The local knowledge is yours.',
      },
      {
        day: 4, phase: 'test', phaseLabel: 'Quiz',
        headline: 'Quick check',
        body: 'You asked an AI about the best crop for this season. It gave a confident answer. What should you do next?',
        question: 'You asked an AI about the best crop for this season. It gave a confident answer. What should you do next?',
        choices: [
          'Follow the advice immediately — AI knows best',
          'Check with a local farmer or agri officer who knows your soil',
          'Ignore AI completely — it is useless',
          'Ask AI the same question again to confirm',
        ],
        correctIndex: 1,
      },
      {
        day: 5, phase: 'review', phaseLabel: 'Review',
        headline: 'What You Now Know',
        pullQuote: '"AI is a powerful tool in your hands — not a replacement for your judgment."',
        body: 'You have completed Concept 1.\n\nAI is a pattern-matching system trained on text. It is incredibly useful for information, drafting, and checking. But it has no experience, no local knowledge, and no stake in your outcome.\n\nYou — with your experience, your community, and your specific situation — are the decision-maker. AI is the resource.',
      },
    ],
  },
};

// ── Day phase badge ──

const PHASE_COLORS: Record<DayPhase, string> = {
  story:   colors.protect,
  explain: colors.understand,
  apply:   colors.use,
  test:    colors.evaluate,
  review:  colors.ink,
};

// ── Quiz component ──

function QuizView({
  day, onAnswer,
}: { day: DayContent; onAnswer: (correct: boolean) => void }) {
  const [selected, setSelected] = useState<number | null>(null);

  function handleSelect(i: number) {
    if (selected !== null) return;
    setSelected(i);
    setTimeout(() => onAnswer(i === day.correctIndex), 1000);
  }

  return (
    <View style={quiz.wrap}>
      <Text style={quiz.question}>{day.question}</Text>
      {day.choices?.map((choice, i) => {
        const isSelected = selected === i;
        const isCorrect  = i === day.correctIndex;
        let bg = colors.paper;
        if (isSelected && isCorrect)  bg = 'rgba(58,120,40,0.15)';
        if (isSelected && !isCorrect) bg = 'rgba(200,57,10,0.12)';

        return (
          <TouchableOpacity
            key={i}
            style={[quiz.choice, { backgroundColor: bg }, isSelected && quiz.choiceSelected]}
            onPress={() => handleSelect(i)}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <View style={quiz.choiceNum}>
              <Text style={quiz.choiceNumText}>{String.fromCharCode(65 + i)}</Text>
            </View>
            <Text style={quiz.choiceText}>{choice}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const quiz = StyleSheet.create({
  wrap: { marginBottom: spacing[4] },
  question: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 24,
    marginBottom: spacing[4],
  },
  choice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[3],
    marginBottom: spacing[2],
    ...shadows.claySubtle,
  },
  choiceSelected: {
    borderColor: 'rgba(0,0,0,0.15)',
  },
  choiceNum: {
    width: 28, height: 28,
    borderRadius: 8,
    backgroundColor: colors.rule2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  choiceNumText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  choiceText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    lineHeight: 21,
  },
});

// ── Art header area ──

function ConceptArt({
  number, title, pillar, phaseLabel, phase,
}: {
  number: number; title: string; pillar: Pillar;
  phaseLabel: string; phase: DayPhase;
}) {
  const phaseColor = PHASE_COLORS[phase];
  return (
    <View style={art.wrap}>
      {/* Decorative arcs */}
      <View style={art.arcLarge} />
      <View style={art.arcMid} />

      {/* Ghost numeral */}
      <Text style={art.ghostNum}>{number}</Text>

      {/* Content */}
      <View style={art.content}>
        <View style={[art.phaseBadge, { backgroundColor: `${phaseColor}30` }]}>
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
    height: 220,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: spacing[5],
  },
  arcLarge: {
    position: 'absolute',
    top: -80, right: -80,
    width: 280, height: 280,
    borderRadius: 140,
    borderWidth: 50,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  arcMid: {
    position: 'absolute',
    top: 20, right: 60,
    width: 140, height: 140,
    borderRadius: 70,
    borderWidth: 25,
    borderColor: 'rgba(255,255,255,0.03)',
  },
  ghostNum: {
    position: 'absolute',
    right: spacing[5],
    bottom: spacing[4],
    fontFamily: fonts.display,
    fontSize: 140,
    color: 'rgba(255,255,255,0.05)',
    lineHeight: 140,
  },
  content: { position: 'relative', zIndex: 2 },
  phaseBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    marginBottom: spacing[2],
  },
  phaseText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  conceptTitle: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.white,
    lineHeight: 42,
  },
});

// ── Day navigation dots ──

function DayDots({
  total, current, onPress,
}: { total: number; current: number; onPress: (i: number) => void }) {
  return (
    <View style={dots.row}>
      {Array.from({ length: total }).map((_, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => i <= current && onPress(i)}
          style={[dots.dot, i <= current && dots.dotDone, i === current && dots.dotActive]}
          accessibilityRole="button"
          accessibilityLabel={`Day ${i + 1}`}
        />
      ))}
    </View>
  );
}

const dots = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing[3],
  },
  dot: {
    width: 8, height: 8,
    borderRadius: 4,
    backgroundColor: colors.rule2,
  },
  dotDone: {
    backgroundColor: `${colors.understand}60`,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.understand,
  },
});

// ── Main screen ──

export default function ConceptScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const meta = CONCEPT_META[id ?? 'c01'];

  const [dayIndex, setDayIndex] = useState(0);
  const [quizAnswered, setQuizAnswered] = useState(false);

  if (!meta) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Concept not found.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const day = meta.days[dayIndex];
  const isLast = dayIndex === meta.days.length - 1;

  function handleNext() {
    if (isLast) {
      router.back();
    } else {
      setDayIndex(i => i + 1);
      setQuizAnswered(false);
    }
  }

  const canProceed = day.phase !== 'test' || quizAnswered;

  return (
    <SafeAreaView style={styles.safe}>

      {/* Art area */}
      <ConceptArt
        number={meta.number}
        title={meta.title}
        pillar={meta.pillar}
        phaseLabel={day.phaseLabel}
        phase={day.phase}
      />

      {/* Back button overlaid on art */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Day dots */}
      <DayDots total={meta.days.length} current={dayIndex} onPress={setDayIndex} />

      {/* Content sheet */}
      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.headline}>{day.headline}</Text>

        {day.pullQuote && (
          <View style={styles.pullQuoteWrap}>
            <Text style={styles.pullQuote}>{day.pullQuote}</Text>
          </View>
        )}

        {day.phase === 'test' ? (
          <QuizView day={day} onAnswer={correct => setQuizAnswered(true)} />
        ) : (
          <Text style={styles.body}>{day.body}</Text>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={styles.cta}>
        <TouchableOpacity
          style={[styles.ctaBtn, !canProceed && styles.ctaBtnDisabled]}
          onPress={handleNext}
          activeOpacity={0.85}
          disabled={!canProceed}
          accessibilityRole="button"
        >
          <Text style={styles.ctaText}>
            {isLast ? 'Complete concept ✓' : `Day ${dayIndex + 2} →`}
          </Text>
        </TouchableOpacity>
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:  { flex: 1, backgroundColor: colors.bg },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: spacing[4],
    width: 40, height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  backIcon: {
    fontSize: 20,
    color: colors.white,
    lineHeight: 24,
  },
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  sheetContent: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[3],
    paddingBottom: spacing[5],
  },
  headline: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 34,
    marginBottom: spacing[4],
  },
  pullQuoteWrap: {
    borderLeftWidth: 3,
    borderLeftColor: colors.understand,
    paddingLeft: spacing[4],
    marginBottom: spacing[4],
  },
  pullQuote: {
    fontFamily: fonts.displayMedium,
    fontSize: 17,
    color: colors.ink,
    lineHeight: 26,
    fontStyle: 'italic',
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 26,
  },
  cta: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5],
    paddingTop: spacing[3],
    backgroundColor: colors.bg,
    borderTopWidth: 1,
    borderTopColor: colors.rule2,
  },
  ctaBtn: {
    height: 56,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.clayButton,
  },
  ctaBtnDisabled: {
    backgroundColor: colors.muted,
    ...shadows.claySubtle,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[3] },
  notFoundText: { fontFamily: fonts.body, fontSize: 16, color: colors.inkSoft },
  back: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.protect },
});
