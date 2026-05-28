/**
 * Home — Daily Feed
 * Swipeable cards: scam alerts, weather, mandi prices, concept micro-cards.
 * Offline: serves cached feed with "last updated" indicator.
 */

import { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, SafeAreaView, ScrollView,
} from 'react-native';
import { useLocale, useUser } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  pillarColors,
} from '@/constants/design';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W   = SCREEN_W - spacing[5] * 2;

// ── Types ──

interface DailyCard {
  id: string;
  type: 'alert' | 'community' | 'lesson' | 'market' | 'weather' | 'tool' | 'tip';
  badge: string;
  headline: string;
  body: string;
  cta?: string;
  source?: string;
  color: string;
  accentGlyph?: string;
}

// ── Mock feed data (replaced by Supabase in Phase 2) ──

const MOCK_FEED: DailyCard[] = [
  {
    id: '1',
    type: 'alert',
    badge: 'Scam Alert',
    headline: 'Voice Cloning Scam',
    body: 'A Pune woman nearly sent ₹15,000 after hearing a voice that sounded exactly like her son — made entirely by AI. Here are the three signs.',
    cta: 'Check a message',
    source: 'Cyber Dost · Ministry of Home Affairs',
    color: colors.protect,
    accentGlyph: '!',
  },
  {
    id: '2',
    type: 'lesson',
    badge: "Today's Concept",
    headline: 'AI is a Pattern Matcher',
    body: 'It has read everything but lived nothing. Like a student who read every farming book but never held soil. Strong on facts, blind to your specific situation.',
    cta: 'Continue Day 3',
    source: 'Concept 1 · Understand',
    color: colors.understand,
    accentGlyph: '∞',
  },
  {
    id: '3',
    type: 'market',
    badge: 'Mandi Prices',
    headline: 'Tomato ₹28/kg',
    body: 'Nashik APMC today. Prices down 12% from last week due to surplus arrivals. Consider holding for 3–4 days if storage allows.',
    source: 'Agmarknet · Maharashtra',
    color: colors.use,
    accentGlyph: '₹',
  },
  {
    id: '4',
    type: 'community',
    badge: 'Community Story',
    headline: '"AI told me it was a scam"',
    body: 'Priya, 23, Mumbai: "A fake job offer arrived. ₹30,000/month, no experience needed. I forwarded it to AI Saathi. Fraud confirmed in 10 seconds."',
    source: 'Verified story · Mumbai',
    color: colors.evaluate,
    accentGlyph: '"',
  },
];

// ── Morning campfire card ──

function CampfireCard({ locale }: { locale: string }) {
  const t = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;
  return (
    <TouchableOpacity style={campfire.card} activeOpacity={0.8} accessibilityRole="button">
      <View style={campfire.iconWrap}>
        <Text style={campfire.iconText}>◎</Text>
      </View>
      <View style={campfire.content}>
        <Text style={campfire.eyebrow}>{t.campfire.title}</Text>
        <Text style={campfire.question} numberOfLines={2}>
          When there&apos;s fear and urgency — what&apos;s the one rule?
        </Text>
      </View>
      <Text style={campfire.chevron}>›</Text>
    </TouchableOpacity>
  );
}

const campfire = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    backgroundColor: colors.useLight,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(184,122,16,0.22)',
    padding: spacing[3],
    ...shadows.claySubtle,
  },
  iconWrap: {
    width: 38, height: 38,
    borderRadius: 11,
    backgroundColor: 'rgba(184,122,16,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18, color: colors.use },
  content: { flex: 1 },
  eyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.use,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  question: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
  chevron: {
    fontSize: 22,
    color: colors.use,
    lineHeight: 24,
  },
});

// ── Main feed card ──

function FeedCard({ card }: { card: DailyCard }) {
  return (
    <View style={[feedCard.card, { width: CARD_W }]}>

      {/* Art area */}
      <View style={[feedCard.art, { backgroundColor: card.color }]}>
        <View style={feedCard.arcOuter} />
        <View style={feedCard.arcInner} />
        {card.accentGlyph && (
          <Text style={feedCard.glyph}>{card.accentGlyph}</Text>
        )}
        <View style={feedCard.artContent}>
          <View style={feedCard.badge}>
            <Text style={feedCard.badgeText}>{card.badge}</Text>
          </View>
          <Text style={feedCard.artTitle}>{card.headline}</Text>
        </View>
      </View>

      {/* Body */}
      <View style={feedCard.body}>
        <Text style={feedCard.bodyText}>{card.body}</Text>

        <View style={feedCard.actions}>
          {card.cta ? (
            <TouchableOpacity
              style={[feedCard.ctaBtn, { backgroundColor: card.color }]}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              <Text style={feedCard.ctaText}>{card.cta} →</Text>
            </TouchableOpacity>
          ) : <View />}

          <TouchableOpacity
            style={feedCard.waBtn}
            activeOpacity={0.85}
            accessibilityLabel="Share on WhatsApp"
            accessibilityRole="button"
          >
            <Text style={feedCard.waIcon}>↗</Text>
          </TouchableOpacity>
        </View>

        {card.source && (
          <Text style={feedCard.source}>{card.source}</Text>
        )}
      </View>
    </View>
  );
}

