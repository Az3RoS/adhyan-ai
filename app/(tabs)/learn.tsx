/**
 * Learn — Concept Journey
 * 10 concepts across 4 pillars. Progress rings. Locked/unlocked states.
 * Offline: shows local progress. Online: syncs with Supabase.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale, useUser } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  pillarColors, type Pillar,
} from '@/constants/design';

// ── Types ──

interface ConceptMeta {
  id: string;
  number: number;
  title: string;
  titleHi: string;
  pillar: Pillar;
  daysTotal: number;
  locked: boolean;
}

// ── Concept catalogue (content in Supabase Phase 2 — hardcoded for Phase 0) ──

const CONCEPTS: ConceptMeta[] = [
  { id: 'c01', number: 1,  title: 'What AI Is',          titleHi: 'AI क्या है',          pillar: 'understand', daysTotal: 5, locked: false },
  { id: 'c02', number: 2,  title: 'AI Is Not Magic',     titleHi: 'AI जादू नहीं है',      pillar: 'understand', daysTotal: 5, locked: false },
  { id: 'c03', number: 3,  title: 'Pattern Matching',    titleHi: 'पैटर्न मैचिंग',       pillar: 'understand', daysTotal: 5, locked: true  },
  { id: 'c04', number: 4,  title: 'AI Makes Mistakes',   titleHi: 'AI गलतियाँ करता है',  pillar: 'evaluate',   daysTotal: 5, locked: true  },
  { id: 'c05', number: 5,  title: 'Voice & Image Fakes', titleHi: 'नकली आवाज़ और फोटो',  pillar: 'protect',    daysTotal: 5, locked: true  },
  { id: 'c06', number: 6,  title: 'Job Scam Signs',      titleHi: 'नौकरी घोटाले',        pillar: 'protect',    daysTotal: 5, locked: true  },
  { id: 'c07', number: 7,  title: 'Asking Better',       titleHi: 'बेहतर सवाल पूछना',   pillar: 'use',        daysTotal: 5, locked: true  },
  { id: 'c08', number: 8,  title: 'AI for Your Work',    titleHi: 'आपके काम के लिए AI',  pillar: 'use',        daysTotal: 5, locked: true  },
  { id: 'c09', number: 9,  title: 'Checking AI Output',  titleHi: 'AI जवाब जाँचना',     pillar: 'evaluate',   daysTotal: 5, locked: true  },
  { id: 'c10', number: 10, title: 'Scam Literacy',       titleHi: 'घोटाला साक्षरता',    pillar: 'protect',    daysTotal: 5, locked: true  },
];

const PILLAR_LABELS: Record<Pillar, string> = {
  protect:    'Protect',
  understand: 'Understand',
  use:        'Use',
  evaluate:   'Evaluate',
};

// ── Pillar filter chips ──

const ALL_PILLARS: Pillar[] = ['protect', 'understand', 'use', 'evaluate'];

function PillarChip({
  pillar, active, onPress,
}: { pillar: Pillar; active: boolean; onPress: () => void }) {
  const pc = pillarColors[pillar];
  return (
    <TouchableOpacity
      style={[
        chip.base,
        active
          ? { backgroundColor: pc.main, borderColor: pc.main }
          : { backgroundColor: colors.paper, borderColor: colors.rule2 },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text style={[chip.label, active ? { color: '#fff' } : { color: colors.inkSoft }]}>
        {PILLAR_LABELS[pillar]}
      </Text>
    </TouchableOpacity>
  );
}

const chip = StyleSheet.create({
  base: {
    paddingVertical: 6,
    paddingHorizontal: spacing[3] + 2,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  label: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0.3,
  },
});

// ── Concept card ──

function ConceptCard({ meta, daysDone }: { meta: ConceptMeta; daysDone: number }) {
  const router = useRouter();
  const pc = pillarColors[meta.pillar];
  const pct = meta.daysTotal > 0 ? daysDone / meta.daysTotal : 0;

  return (
    <TouchableOpacity
      style={[card.wrap, meta.locked && card.locked]}
      activeOpacity={meta.locked ? 1 : 0.8}
      onPress={() => !meta.locked && router.push(`/concept/${meta.id}`)}
      accessibilityRole="button"
      accessibilityState={{ disabled: meta.locked }}
    >
      {/* Left: number + pillar accent */}
      <View style={[card.numWrap, { backgroundColor: pc.light }]}>
        <Text style={[card.num, { color: pc.main }]}>{meta.number}</Text>
      </View>

      {/* Middle: title + progress bar */}
      <View style={card.mid}>
        <View style={card.titleRow}>
          <View style={[card.pillarDot, { backgroundColor: pc.main }]} />
          <Text style={card.pillarLabel}>{PILLAR_LABELS[meta.pillar]}</Text>
        </View>
        <Text style={[card.title, meta.locked && card.titleLocked]} numberOfLines={1}>
          {meta.title}
        </Text>
        {!meta.locked && (
          <View style={card.progressWrap}>
            <View style={[card.progressFill, { width: `${pct * 100}%` as any, backgroundColor: pc.main }]} />
          </View>
        )}
        {meta.locked && (
          <Text style={card.lockLabel}>Complete previous concept to unlock</Text>
        )}
      </View>

      {/* Right: day count or lock */}
      <View style={card.right}>
        {meta.locked ? (
          <Text style={card.lockIcon}>◌</Text>
        ) : (
          <>
            <Text style={[card.dayCount, { color: pc.main }]}>{daysDone}</Text>
            <Text style={card.dayTotal}>/ {meta.daysTotal}</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[3],
    marginBottom: spacing[3],
    ...shadows.claySubtle,
  },
  locked: { opacity: 0.55 },
  numWrap: {
    width: 44, height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  num: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 24,
  },
  mid: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  pillarDot: {
    width: 5, height: 5, borderRadius: 3,
  },
  pillarLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 20,
    marginBottom: 6,
  },
  titleLocked: { color: colors.muted },
  progressWrap: {
    height: 3,
    backgroundColor: colors.rule2,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  lockLabel: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    lineHeight: 14,
  },
  right: {
    alignItems: 'center',
    flexShrink: 0,
    minWidth: 28,
  },
  dayCount: {
    fontFamily: fonts.display,
    fontSize: 18,
    lineHeight: 22,
  },
  dayTotal: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
  },
  lockIcon: {
    fontSize: 18,
    color: colors.rule2,
  },
});

