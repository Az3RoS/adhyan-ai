/**
 * Adhyan — Global User Context
 * Wraps the entire app. Provides locale, persona, profile.
 * Reading is synchronous from SQLite — no loading flash.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getUserProfile, upsertUserProfile, runMigrations, updateStreak, type UserProfile } from './db';
import type { Locale } from '@/constants/i18n';
import type { PersonaKey } from '@/constants/design';

interface UserContextValue {
  profile: UserProfile | null;
  isReady: boolean;
  setLocale: (locale: Locale) => void;
  setPersona: (persona: PersonaKey) => void;
  completeOnboarding: () => void;
  refreshProfile: () => void;
}

const UserContext = createContext<UserContextValue | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshProfile = useCallback(() => {
    const p = getUserProfile();
    setProfile(p);
  }, []);

  useEffect(() => {
    // Run migrations, then load profile, then check streak
    runMigrations()
      .then(() => {
        refreshProfile();
        updateStreak(); // update streak on every app open
        refreshProfile(); // re-read after streak update
      })
      .catch(console.error)
      .finally(() => setIsReady(true));
  }, [refreshProfile]);

  const setLocale = useCallback((locale: Locale) => {
    upsertUserProfile({ locale });
    refreshProfile();
  }, [refreshProfile]);

  const setPersona = useCallback((persona: PersonaKey) => {
    upsertUserProfile({ persona });
    refreshProfile();
  }, [refreshProfile]);

  const completeOnboarding = useCallback(() => {
    upsertUserProfile({ onboarding_complete: true });
    refreshProfile();
  }, [refreshProfile]);

  return (
    <UserContext.Provider value={{ profile, isReady, setLocale, setPersona, completeOnboarding, refreshProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within <UserProvider>');
  return ctx;
}

/** Convenience hook — returns the active locale, defaulting to 'hi' */
export function useLocale(): Locale {
  const { profile } = useUser();
  return profile?.locale ?? 'hi';
}
