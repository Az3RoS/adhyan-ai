/**
 * Supabase ↔ SQLite sync layer.
 * Rules:
 *  - SQLite is always the source of truth for reads (offline-first).
 *  - Supabase is the source of truth for content (concepts, skins, alerts).
 *  - User data flows: SQLite write → background push to Supabase.
 *  - Content flows: Supabase pull → SQLite write (on app start, if online).
 */

import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';
import {
  getDb, getUserProfile, upsertUserProfile, upsertLocalSkin,
  type UserProfile, type ConceptProgress, type LocalSkin,
} from './db';

// ── Anonymous auth ──────────────────────────────────────────────────────────

/**
 * Ensure the user has a Supabase session.
 * On first launch: signs in anonymously → stores UUID in SQLite.
 * Subsequent launches: restores session from Supabase's persisted token.
 * Returns the Supabase user ID (UUID).
 */
export async function ensureSupabaseSession(): Promise<string | null> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user.id;

    // No existing session — sign in anonymously
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('[sync] Anonymous sign-in failed:', error.message);
      return null;
    }
    return data.user?.id ?? null;
  } catch (e) {
    console.warn('[sync] ensureSupabaseSession error:', e);
    return null;
  }
}

// ── Profile sync ────────────────────────────────────────────────────────────

/**
 * Push local SQLite profile to Supabase user_profiles.
 * Called after onboarding is complete.
 */
export async function syncProfileUp(userId: string, profile: UserProfile): Promise<void> {
  const { error } = await supabase.from('user_profiles').upsert({
    id:              userId,
    locale:          profile.locale,
    persona:         profile.persona,
    occupation:      profile.occupation ?? null,
    age_group:       profile.age_group ?? null,
    streak_days:     profile.streak_days,
    longest_streak:  profile.longest_streak,
    last_active_date: profile.last_active_date ?? null,
    district:        profile.district ?? null,
    state:           profile.state ?? null,
    highest_milestone_day: profile.highest_milestone,
  }, { onConflict: 'id' });

  if (error) console.warn('[sync] syncProfileUp error:', error.message);
}

// ── Progress sync ───────────────────────────────────────────────────────────

/**
 * Push a single concept progress record to Supabase.
 * Called after each day completion.
 */
export async function syncProgressUp(
  userId: string,
  progress: ConceptProgress
): Promise<void> {
  const { error } = await supabase.from('user_progress').upsert({
    user_id:          userId,
    concept_id:       progress.concept_id,
    status:           progress.status,
    current_day:      progress.current_day,
    started_at:       progress.started_at
      ? new Date(progress.started_at).toISOString() : null,
    mastered_at:      progress.mastered_at
      ? new Date(progress.mastered_at).toISOString() : null,
    ease_factor:      progress.ease_factor,
    interval_days:    progress.interval_days,
    repetitions:      progress.repetitions,
    last_review_quality: progress.last_quality ?? null,
    helpful_today:    progress.helpful_today ?? null,
    retrieval_answered: progress.retrieval_answered ?? null,
  }, { onConflict: 'user_id,concept_id' });

  if (error) console.warn('[sync] syncProgressUp error:', error.message);
}

// ── Content pull ─────────────────────────────────────────────────────────────

/**
 * Fetch the daily feed from the assemble-daily-feed Edge Function.
 * Falls back to null (caller uses cached/mock data) on any error.
 */
export async function fetchDailyFeed(params: {
  locale:    string;
  persona:   string;
  state?:    string;
  district?: string;
}): Promise<DailyFeedCard[] | null> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return null;

    const { data, error } = await supabase.functions.invoke('assemble-daily-feed', {
      body: params,
    });

    if (error) {
      console.warn('[sync] fetchDailyFeed error:', error.message);
      return null;
    }
    return data?.cards ?? null;
  } catch (e) {
    console.warn('[sync] fetchDailyFeed exception:', e);
    return null;
  }
}

/**
 * Pull published concept nodes from Supabase into SQLite local_concepts.
 * Called once on app start (throttled to once per 24h).
 */