const feedCard = StyleSheet.create({
  card: {
    backgroundColor: colors.paper,
    borderRadius: radius.xl,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.9)',
    overflow: 'hidden',
    ...shadows.clay,
    marginRight: spacing[5],
  },
  art: {
    height: 160,
    overflow: 'hidden',
    padding: spacing[5],
    justifyContent: 'flex-end',
  },
  arcOuter: {
    position: 'absolute', top: -50, right: -50,
    width: 200, height: 200, borderRadius: 100,
    borderWidth: 36, borderColor: 'rgba(255,255,255,0.06)',
  },
  arcInner: {
    position: 'absolute', top: 10, right: 30,
    width: 110, height: 110, borderRadius: 55,
    borderWidth: 18, borderColor: 'rgba(255,255,255,0.05)',
  },
  glyph: {
    position: 'absolute',
    right: spacing[4],
    top: '50%',
    marginTop: -55,
    fontFamily: fonts.display,
    fontSize: 110,
    color: 'rgba(255,255,255,0.08)',
    lineHeight: 110,
  },
  artContent: { position: 'relative', zIndex: 2 },
  badge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.28)',
    marginBottom: spacing[2],
  },
  badgeText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: 'white',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  artTitle: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: 'white',
    lineHeight: 34,
  },
  body: { padding: spacing[4] },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 22,
    marginBottom: spacing[4],
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  ctaBtn: {
    paddingVertical: spacing[2] + 2,
    paddingHorizontal: spacing[4],
    borderRadius: radius.sm,
  },
  ctaText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: 'white',
  },
  waBtn: {
    width: 40, height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waIcon: { fontSize: 18, color: 'white', lineHeight: 22 },
  source: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },
});

// ── Main screen ──

export default function HomeScreen() {
  const locale  = useLocale();
  const { profile } = useUser();
  const t = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;

  const [activeIndex, setActiveIndex] = useState(0);

  const today = new Date().toLocaleDateString(
    locale === 'hi' ? 'hi-IN' : locale === 'bn' ? 'bn-BD' : 'en-IN',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.greeting}>
              {t.feed.greeting(profile?.name)}
            </Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakDot}>●</Text>
              <Text style={styles.streakCount}>
                {t.feed.dayStreak(profile?.streak_days ?? 0)}
              </Text>
            </View>
          </View>
          <Text style={styles.dateText}>{today}</Text>
        </View>

        {/* Morning campfire review */}
        <View style={styles.section}>
          <CampfireCard locale={locale} />
        </View>

        {/* Feed cards */}
        <View style={styles.section}>
          <FlatList
            data={MOCK_FEED}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={CARD_W + spacing[5]}
            decelerationRate="fast"
            contentContainerStyle={{ paddingLeft: spacing[5], paddingRight: 0 }}
            onScroll={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (CARD_W + spacing[5]));
              setActiveIndex(idx);
            }}
            scrollEventThrottle={16}
            renderItem={({ item }) => <FeedCard card={item} />}
          />

          {/* Pagination dots */}
          <View style={styles.pagination}>
            {MOCK_FEED.map((_, i) => (
              <View
                key={i}
                style={[styles.pageDot, i === activeIndex && styles.pageDotActive]}
              />
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg },
  scroll: { flex: 1 },
  header: { paddingHorizontal: spacing[5], paddingTop: spacing[4], paddingBottom: spacing[4] },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  greeting: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkSoft,
  },
  streakPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    backgroundColor: colors.useLight,
    borderWidth: 1,
    borderColor: 'rgba(184,122,16,0.2)',
  },
  streakDot: { fontSize: 8, color: colors.use },
  streakCount: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.use,
  },
  dateText: {
    fontFamily: fonts.display,
    fontSize: 28,
    color: colors.ink,
    lineHeight: 34,
  },
  section: { marginBottom: spacing[4] },
  sectionPad: { paddingHorizontal: spacing[5] },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
    marginTop: spacing[3],
  },
  pageDot: {
    width: 5, height: 5,
    borderRadius: 3,
    backgroundColor: colors.rule2,
  },
  pageDotActive: {
    width: 18,
    backgroundColor: colors.protect,
  },
});
