/**
 * Home — Daily Feed
 * Swipeable cards: scam alerts, concepts, good reads, prompt tips.
 * Offline: falls back to mock feed; cached feed served when network unavailable.
 */

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Dimensions, SafeAreaView, ScrollView, Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useLocale, useUser } from '@/lib/UserContext';
import { fetchDailyFeed, type DailyFeedCard } from '@/lib/sync';
import { strings } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  pillarColors,
} from '@/constants/design';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W   = SCREEN_W - spacing[5] * 2;

// ── Display card type (adapted from API for rendering) ──

interface DisplayCard {
  id:           string;
  badge:        string;
  headline:     string;
  body:         string;
  cta?:         string;
  ctaRoute?:    string;
  source?:      string;
  color:        string;
  accentGlyph?: string;
}

// ── Map pillar/card_type token to hex color ──

function colorFromToken(token?: string): string {
  switch (token) {
    case 'protect':   return colors.protect;
    case 'understand': return colors.understand;
    case 'use':       return colors.use;
    case 'evaluate':  return colors.evaluate;
    default:          return colors.understand;
  }
}

const BADGE_LABELS: Record<DailyFeedCard['card_type'], string> = {
  scam_alert:      'Scam Alert',
  concept:         "Today's Concept",
  good_read:       'Good Read',
  community_story: 'Real Story',
  prompt_tip:      'Prompt Tip',
};

function toDisplayCard(c: DailyFeedCard): DisplayCard {
  return {
    id:          c.card_id,
    badge:       BADGE_LABELS[c.card_type],
    headline:    c.title,
    body:        c.body,
    cta:         c.cta_label,
    ctaRoute:    c.cta_route,
    source:      c.source_url,
    color:       colorFromToken(c.color_token ?? c.pillar),
    accentGlyph: c.icon_emoji,
  };
}

// ── Mock feed (offline fallback) ──

const MOCK_FEED: DisplayCard[] = [
  {
    id: 'mock-1',
    badge: 'Scam Alert',
    headline: 'Voice Cloning Scam',
    body: 'A Pune woman nearly sent ₹15,000 after hearing a voice that sounded exactly like her son — made entirely by AI. Here are the three signs.',
    cta: 'Check a message',
    ctaRoute: '/scam-check',
    source: 'Cyber Dost · Ministry of Home Affairs',
    color: colors.protect,
    accentGlyph: '🛡️',
  },
  {
    id: 'mock-2',
    badge: "Today's Concept",
    headline: 'What AI Is',
    body: 'AI is a very well-read student who has never lived. Strong on facts, blind to your specific situation.',
    cta: 'Start learning',
    ctaRoute: '/concept/c01',
    source: 'Concept 1 · Understand',
    color: colors.understand,
    accentGlyph: '💡',
  },
  {
    id: 'mock-3',
    badge: 'Real Story',
    headline: '"I nearly fell for it"',
    body: 'A Nashik farmer got a WhatsApp message promising ₹50,000 in a lottery. Perfect grammar, real logo. He spotted all three signs. His neighbour did not.',
    cta: 'See related concept',
    ctaRoute: '/concept/c10',
    source: 'Raju, Nashik · Maharashtra',
    color: colors.evaluate,
    accentGlyph: '💬',
  },
  {
    id: 'mock-4',
    badge: 'Good Read',
    headline: 'How AI is changing rural India',
    body: 'From crop advisory bots to land record queries — a ground-level look at AI adoption in five states.',
    cta: 'Read more',
    ctaRoute: undefined,
    source: 'The Hindu · 5 min read',
    color: colors.understand,
    accentGlyph: '📖',
  },
];

// ── Morning campfire card ──

function CampfireCard({ locale }: { locale: string }) {
  const t = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;
  return (
    <TouchableOpacity
      style={campfire.card}
      activeOpacity={0.8}
      accessibilityRole="button"
      onPress={() => router.push('/concept/c01')}
    >
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
  chevron: { fontSize: 22, color: colors.use, lineHeight: 24 },
});

// ── Main feed card ──

function FeedCard({ card }: { card: DisplayCard }) {
  const handleCta = () => {
    if (!card.ctaRoute) return;
    // External URLs (good reads, source links)
    if (card.ctaRoute.startsWith('http')) {
      Linking.openURL(card.ctaRoute).catch(console.warn);
      return;
    }
    router.push(card.ctaRoute as never);
  };

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
              onPress={handleCta}
              accessibilityLabel={card.cta}
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
          <Text style={feedCard.source} numberOfLines={1}>{card.source}</Text>
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
  art: { height: 160, overflow: 'hidden', padding: spacing[5], justifyContent: 'flex-end' },
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
  artTitle: { fontFamily: fonts.display, fontSize: 30, color: 'white', lineHeight: 34 },
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
  ctaText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: 'white' },
  waBtn: {
    width: 40, height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waIcon: { fontSize: 18, color: 'white', lineHeight: 22 },
  source: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
});

// ── Offline indicator ──

function OfflineBanner() {
  return (
    <View style={offline.bar}>
      <Text style={offline.text}>Showing saved feed · No connection</Text>
    </View>
  );
}

const offline = StyleSheet.create({
  bar: {
    marginHorizontal: spacing[5],
    marginBottom: spacing[3],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.06)',
    alignItems: 'center',
  },
  text: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
  },
});

// ── Main screen ──

export default function HomeScreen() {
  const locale      = useLocale();
  const { profile } = useUser();
  const t           = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;

  const [feed, setFeed]         = useState<DisplayCard[]>(MOCK_FEED);
  const [isOffline, setIsOffline] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const today = new Date().toLocaleDateString(
    locale === 'hi' ? 'hi-IN' : locale === 'bn' ? 'bn-BD' : 'en-IN',
    { weekday: 'long', day: 'numeric', month: 'long' }
  );

  // Load live feed on mount, after profile is ready
  useEffect(() => {
    if (!profile) return;

    fetchDailyFeed({
      locale:  profile.locale ?? 'en',
      persona: profile.persona ?? 'generic',
      state:   profile.state,
      district: profile.district,
    }).then(cards => {
      if (cards && cards.length > 0) {
        setFeed(cards.map(toDisplayCard));
        setIsOffline(false);
      } else {
        // null = offline or error — keep mock/cached feed
        setIsOffline(true);
      }
    });
  }, [profile?.locale, profile?.persona]);

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

        {/* Offline indicator */}
        {isOffline && <OfflineBanner />}

        {/* Morning campfire review */}
        <View style={styles.section}>
          <View style={styles.sectionPad}>
            <CampfireCard locale={locale} />
          </View>
        </View>

        {/* Feed cards */}
        <View style={styles.section}>
          <FlatList
            data={feed}
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
            {feed.map((_, i) => (
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
  header: {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[4],
  },
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
  streakDot:  { fontSize: 8, color: colors.use },
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
  section:    { marginBottom: spacing[4] },
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