export async function syncConceptsDown(): Promise<void> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    const { data, error } = await supabase
      .from('concept_nodes')
      .select('id, version, pillar, concept_number, canonical_title, icon_emoji, color_token, prerequisite_ids')
      .eq('status', 'published');

    if (error || !data) return;

    const db = getDb();
    const now = Date.now();
    db.withTransactionSync(() => {
      for (const c of data) {
        db.runSync(
          `INSERT OR REPLACE INTO local_concepts
           (id, version, pillar, concept_number, canonical_title,
            icon_emoji, color_token, prerequisite_ids, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            c.id, c.version, c.pillar, c.concept_number,
            c.canonical_title, c.icon_emoji, c.color_token,
            JSON.stringify(c.prerequisite_ids ?? []), now,
          ]
        );
      }
    });
  } catch (e) {
    console.warn('[sync] syncConceptsDown error:', e);
  }
}

// ── TTS ─────────────────────────────────────────────────────────────────────

export interface TTSResult {
  audio_base64: string;
  mime_type: string;
  duration_hint_s: number;
}

/**
 * Convert text to speech via bhashini-tts Edge Function.
 * Returns null on network failure or Bhashini unavailability.
 */
export async function fetchTTS(params: {
  text: string;
  source_lang: string;
  voice_speed?: string;
  concept_id?: string;
}): Promise<TTSResult | null> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return null;

    const { data, error } = await supabase.functions.invoke('bhashini-tts', {
      body: params,
    });

    if (error) { console.warn('[sync] fetchTTS error:', error.message); return null; }
    return data as TTSResult;
  } catch (e) {
    console.warn('[sync] fetchTTS exception:', e);
    return null;
  }
}

// ── Scam check ───────────────────────────────────────────────────────────────

export interface ScamCheckResult {
  risk: 'low' | 'medium' | 'high' | 'critical';
  verdict: string;
  signs: string[];
  safe_action: string;
  confidence: number;
}

/**
 * Check a suspicious message via check-scam Edge Function (Gemini → Groq fallback).
 * Returns null on network failure.
 */
export async function checkScam(params: {
  message: string;
  locale: string;
  context?: string;
}): Promise<ScamCheckResult | null> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return null;

    const { data, error } = await supabase.functions.invoke('check-scam', {
      body: params,
    });

    if (error) { console.warn('[sync] checkScam error:', error.message); return null; }
    return data as ScamCheckResult;
  } catch (e) {
    console.warn('[sync] checkScam exception:', e);
    return null;
  }
}

/**
 * Pull explanation skins for the user's locale + persona from Supabase
 * and write to local_skins SQLite. Called once per session if online.
 */
export async function syncSkinsDown(locale: string, persona: string): Promise<void> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return;

    const { data, error } = await supabase
      .from('explanation_skins')
      .select(`
        skin_id, concept_id, locale, persona,
        day1_hook, day2_reveal, day3_practice,
        day4_retrieval_q, day4_acceptable_ans,
        day5_check_prompt, one_liner, completion_message,
        audio_url, font_size_class, voice_speed
      `)
      .eq('status', 'published')
      .in('locale', [locale, 'en'])
      .in('persona', [persona, 'generic']);

    if (error || !data) return;

    const now = Date.now();
    for (const s of data) {
      upsertLocalSkin({
        ...(s as LocalSkin),
        day4_acceptable_ans: s.day4_acceptable_ans ?? [],
        audio_path: undefined,
        synced_at: now,
      });
    }
  } catch (e) {
    console.warn('[sync] syncSkinsDown error:', e);
  }
}

// ── DailyFeedCard type (matches assemble-daily-feed Edge Function response) ──

export interface DailyFeedCard {
  card_type:         'scam_alert' | 'concept' | 'good_read' | 'prompt_tip';
  card_id:           string;
  title:             string;
  body:              string;
  cta_label:         string;
  cta_route:         string;
  pillar?:           string;
  safety_critical?:  boolean;
  icon_emoji?:       string;
  color_token?:      string;
  source_url?:       string;
  read_time_minutes?: number;
}
