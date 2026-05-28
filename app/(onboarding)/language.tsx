/**
 * Onboarding Step 1 — Language Selection
 * The very first screen. No account required.
 * Three large buttons. One tap. Done.
 * Language name shown in the language itself.
 */

import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@/lib/UserContext';
import { colors, fonts, spacing, radius, touchTargets, shadows } from '@/constants/design';
import type { Locale } from '@/constants/i18n';

const LANGUAGES: { locale: Locale; native: string; english: string; script: string }[] = [
  { locale: 'hi', native: 'हिंदी',   english: 'Hindi',   script: 'Devanagari' },
  { locale: 'bn', native: 'বাংলা',   english: 'Bengali', script: 'Bengali'    },
  { locale: 'en', native: 'English', english: 'English', script: 'Latin'      },
];

const FONT_FOR: Record<Locale, string> = {
  hi: fonts.hindi,
  bn: fonts.bengali,
  en: fonts.display,
};

export default function LanguageScreen() {
  const router = useRouter();
  const { setLocale } = useUser();

  function handleSelect(locale: Locale) {
    setLocale(locale);
    router.push('/(onboarding)/persona');
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>

        {/* Brand header */}
        <View style={styles.header}>
          <Text style={styles.appName}>Adhyan</Text>
          <Text style={styles.tagline}>AI LITERACY · FOR EVERY INDIAN</Text>
        </View>

        {/* Language buttons */}
        <View style={styles.buttons}>
          {LANGUAGES.map(lang => (
            <TouchableOpacity
              key={lang.locale}
              style={styles.langButton}
              onPress={() => handleSelect(lang.locale)}
              activeOpacity={0.75}
              accessibilityLabel={`Choose ${lang.english}`}
              accessibilityRole="button"
            >
              <Text style={[styles.langNative, { fontFamily: FONT_FOR[lang.locale] }]}>
                {lang.native}
              </Text>
              <Text style={styles.langEnglish}>{lang.english}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer note */}
        <Text style={styles.footerNote}>
          You can change your language anytime in settings.
        </Text>

      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[6],
    paddingTop: spacing[16],
    paddingBottom: spacing[8],
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  appName: {
    fontFamily: fonts.display,
    fontSize: 72,
    color: colors.ink,
    letterSpacing: -1.5,
    lineHeight: 76,
  },
  tagline: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: colors.muted,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    marginTop: spacing[2],
  },
  buttons: {
    gap: spacing[4],
  },
  langButton: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[6],
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
    ...shadows.clay,
  },
  langNative: {
    fontSize: 28,
    color: colors.ink,
    lineHeight: 36,
  },
  langEnglish: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginTop: 2,
  },
  footerNote: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
