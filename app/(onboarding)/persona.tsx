/**
 * Onboarding Step 2 — Persona / Occupation Selection
 * Skippable. One tap per card. Large targets.
 * Immediately shows how the persona card looks selected.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useLocale } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  personaColors, type PersonaKey,
} from '@/constants/design';

interface PersonaOption {
  key: PersonaKey;
  icon: string; // We use text-based icons to avoid font dependencies at this stage
}

const PERSONAS: PersonaOption[] = [
  { key: 'elderly',         icon: '◎' },
  { key: 'farmer',          icon: '◉' },
  { key: 'student',         icon: '◈' },
  { key: 'gig_worker',      icon: '◷' },
  { key: 'clerk',           icon: '◧' },
  { key: 'shop_owner',      icon: '◰' },
  { key: 'homemaker',       icon: '◍' },
  { key: 'domestic_worker', icon: '◌' },
];

export default function PersonaScreen() {
  const router = useRouter();
  const { setPersona, completeOnboarding } = useUser();
  const locale = useLocale();
  const t = strings[locale] ?? strings.en;

  const [selected, setSelected] = useState<PersonaKey | null>(null);

  function handleContinue(persona: PersonaKey | null) {
    if (persona) setPersona(persona);
    completeOnboarding();
    router.replace('/(onboarding)/welcome');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Step indicator */}
        <View style={styles.stepRow}>
          <View style={styles.stepDot} />
          <View style={[styles.stepDot, styles.stepDotActive]} />
          <View style={styles.stepDot} />
        </View>

        {/* Heading */}
        <View style={styles.heading}>
          <Text style={styles.title}>{t.onboarding.personaTitle}</Text>
          <Text style={styles.sub}>{t.onboarding.personaSub}</Text>
        </View>

        {/* Grid */}
        <ScrollView
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        >
          {PERSONAS.map(p => {
            const isSelected = selected === p.key;
            const accent = personaColors[p.key];
            const label = t.personas[p.key];

            return (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.card,
                  isSelected && { backgroundColor: accent.light, borderColor: accent.main + '60' },
                ]}
                onPress={() => setSelected(p.key)}
                activeOpacity={0.8}
                accessibilityLabel={label}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View style={[styles.iconWrap, { backgroundColor: accent.light }]}>
                  <Text style={[styles.iconText, { color: accent.main }]}>{p.icon}</Text>
                </View>
                <Text style={[styles.cardLabel, isSelected && { color: accent.main }]}>
                  {label}
                </Text>
                {isSelected && (
                  <View style={[styles.checkDot, { backgroundColor: accent.main }]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.continueBtn, !selected && styles.continueBtnDisabled]}
            onPress={() => selected && handleContinue(selected)}
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            <Text style={styles.continueBtnText}>Continue</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleContinue(null)}
            style={styles.skipBtn}
            accessibilityRole="button"
          >
            <Text style={styles.skipText}>{t.onboarding.personaSkip}</Text>
          </TouchableOpacity>
        </View>

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
  stepDot: {
    width: 6, height: 6, borderRadius: 3,
    backgroundColor: colors.rule2,
  },
  stepDotActive: { backgroundColor: colors.ink, width: 20 },
  heading: { marginBottom: spacing[5] },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    lineHeight: 40,
    marginBottom: spacing[2],
  },
  sub: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 22,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingBottom: spacing[4],
  },
  card: {
    width: '47.5%',
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingVertical: spacing[4],
    paddingHorizontal: spacing[3],
    alignItems: 'center',
    gap: spacing[2],
    position: 'relative',
    ...shadows.claySubtle,
  },
  iconWrap: {
    width: 48, height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 22 },
  cardLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.ink,
    textAlign: 'center',
    lineHeight: 18,
  },
  checkDot: {
    position: 'absolute',
    top: 10, right: 10,
    width: 8, height: 8,
    borderRadius: 4,
  },
  footer: {
    gap: spacing[3],
    paddingTop: spacing[4],
  },
  continueBtn: {
    height: 56,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.clayButton,
  },
  continueBtnDisabled: {
    backgroundColor: colors.muted,
    ...shadows.claySubtle,
  },
  continueBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 16,
    color: colors.white,
    letterSpacing: 0.3,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  skipText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textDecorationLine: 'underline',
    textDecorationStyle: 'dotted',
  },
});
