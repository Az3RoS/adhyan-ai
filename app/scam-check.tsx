/**
 * Scam Checker — "Is this a scam?"
 *
 * User pastes or types a suspicious message/URL.
 * Sends to check-scam Edge Function (Gemini → Groq fallback).
 * Returns plain-language verdict + red flags + safe action.
 *
 * Accessible via:
 *   - Feed scam alert card CTA
 *   - Direct link from anywhere in the app: router.push('/scam-check')
 *
 * Design: the result screen is the UI — no separate "results" page.
 * The entire screen transforms from input → verdict in-place.
 */

import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, SafeAreaView, ScrollView,
  ActivityIndicator, Animated, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useLocale } from '@/lib/UserContext';
import { checkScam, type ScamCheckResult } from '@/lib/sync';
import { colors, fonts, spacing, radius, shadows } from '@/constants/design';

// ── Risk display config ──────────────────────────────────────────────────────

const RISK_CONFIG = {
  critical: { color: colors.protect,   label: 'HIGH RISK',   bg: '#fdf0e4' },
  high:     { color: '#e65100',         label: 'LIKELY SCAM', bg: '#fff3e0' },
  medium:   { color: colors.evaluate,   label: 'SUSPICIOUS',  bg: '#fce8f2' },
  low:      { color: colors.understand, label: 'LOOKS SAFE',  bg: '#eaf5e4' },
};

// ── Result card ──────────────────────────────────────────────────────────────

