import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Link, Stack } from 'expo-router';
import { colors, fonts, spacing, radius, shadows } from '@/constants/design';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found', headerShown: false }} />
      <View style={styles.container}>
        <Text style={styles.glyph}>◌</Text>
        <Text style={styles.title}>Page not found</Text>
        <Text style={styles.body}>This screen does not exist.</Text>
        <Link href="/(tabs)" asChild>
          <TouchableOpacity style={styles.btn} accessibilityRole="link">
            <Text style={styles.btnText}>Go home →</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
    gap: spacing[3],
  },
  glyph: {
    fontSize: 56,
    color: colors.rule2,
    marginBottom: spacing[2],
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    color: colors.ink,
    lineHeight: 36,
    textAlign: 'center',
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.muted,
    textAlign: 'center',
  },
  btn: {
    marginTop: spacing[3],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[5],
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    ...shadows.clayButton,
  },
  btnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 15,
    color: colors.white,
  },
});
