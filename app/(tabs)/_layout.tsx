/**
 * Bottom tab navigator — 4 tabs, 56dp minimum height.
 * "I'm Lost" compass button floats above the nav on all main screens.
 */

import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useUser, useLocale } from '@/lib/UserContext';
import { strings } from '@/constants/i18n';
import { colors, fonts, spacing } from '@/constants/design';

// ── Inline SVG-style tab icons drawn with View primitives ──

function HomeIcon({ active }: { active: boolean }) {
  const c = active ? colors.protect : colors.muted;
  return (
    <View style={[tab.iconWrap]}>
      {/* Simple house shape via nested Views */}
      <View style={[tab.houseRoof, { borderBottomColor: c }]} />
      <View style={[tab.houseBody, { borderColor: c, borderTopWidth: 0 }]}>
        <View style={[tab.houseDoor, { borderColor: c }]} />
      </View>
    </View>
  );
}

function LearnIcon({ active }: { active: boolean }) {
  const c = active ? colors.protect : colors.muted;
  return (
    <View style={tab.iconWrap}>
      <View style={[tab.bulbCircle, { borderColor: c }]} />
      <View style={[tab.bulbBase, { backgroundColor: c }]} />
    </View>
  );
}

function CookbookIcon({ active }: { active: boolean }) {
  const c = active ? colors.protect : colors.muted;
  return (
    <View style={tab.iconWrap}>
      <View style={[tab.bookSpine, { backgroundColor: c }]} />
      <View style={[tab.bookPage, { borderColor: c, borderLeftWidth: 0 }]} />
    </View>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  const c = active ? colors.protect : colors.muted;
  return (
    <View style={tab.iconWrap}>
      <View style={[tab.profileHead, { borderColor: c }]} />
      <View style={[tab.profileBody, { borderColor: c, borderBottomWidth: 0 }]} />
    </View>
  );
}

const tab = StyleSheet.create({
  iconWrap: { width: 24, height: 22, alignItems: 'center', justifyContent: 'center' },
  houseRoof: {
    width: 0, height: 0,
    borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 8,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    marginBottom: 0,
  },
  houseBody: {
    width: 16, height: 10,
    borderWidth: 1.8,
    borderRadius: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  houseDoor: {
    width: 5, height: 6,
    borderWidth: 1.5,
    borderBottomWidth: 0,
    borderRadius: 1,
    marginBottom: -1,
  },
  bulbCircle: {
    width: 14, height: 14,
    borderRadius: 7,
    borderWidth: 1.8,
    marginBottom: 1,
  },
  bulbBase: {
    width: 8, height: 3,
    borderRadius: 1,
  },
  bookSpine: {
    position: 'absolute',
    left: 4, top: 0, bottom: 0,
    width: 4,
    borderRadius: 1,
  },
  bookPage: {
    position: 'absolute',
    left: 8, top: 1, right: 2, bottom: 1,
    borderWidth: 1.5,
    borderRadius: 1,
  },
  profileHead: {
    width: 11, height: 11,
    borderRadius: 5.5,
    borderWidth: 1.8,
    marginBottom: 2,
  },
  profileBody: {
    width: 18, height: 8,
    borderWidth: 1.8,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
  },
});

// ── Root guard — redirect to onboarding if not complete ──

export default function TabLayout() {
  const { profile, isReady } = useUser();
  const locale = useLocale();
  const t = strings[locale] ?? strings.en;

  // While DB is loading, render nothing (splash is still visible)
  if (!isReady) return null;

  // First launch — send to onboarding
  if (!profile || !profile.onboarding_complete) {
    return <Redirect href="/(onboarding)/language" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.protect,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.nav.home,
          tabBarIcon: ({ focused }) => <HomeIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="learn"
        options={{
          title: t.nav.learn,
          tabBarIcon: ({ focused }) => <LearnIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="cookbook"
        options={{
          title: t.nav.cookbook,
          tabBarIcon: ({ focused }) => <CookbookIcon active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t.nav.profile,
          tabBarIcon: ({ focused }) => <ProfileIcon active={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: colors.paper,
    borderTopColor: colors.rule2,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 64,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    paddingTop: 6,
    elevation: 0,
  },
  tabLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10,
    letterSpacing: 0.3,
  },
  tabItem: {
    height: 56,
  },
});
