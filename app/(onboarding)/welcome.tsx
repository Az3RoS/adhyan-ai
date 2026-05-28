/**
 * Onboarding Step 3 — Welcome
 * Brief, warm, one action. Concept 10 (Scam Literacy) preview.
 * This is the first hook — a story, not an explanation.
 */

import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import { colors, fonts, spacing, radius, shadows, pillarColors } from '@/constants/design';

export default function WelcomeScreen() {
  const router = useRouter();
  const locale = useLocale();
  const t = strings[locale] ?? strings.en;

  function handleBegin() {
    router.replace('/(tabs)');
  }

  const protect = pillarColors.protect;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Step dots */}
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
        </View>

        {/* Art area */}
        <View style={styles.artArea}>
          <View style={styles.artInner}>
            <View style={styles.pillBadge}>
              <Text style={styles.pillText}>PROTECT</Text>
            </View>
            <Text style={styles.artNumber}>10</Text>
            <Text style={styles.artTitle}>Scam{'\n'}Literacy</Text>
          </View>
        </View>

        {/* Story hook */}
        <View style={styles.storyCard}>
          <Text style={styles.storyEyebrow}>Your first lesson</Text>
          <Text style={styles.storyPull}>
            "Her phone rang. The voice sounded exactly like her son."
          </Text>
          <Text style={styles.storyBody}>
            Seema Ji, 67, Pune. She almost sent ₹15,000 to a scammer.
            The voice was made by AI. She stopped in time.{'\n\n'}
            This week, you'll learn exactly how she did it.
          </Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={styles.beginBtn}
          onPress={handleBegin}
          activeOpacity={0.85}
          accessibilityRole="button"
        >
          <Text style={styles.beginBtnText}>{t.onboarding.welcomeCta}</Text>
        </TouchableOpacity>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: spacing[5],
    paddingTop: spacing[5],
    paddingBottom: spacing[6],
  },
  stepRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  stepDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.rule2 },
  stepDotActive: { backgroundColor: colors.ink, width: 20 },

  artArea: {
    backgroundColor: colors.ink,
    borderRadius: radius.xl,
    overflow: 'hidden',
    marginBottom: spacing[4],
    height: 200,
    justifyContent: 'flex-end',
    ...shadows.clay,
  },
  artInner: {
    padding: spacing[5],
  },
  pillBadge: {
    alignSelf: 'flex-start',
    paddingVertical: 3,
    paddingHorizontal: spacing[3],
    borderRadius: radius.full,
    backgroundColor: 'rgba(200,57,10,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(200,57,10,0.3)',
    marginBottom: spacing[2],
  },
  pillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: '#f4a07a',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  artNumber: {
    fontFamily: fonts.display,
    fontSize: 80,
    color: 'rgba(200,57,10,0.1)',
    lineHeight: 80,
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[3],
  },
  artTitle: {
    fontFamily: fonts.display,
    fontSize: 38,
    color: colors.white,
    lineHeight: 44,
  },

  storyCard: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[5],
    marginBottom: spacing[4],
    ...shadows.clay,
  },
  storyEyebrow: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.protect,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: spacing[3],
  },
  storyPull: {
    fontFamily: fonts.displayItalic,
    fontSize: 19,
    color: colors.ink,
    lineHeight: 28,
    marginBottom: spacing[3],
    paddingLeft: spacing[3],
    borderLeftWidth: 2.5,
    borderLeftColor: 'rgba(200,57,10,0.3)',
  },
  storyBody: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 24,
  },

  beginBtn: {
    height: 56,
    backgroundColor: colors.protect,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.clayButton,
  },
  beginBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
});
