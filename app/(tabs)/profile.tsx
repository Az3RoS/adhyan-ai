/**
 * Profile — Settings and Progress
 * Language switcher, persona picker, streak, privacy controls.
 * Offline-first: all settings saved in SQLite.
 */

import { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser, useLocale } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import type { Locale } from '@/constants/i18n';
import {
  colors, fonts, spacing, radius, shadows,
  personaColors, pillarColors, type PersonaKey,
} from '@/constants/design';

// ── Section header ──

function SectionHead({ label }: { label: string }) {
  return <Text style={sec.head}>{label}</Text>;
}
const sec = StyleSheet.create({
  head: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    color: colors.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: spacing[2],
    marginTop: spacing[4],
  },
});

// ── Language row ──

const LANGS: { locale: Locale; label: string; script: string }[] = [
  { locale: 'hi', label: 'हिंदी', script: 'Hindi' },
  { locale: 'bn', label: 'বাংলা', script: 'Bengali' },
  { locale: 'en', label: 'English', script: 'English' },
];

function LanguageRow({
  current, onChange,
}: { current: Locale; onChange: (l: Locale) => void }) {
  return (
    <View style={lang.row}>
      {LANGS.map(l => (
        <TouchableOpacity
          key={l.locale}
          style={[lang.btn, current === l.locale && lang.btnActive]}
          onPress={() => onChange(l.locale)}
          activeOpacity={0.75}
          accessibilityRole="radio"
          accessibilityState={{ selected: current === l.locale }}
        >
          <Text style={[lang.label, current === l.locale && lang.labelActive]}>
            {l.label}
          </Text>
          <Text style={lang.script}>{l.script}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const lang = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  btn: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    paddingVertical: spacing[3],
    alignItems: 'center',
    ...shadows.claySubtle,
  },
  btnActive: {
    backgroundColor: colors.ink,
    borderColor: colors.ink,
  },
  label: {
    fontFamily: fonts.bodyMedium,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 22,
  },
  labelActive: { color: colors.white },
  script: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.muted,
    marginTop: 1,
  },
});

// ── Streak display ──

function StreakCard({ streak }: { streak: number }) {
  return (
    <View style={streak_s.card}>
      <View style={streak_s.left}>
        <Text style={streak_s.num}>{streak}</Text>
        <Text style={streak_s.label}>day streak</Text>
      </View>
      <View style={streak_s.dotsWrap}>
        {Array.from({ length: 7 }).map((_, i) => (
          <View
            key={i}
            style={[streak_s.dot, i < Math.min(streak, 7) && streak_s.dotFilled]}
          />
        ))}
      </View>
    </View>
  );
}

const streak_s = StyleSheet.create({
  card: {
    backgroundColor: colors.useLight,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(184,122,16,0.2)',
    padding: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
    ...shadows.claySubtle,
  },
  left: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[2] },
  num: {
    fontFamily: fonts.display,
    fontSize: 42,
    color: colors.use,
    lineHeight: 50,
  },
  label: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.use,
  },
  dotsWrap: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 10, height: 10,
    borderRadius: 5,
    backgroundColor: colors.rule2,
  },
  dotFilled: {
    backgroundColor: colors.use,
  },
});

// ── Settings row ──

function SettingRow({
  label, value, onPress, danger,
}: { label: string; value?: string; onPress?: () => void; danger?: boolean }) {
  return (
    <TouchableOpacity
      style={row.wrap}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      accessibilityRole={onPress ? 'button' : 'text'}
    >
      <Text style={[row.label, danger && row.danger]}>{label}</Text>
      {value && <Text style={row.value}>{value}</Text>}
      {onPress && !danger && <Text style={row.chevron}>›</Text>}
    </TouchableOpacity>
  );
}

const row = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[4],
    marginBottom: spacing[2],
    ...shadows.claySubtle,
  },
  label: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  danger: { color: '#c8390a' },
  value: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.muted,
    marginRight: spacing[2],
  },
  chevron: {
    fontSize: 20,
    color: colors.muted,
    lineHeight: 22,
  },
});

// ── Main screen ──

const PERSONA_LABELS: Record<PersonaKey, string> = {
  elderly: 'Senior Citizen', farmer: 'Farmer', student: 'Student',
  gig_worker: 'Gig Worker', clerk: 'Clerk / Govt. Employee',
  shop_owner: 'Shop Owner', homemaker: 'Homemaker',
  domestic_worker: 'Domestic Worker', professional: 'Professional',
  generic: 'General User',
};

export default function ProfileScreen() {
  const router = useRouter();
  const locale = useLocale();
  const { profile, setLocale } = useUser();
  const t = (strings as unknown as Record<string, typeof strings.en>)[locale] ?? strings.en;

  const personaLabel = profile?.persona
    ? PERSONA_LABELS[profile.persona as PersonaKey] ?? profile.persona
    : 'Not set';

  function handleResetOnboarding() {
    Alert.alert(
      'Restart onboarding?',
      'This will take you back to language selection. Your progress is saved.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restart',
          style: 'destructive',
          onPress: () => router.replace('/(onboarding)/language'),
        },
      ]
    );
  }

  function handleDeleteData() {
    Alert.alert(
      'Delete all data?',
      'This cannot be undone. All your progress, prompts, and settings will be erased.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {} },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.nav.profile}</Text>
          {profile?.name && (
            <Text style={styles.name}>{profile.name}</Text>
          )}
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <SectionHead label="Your streak" />
          <StreakCard streak={profile?.streak_days ?? 0} />
        </View>

        {/* Language */}
        <View style={styles.section}>
          <SectionHead label="Language" />
          <LanguageRow current={locale} onChange={setLocale} />
        </View>

        {/* Account */}
        <View style={styles.section}>
          <SectionHead label="Account" />
          <SettingRow label="Persona" value={personaLabel} onPress={() => {}} />
          <SettingRow label="Notifications" value="On" onPress={() => {}} />
          <SettingRow label="District" value={profile?.district ?? 'Not set'} onPress={() => {}} />
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <SectionHead label="Privacy & Data" />
          <SettingRow label="GPS is never stored" value="Location: off" />
          <SettingRow label="Export my data" onPress={() => {}} />
          <SettingRow label="Privacy policy" onPress={() => {}} />
        </View>

        {/* Danger zone */}
        <View style={styles.section}>
          <SectionHead label="Reset" />
          <SettingRow label="Restart onboarding" onPress={handleResetOnboarding} />
          <SettingRow label="Delete all my data" danger onPress={handleDeleteData} />
        </View>

        {/* Version */}
        <Text style={styles.version}>Adhyan v0.1.0-alpha · Open-source</Text>

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
    paddingBottom: spacing[2],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 34,
    color: colors.ink,
    lineHeight: 40,
  },
  name: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing[5],
  },
  version: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.muted,
    textAlign: 'center',
    paddingVertical: spacing[5],
    paddingBottom: spacing[6],
  },
});
