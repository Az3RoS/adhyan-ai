/**
 * Learn — Concept Journey
 * 10 concepts across 4 pillars. Progress bars. Unlock chain via prerequisite_ids.
 * Data: SQLite local_concepts + user_progress (synced from Supabase).
 * Offline: shows last-synced data; full fallback to hardcoded seed if empty.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale, useUser } from '@/lib/UserContext';
import {
  getAllLocalConcepts, getAllProgress,
  type LocalConcept, type ConceptProgress,
} from '@/lib/db';
import { strings } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  pillarColors, type Pillar,
} from '@/constants/design';

// ── Pillar helpers ──────────────────────────────────────────────────────────

const PILLAR_LABELS: Record<string, string> = {
  protect:    'Protect',
  understand: 'Understand',
  use:        'Use',
  evaluate:   'Evaluate',
};

const ALL_PILLARS = ['protect', 'understand', 'use', 'evaluate'] as const;

// ── Hardcoded fallback (shown when SQLite has no concepts yet) ───────────────

interface FallbackConcept {
  id: string; number: number; title: string; pillar: Pillar;
  prerequisite_ids: string[];
}

const FALLBACK_CONCEPTS: FallbackConcept[] = [
  { id: 'c01', number: 1,  title: 'What AI Is',          pillar: 'understand', prerequisite_ids: [] },
  { id: 'c02', number: 2,  title: 'AI Makes Mistakes',   pillar: 'understand', prerequisite_ids: ['c01'] },
  { id: 'c03', number: 3,  title: 'Pattern Matching',    pillar: 'understand', prerequisite_ids: ['c01'] },
  { id: 'c04', number: 4,  title: 'Checking AI Output',  pillar: 'evaluate',   prerequisite_ids: ['c02'] },
  { id: 'c05', number: 5,  title: 'Voice & Image Fakes', pillar: 'protect',    prerequisite_ids: ['c01'] },
  { id: 'c06', number: 6,  title: 'Job Scam Signs',      pillar: 'protect',    prerequisite_ids: ['c05'] },
  { id: 'c07', number: 7,  title: 'Asking AI Better',    pillar: 'use',        prerequisite_ids: ['c01'] },
  { id: 'c08', number: 8,  title: 'AI for Your Work',    pillar: 'use',        prerequisite_ids: ['c07'] },
  { id: 'c09', number: 9,  title: 'When Not to Trust AI',pillar: 'evaluate',   prerequisite_ids: ['c04','c08'] },
  { id: 'c10', number: 10, title: 'Scam Literacy',       pillar: 'protect',    prerequisite_ids: ['c05','c06','c09'] },
];

// ── Unlock logic ─────────────────────────────────────────────────────────────

function isUnlocked(
  conceptId: string,
  prerequisiteIds: string[],
  progressMap: Map<string, ConceptProgress>
): boolean {
  if (prerequisiteIds.length === 0) return true;
  return prerequisiteIds.every(pid => progressMap.get(pid)?.status === 'mastered');
}

// ── Pillar filter chips ──────────────────────────────────────────────────────

function PillarChip({
  pillar, active, onPress,
}: { pillar: string; active: boolean; onPress: () => void }) {
  const pc = pillarColors[pillar as Pillar];
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
    paddingVertical: 6, paddingHorizontal: spacing[3] + 2,
    borderRadius: radius.full, borderWidth: 1.5,
  },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 12, letterSpacing: 0.3 },
});

// ── Concept card ─────────────────────────────────────────────────────────────

function ConceptCard({
  id, number, title, pillar, locked, currentDay, isMastered,
}: {
  id: string; number: number; title: string; pillar: string;
  locked: boolean; currentDay: number; isMastered: boolean;
}) {
  const router = useRouter();
  const pc = pillarColors[pillar as Pillar] ?? pillarColors.understand;
  const pct = Math.min(currentDay / 5, 1);
  const statusLabel = isMastered ? 'Mastered' : currentDay > 0 ? `Day ${currentDay} of 5` : 'Not started';

  return (
    <TouchableOpacity
      style={[card.wrap, locked && card.wrapLocked]}
      activeOpacity={locked ? 1 : 0.8}
      onPress={() => !locked && router.push(`/concept/${id}`)}
      accessibilityRole="button"
      accessibilityState={{ disabled: locked }}
    >
      {/* Number badge */}
      <View style={[card.numWrap, { backgroundColor: pc.light }]}>
        <Text style={[card.num, { color: pc.main }]}>{number}</Text>
        {isMastered && <View style={[card.masteredDot, { backgroundColor: pc.main }]} />}
      </View>

      {/* Title + progress */}
      <View style={card.mid}>
        <View style={card.labelRow}>
          <View style={[card.pillarDot, { backgroundColor: locked ? colors.muted : pc.main }]} />
          <Text style={[card.pillarLabel, locked && { color: colors.muted }]}>
            {PILLAR_LABELS[pillar] ?? pillar}
          </Text>
        </View>
        <Text
          style={[card.title, locked && card.titleLocked]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {locked ? (
          <Text style={card.lockHint}>Unlock by completing prerequisites</Text>
        ) : (
          <View style={card.progressTrack}>
            <View style={[card.progressFill, {
              width: `${pct * 100}%` as unknown as number,
              backgroundColor: pc.main,
            }]} />
          </View>
        )}
      </View>

      {/* Right side */}
      <View style={card.right}>
        {locked ? (
          <Text style={card.lockGlyph}>◌</Text>
        ) : isMastered ? (
          <Text style={[card.masteredLabel, { color: pc.main }]}>✓</Text>
        ) : (
          <>
            <Text style={[card.dayNum, { color: pc.main }]}>{currentDay}</Text>
            <Text style={card.dayDenom}>/5</Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[3],
    backgroundColor: colors.paper,
    borderRadius: radius.lg, borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[3], marginBottom: spacing[3],
    ...shadows.claySubtle,
  },
  wrapLocked:   { opacity: 0.52 },
  numWrap: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, position: 'relative',
  },
  masteredDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: colors.bg,
  },
  num: { fontFamily: fonts.display, fontSize: 20, lineHeight: 24 },
  mid: { flex: 1 },
  labelRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: 5, marginBottom: 2,
  },
  pillarDot:  { width: 5, height: 5, borderRadius: 3 },
  pillarLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 9,
    color: colors.muted, letterSpacing: 1, textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.bodyMedium, fontSize: 15,
    color: colors.ink, lineHeight: 20, marginBottom: 6,
  },
  titleLocked: { color: colors.muted },
  lockHint: {
    fontFamily: fonts.body, fontSize: 10,
    color: colors.muted, lineHeight: 14,
  },
  progressTrack: {
    height: 3, backgroundColor: colors.rule2,
    borderRadius: 2, overflow: 'hidden',
  },
  progressFill: { height: 3, borderRadius: 2 },
  right: { alignItems: 'center', flexShrink: 0, minWidth: 30 },
  lockGlyph:    { fontSize: 18, color: colors.rule2 },
  masteredLabel: { fontSize: 22, lineHeight: 26 },
  dayNum:  { fontFamily: fonts.display, fontSize: 18, lineHeight: 22 },
  dayDenom:{ fontFamily: fonts.body, fontSize: 10, color: colors.muted },
});