// ── Main screen ──

export default function LearnScreen() {
  const locale = useLocale();
  const { profile } = useUser();
  const t = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;

  const [activePillar, setActivePillar] = useState<Pillar | null>(null);

  const displayed = activePillar
    ? CONCEPTS.filter(c => c.pillar === activePillar)
    : CONCEPTS;

  // Mock progress — replaced by SQLite query in Phase 1
  const mockDaysDone: Record<string, number> = {
    c01: 3, c02: 1,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.nav.learn}</Text>
          <Text style={styles.sub}>10 concepts · 50 micro-lessons</Text>
        </View>

        {/* Progress summary */}
        <View style={styles.summaryRow}>
          {ALL_PILLARS.map(p => {
            const pc = pillarColors[p];
            const done = CONCEPTS.filter(c => c.pillar === p && !c.locked).length;
            const total = CONCEPTS.filter(c => c.pillar === p).length;
            return (
              <View key={p} style={[styles.summaryPill, { backgroundColor: pc.light }]}>
                <Text style={[styles.summaryNum, { color: pc.main }]}>{done}/{total}</Text>
                <Text style={[styles.summaryLabel, { color: pc.main }]}>{PILLAR_LABELS[p]}</Text>
              </View>
            );
          })}
        </View>

        {/* Pillar filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {ALL_PILLARS.map(p => (
            <PillarChip
              key={p}
              pillar={p}
              active={activePillar === p}
              onPress={() => setActivePillar(activePillar === p ? null : p)}
            />
          ))}
        </ScrollView>

        {/* Concept list */}
        <View style={styles.list}>
          {displayed.map(meta => (
            <ConceptCard
              key={meta.id}
              meta={meta}
              daysDone={mockDaysDone[meta.id] ?? 0}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[3],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    lineHeight: 40,
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing[2],
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  summaryPill: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: spacing[2] + 2,
    alignItems: 'center',
  },
  summaryNum: {
    fontFamily: fonts.display,
    fontSize: 16,
    lineHeight: 20,
  },
  summaryLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 8,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  chipsScroll: { marginBottom: spacing[4] },
  chips: {
    paddingHorizontal: spacing[5],
    gap: spacing[2],
    flexDirection: 'row',
  },
  list: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
  },
});
