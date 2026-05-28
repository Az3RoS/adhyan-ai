/**
 * Cookbook — Prompt Library
 * Saved prompts organised by pillar. Tap to copy/share.
 * Offline: all prompts stored locally in SQLite.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, FlatList,
} from 'react-native';
import { useLocale } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  pillarColors, type Pillar,
} from '@/constants/design';

// ── Types ──

interface PromptEntry {
  id: string;
  title: string;
  prompt: string;
  pillar: Pillar;
  uses: number;
  starred: boolean;
  persona?: string;
}

// ── Mock prompts (replaced by SQLite getCookbook() in Phase 1) ──

const MOCK_PROMPTS: PromptEntry[] = [
  {
    id: 'p1',
    title: 'Check if a message is a scam',
    prompt: 'I received this message. Is it a scam? Please explain in simple language.\n\n[Paste message here]',
    pillar: 'protect',
    uses: 12,
    starred: true,
  },
  {
    id: 'p2',
    title: 'Verify a job offer',
    prompt: 'This job offer arrived on WhatsApp. Is it genuine? What are the warning signs?\n\n[Paste offer here]',
    pillar: 'protect',
    uses: 8,
    starred: false,
  },
  {
    id: 'p3',
    title: 'Explain this in simple words',
    prompt: 'Explain this to me as if I am a farmer with no technical background.\n\n[Paste text here]',
    pillar: 'understand',
    uses: 21,
    starred: true,
  },
  {
    id: 'p4',
    title: 'Is this AI-generated?',
    prompt: 'Does this image or text look AI-generated? What signs tell you so?',
    pillar: 'evaluate',
    uses: 4,
    starred: false,
  },
  {
    id: 'p5',
    title: 'Write a complaint letter',
    prompt: 'Help me write a formal complaint letter to [name of office or company] about [describe your problem]. Keep it short and polite.',
    pillar: 'use',
    uses: 17,
    starred: true,
  },
  {
    id: 'p6',
    title: 'Mandi price check',
    prompt: 'What is today\'s mandi price for [crop name] in [district name], [state name]? Where can I sell for the best price?',
    pillar: 'use',
    uses: 9,
    starred: false,
  },
];

const PILLAR_LABELS: Record<Pillar, string> = {
  protect: 'Protect', understand: 'Understand',
  use: 'Use', evaluate: 'Evaluate',
};

// ── Prompt card ──

function PromptCard({
  entry, onStar,
}: { entry: PromptEntry; onStar: (id: string) => void }) {
  const pc = pillarColors[entry.pillar];
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    // Clipboard.setStringAsync(entry.prompt) — Phase 1
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <View style={pCard.wrap}>
      <View style={pCard.top}>
        <View style={[pCard.pillarChip, { backgroundColor: pc.light }]}>
          <Text style={[pCard.pillarText, { color: pc.main }]}>{PILLAR_LABELS[entry.pillar]}</Text>
        </View>
        <TouchableOpacity
          onPress={() => onStar(entry.id)}
          style={pCard.starBtn}
          accessibilityRole="button"
          accessibilityLabel={entry.starred ? 'Remove from starred' : 'Star this prompt'}
        >
          <Text style={[pCard.star, entry.starred && { color: colors.use }]}>
            {entry.starred ? '★' : '☆'}
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={pCard.title}>{entry.title}</Text>
      <Text style={pCard.preview} numberOfLines={2}>{entry.prompt}</Text>

      <View style={pCard.footer}>
        <Text style={pCard.uses}>{entry.uses} uses</Text>
        <TouchableOpacity
          style={[pCard.copyBtn, copied && { backgroundColor: colors.understand }]}
          onPress={handleCopy}
          activeOpacity={0.8}
          accessibilityRole="button"
        >
          <Text style={pCard.copyText}>{copied ? 'Copied ✓' : 'Copy prompt'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const pCard = StyleSheet.create({
  wrap: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[4],
    marginBottom: spacing[3],
    ...shadows.claySubtle,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  pillarChip: {
    paddingVertical: 3,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
  },
  pillarText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 9,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  starBtn: { padding: 4 },
  star: {
    fontSize: 18,
    color: colors.rule2,
  },
  title: {
    fontFamily: fonts.bodyMedium,
    fontSize: 15,
    color: colors.ink,
    lineHeight: 22,
    marginBottom: spacing[2],
  },
  preview: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.inkSoft,
    lineHeight: 19,
    marginBottom: spacing[3],
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uses: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },
  copyBtn: {
    paddingVertical: 7,
    paddingHorizontal: spacing[3] + 2,
    borderRadius: radius.sm,
    backgroundColor: colors.ink,
  },
  copyText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.white,
  },
});

// ── Empty state ──

function EmptyState() {
  return (
    <View style={empty.wrap}>
      <Text style={empty.icon}>◎</Text>
      <Text style={empty.title}>No prompts yet</Text>
      <Text style={empty.sub}>
        Complete a concept lesson to unlock prompts for that skill.
      </Text>
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingTop: spacing[8],
    paddingHorizontal: spacing[6],
  },
  icon: { fontSize: 36, color: colors.rule2, marginBottom: spacing[3] },
  title: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    marginBottom: spacing[2],
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});

// ── Main screen ──

export default function CookbookScreen() {
  const locale = useLocale();
  const t = (strings as Record<string, typeof strings.en>)[locale] ?? strings.en;

  const [prompts, setPrompts] = useState(MOCK_PROMPTS);
  const [filter, setFilter] = useState<'all' | 'starred'>('all');

  function handleStar(id: string) {
    setPrompts(prev => prev.map(p =>
      p.id === id ? { ...p, starred: !p.starred } : p
    ));
  }

  const displayed = filter === 'starred'
    ? prompts.filter(p => p.starred)
    : prompts;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.nav.cookbook}</Text>
          <Text style={styles.sub}>Your saved AI prompts — tap to copy</Text>
        </View>

        {/* Filter toggle */}
        <View style={styles.toggleRow}>
          {(['all', 'starred'] as const).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.toggle, filter === f && styles.toggleActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.75}
            >
              <Text style={[styles.toggleLabel, filter === f && styles.toggleLabelActive]}>
                {f === 'all' ? 'All prompts' : '★  Starred'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* List */}
        <View style={styles.list}>
          {displayed.length === 0
            ? <EmptyState />
            : displayed.map(entry => (
                <PromptCard key={entry.id} entry={entry} onStar={handleStar} />
              ))
          }
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
  toggleRow: {
    flexDirection: 'row',
    marginHorizontal: spacing[5],
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: 3,
    marginBottom: spacing[4],
    ...shadows.claySubtle,
  },
  toggle: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  toggleActive: {
    backgroundColor: colors.ink,
  },
  toggleLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.muted,
  },
  toggleLabelActive: {
    color: colors.white,
  },
  list: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[6],
  },
});