function ResultCard({ result }: { result: ScamCheckResult }) {
  const cfg = RISK_CONFIG[result.risk] ?? RISK_CONFIG.medium;

  return (
    <View style={[rcard.wrap, { borderLeftColor: cfg.color }]}>
      {/* Risk badge */}
      <View style={[rcard.badge, { backgroundColor: cfg.bg }]}>
        <View style={[rcard.dot, { backgroundColor: cfg.color }]} />
        <Text style={[rcard.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
      </View>

      {/* Verdict */}
      <Text style={rcard.verdict}>{result.verdict}</Text>

      {/* Red flags */}
      {result.signs.length > 0 && (
        <View style={rcard.section}>
          <Text style={rcard.sectionLabel}>What we noticed</Text>
          {result.signs.map((s, i) => (
            <View key={i} style={rcard.signRow}>
              <Text style={[rcard.signBullet, { color: cfg.color }]}>▸</Text>
              <Text style={rcard.signText}>{s}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Safe action — the most important part */}
      <View style={[rcard.actionBox, { backgroundColor: cfg.bg, borderColor: cfg.color + '30' }]}>
        <Text style={rcard.actionLabel}>What to do</Text>
        <Text style={[rcard.actionText, { color: cfg.color === colors.understand ? colors.inkSoft : cfg.color }]}>
          {result.safe_action}
        </Text>
      </View>

      {/* Confidence indicator — shown only if < 0.7 */}
      {result.confidence < 0.7 && (
        <Text style={rcard.confidenceNote}>
          Low confidence — please verify with a trusted person too.
        </Text>
      )}
    </View>
  );
}

const rcard = StyleSheet.create({
  wrap: {
    backgroundColor: colors.paper,
    borderRadius: radius.lg,
    borderLeftWidth: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.85)',
    padding: spacing[4],
    marginBottom: spacing[4],
    ...shadows.clay,
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: spacing[2],
    alignSelf: 'flex-start',
    paddingVertical: 4, paddingHorizontal: spacing[3],
    borderRadius: radius.full, marginBottom: spacing[3],
  },
  dot:        { width: 7, height: 7, borderRadius: 4 },
  badgeText:  {
    fontFamily: fonts.bodySemiBold, fontSize: 11,
    letterSpacing: 1.2, textTransform: 'uppercase',
  },
  verdict: {
    fontFamily: fonts.bodyMedium, fontSize: 17,
    color: colors.ink, lineHeight: 26, marginBottom: spacing[4],
  },
  section: { marginBottom: spacing[4] },
  sectionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: spacing[2],
  },
  signRow: { flexDirection: 'row', gap: spacing[2], marginBottom: 6 },
  signBullet: { fontSize: 12, lineHeight: 22, flexShrink: 0 },
  signText: {
    flex: 1, fontFamily: fonts.body, fontSize: 14,
    color: colors.inkSoft, lineHeight: 22,
  },
  actionBox: {
    padding: spacing[3], borderRadius: radius.md,
    borderWidth: 1, marginBottom: spacing[3],
  },
  actionLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 10,
    color: colors.muted, letterSpacing: 1, textTransform: 'uppercase',
    marginBottom: 4,
  },
  actionText: {
    fontFamily: fonts.bodyMedium, fontSize: 15, lineHeight: 24,
  },
  confidenceNote: {
    fontFamily: fonts.body, fontSize: 12,
    color: colors.muted, lineHeight: 18,
  },
});

// ── Offline notice ───────────────────────────────────────────────────────────

function OfflineNotice({ locale }: { locale: string }) {
  const msg = locale === 'hi'
    ? 'इंटरनेट नहीं है। जुड़ने के बाद दोबारा कोशिश करें।'
    : 'No internet connection. Connect and try again.';
  return (
    <View style={offline.wrap}>
      <Text style={offline.text}>{msg}</Text>
    </View>
  );
}

const offline = StyleSheet.create({
  wrap: {
    backgroundColor: colors.useLight,
    padding: spacing[4], borderRadius: radius.md, marginBottom: spacing[4],
  },
  text: { fontFamily: fonts.body, fontSize: 14, color: colors.use, lineHeight: 22 },
});

// ── Example prompts (shown before first check) ───────────────────────────────

const EXAMPLES = [
  '"Your KYC is incomplete. Call 98XXXXX now or your account will be blocked."',
  '"Earn ₹5000/day liking YouTube videos. Registration fee ₹500. Join now."',
  '"Congratulations! You won ₹25,000. Click here to claim before midnight."',
];

// ── Main screen ──────────────────────────────────────────────────────────────

export default function ScamCheckScreen() {
  const router  = useRouter();
  const locale  = useLocale();

  const [message, setMessage]     = useState('');
  const [checking, setChecking]   = useState(false);
  const [result, setResult]       = useState<ScamCheckResult | null>(null);
  const [offline, setIsOffline]   = useState(false);

  const isHindi = locale === 'hi';

  async function handleCheck() {
    if (!message.trim() || checking) return;
    setChecking(true);
    setResult(null);
    setIsOffline(false);

    const res = await checkScam({ message: message.trim(), locale });

    setChecking(false);
    if (res === null) {
      setIsOffline(true);
    } else {
      setResult(res);
    }
  }

  function handleReset() {
    setMessage('');
    setResult(null);
    setIsOffline(false);
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.title}>
              {isHindi ? 'संदेश जाँचें' : 'Check a Message'}
            </Text>
            <Text style={styles.subtitle}>
              {isHindi
                ? 'कोई भी संदिग्ध संदेश, लिंक या ऑफर यहाँ पेस्ट करें।'
                : 'Paste any suspicious message, link, or offer below.'}
            </Text>
          </View>

          {/* Input area */}
          {!result && (
            <View style={styles.inputSection}>
              <TextInput
                style={styles.input}
                multiline
                placeholder={isHindi
                  ? 'संदेश यहाँ पेस्ट करें…'
                  : 'Paste the suspicious message here…'}
                placeholderTextColor={colors.muted}
                value={message}
                onChangeText={setMessage}
                textAlignVertical="top"
                accessibilityLabel="Suspicious message"
                editable={!checking}
              />

              {/* Example prompts */}
              {!message && (
                <View style={styles.examples}>
                  <Text style={styles.examplesLabel}>
                    {isHindi ? 'उदाहरण के लिए कोशिश करें:' : 'Try an example:'}
                  </Text>
                  {EXAMPLES.map((ex, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.exampleChip}
                      onPress={() => setMessage(ex.replace(/^"|"$/g, ''))}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.exampleText} numberOfLines={2}>{ex}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Result */}
          {result && <ResultCard result={result} />}

          {/* Offline notice */}
          {offline && <OfflineNotice locale={locale} />}

          {/* Disclaimer */}
          {result && (
            <Text style={styles.disclaimer}>
              {isHindi
                ? 'यह जाँच एक शुरुआत है — किसी भरोसेमंद व्यक्ति से भी पूछें।'
                : 'This check is a starting point — always verify with a trusted person too.'}
            </Text>
          )}
        </ScrollView>

        {/* CTA bar */}
        <View style={styles.cta}>
          {!result ? (
            <TouchableOpacity
              style={[
                styles.checkBtn,
                (!message.trim() || checking) && styles.checkBtnDisabled,
              ]}
              onPress={handleCheck}
              disabled={!message.trim() || checking}
              activeOpacity={0.85}
              accessibilityRole="button"
            >
              {checking ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.checkBtnText}>
                  {isHindi ? 'जाँचें →' : 'Check this message →'}
                </Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleReset}
                activeOpacity={0.8}
                accessibilityRole="button"
              >
                <Text style={styles.resetBtnText}>
                  {isHindi ? 'नया संदेश जाँचें' : 'Check another'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.bg },
  scroll:   { flex: 1 },
  content:  {
    paddingHorizontal: spacing[5],
    paddingTop: spacing[4],
    paddingBottom: spacing[6],
  },
  header:   { marginBottom: spacing[5] },
  closeBtn: {
    alignSelf: 'flex-end',
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: colors.rule2,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: spacing[4],
  },
  closeBtnText: {
    fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.inkSoft, lineHeight: 20,
  },
  title: {
    fontFamily: fonts.display, fontSize: 32,
    color: colors.ink, lineHeight: 38, marginBottom: spacing[2],
  },
  subtitle: {
    fontFamily: fonts.body, fontSize: 14,
    color: colors.inkSoft, lineHeight: 22,
  },
  inputSection: { marginBottom: spacing[4] },
  input: {
    backgroundColor: colors.paper,
    borderRadius: radius.md,
    borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.1)',
    padding: spacing[4],
    minHeight: 140,
    fontFamily: fonts.body, fontSize: 15,
    color: colors.ink, lineHeight: 24,
    ...shadows.claySubtle,
    marginBottom: spacing[4],
  },
  examples:     { gap: spacing[2] },
  examplesLabel: {
    fontFamily: fonts.bodySemiBold, fontSize: 11,
    color: colors.muted, letterSpacing: 0.8,
    textTransform: 'uppercase', marginBottom: spacing[1],
  },
  exampleChip: {
    backgroundColor: colors.paper,
    borderRadius: radius.md, borderWidth: 1.5,
    borderColor: colors.rule2,
    paddingVertical: spacing[2] + 2, paddingHorizontal: spacing[3],
    ...shadows.claySubtle,
  },
  exampleText: {
    fontFamily: fonts.body, fontSize: 13,
    color: colors.inkSoft, lineHeight: 20,
    fontStyle: 'italic',
  },
  disclaimer: {
    fontFamily: fonts.body, fontSize: 12,
    color: colors.muted, lineHeight: 18,
    textAlign: 'center', marginTop: spacing[2],
  },
  cta: {
    paddingHorizontal: spacing[5],
    paddingBottom: spacing[5], paddingTop: spacing[3],
    backgroundColor: colors.bg,
    borderTopWidth: 1, borderTopColor: colors.rule2,
  },
  ctaRow: { flexDirection: 'row', gap: spacing[3] },
  checkBtn: {
    height: 56, backgroundColor: colors.protect,
    borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
    ...shadows.clayButton,
  },
  checkBtnDisabled: { backgroundColor: colors.muted, ...shadows.claySubtle },
  checkBtnText: {
    fontFamily: fonts.bodySemiBold, fontSize: 16, color: colors.white,
  },
  resetBtn: {
    flex: 1, height: 56, borderRadius: radius.md,
    backgroundColor: colors.paper,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: colors.rule2,
    ...shadows.claySubtle,
  },
  resetBtnText: {
    fontFamily: fonts.bodySemiBold, fontSize: 15, color: colors.ink,
  },
});