// ── Progress summary row ──────────────────────────────────────────────────────

function PillarSummary({
  pillar, masteredCount, totalCount,
}: { pillar: string; masteredCount: number; totalCount: number }) {
  const pc = pillarColors[pillar as Pillar] ?? pillarColors.understand;
  return (
    <View style={[summary.pill, { backgroundColor: pc.light }]}>
      <Text style={[summary.num, { color: pc.main }]}>{masteredCount}/{totalCount}</Text>
      <Text style={[summary.label, { color: pc.main }]}>{PILLAR_LABELS[pillar]}</Text>
    </View>
  );
}

const summary = StyleSheet.create({
  pill: {
    flex: 1, borderRadius: radius.md,
    paddingVertical: spacing[2] + 2, alignItems: 'center',
  },
  num: { fontFamily: fonts.display, fontSize: 16, lineHeight: 20 },
  label: {
    fontFamily: fonts.bodySemiBold, fontSize: 8,
    letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 1,
  },
});

// ── Main screen ───────────────────────────────────────────────────────────────

export default function LearnScreen() {
  const locale = useLocale();
  const { profile } = useUser();
  const t = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;

  const [activePillar, setActivePillar] = useState<string | null>(null);

  // Load from SQLite — returns empty array pre-sync
  const localConcepts: LocalConcept[] = getAllLocalConcepts();
  const allProgress: ConceptProgress[] = getAllProgress();

  const progressMap = new Map<string, ConceptProgress>(
    allProgress.map(p => [p.concept_id, p])
  );

  // Use SQLite data if available, otherwise fall back to hardcoded
  const sourceConcepts: FallbackConcept[] = localConcepts.length > 0
    ? localConcepts.map(c => ({
        id: c.id,
        number: c.concept_number,
        title: c.canonical_title,
        pillar: c.pillar as Pillar,
        prerequisite_ids: c.prerequisite_ids,
      }))
    : FALLBACK_CONCEPTS;

  const displayed = activePillar
    ? sourceConcepts.filter(c => c.pillar === activePillar)
    : sourceConcepts;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.nav.learn}</Text>
          <Text style={styles.sub}>
            {sourceConcepts.length} concepts · {sourceConcepts.length * 5} micro-lessons
          </Text>
        </View>

        {/* Pillar progress summary */}
        <View style={styles.summaryRow}>
          {ALL_PILLARS.map(p => {
            const inPillar = sourceConcepts.filter(c => c.pillar === p);
            const mastered = inPillar.filter(c =>
              progressMap.get(c.id)?.status === 'mastered'
            ).length;
            return (
              <PillarSummary
                key={p}
                pillar={p}
                masteredCount={mastered}
                totalCount={inPillar.length}
              />
            );
          })}
        </View>

        {/* Pillar filter chips */}
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
          {displayed.map(concept => {
            const progress = progressMap.get(concept.id);
            const locked   = !isUnlocked(concept.id, concept.prerequisite_ids, progressMap);
            const isMastered = progress?.status === 'mastered';
            const currentDay = isMastered ? 5 : (progress?.current_day ?? 0);

            return (
              <ConceptCard
                key={concept.id}
                id={concept.id}
                number={concept.number}
                title={concept.title}
                pillar={concept.pillar}
                locked={locked}
                currentDay={currentDay}
                isMastered={isMastered}
              />
            );
          })}
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
    fontFamily: fonts.display, fontSize: 34,
    color: colors.ink, lineHeight: 40,
  },
  sub: {
    fontFamily: fonts.body, fontSize: 13,
    color: colors.muted, marginTop: 2,
  },
  summaryRow: {
    flexDirection: 'row', gap: spacing[2],
    paddingHorizontal: spacing[5],
    marginBottom: spacing[4],
  },
  chipsScroll: { marginBottom: spacing[4] },
  chips: {
    paddingHorizontal: spacing[5],
    gap: spacing[2], flexDirection: 'row',
  },
  list: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
  },
});
