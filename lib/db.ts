/**
 * Adhyan — SQLite Database Layer
 * Offline-first. SQLite is the source of truth.
 * Supabase syncs on top; never blocks the UI.
 */

import * as SQLite from 'expo-sqlite';
import type { PersonaKey } from '@/constants/design';
import type { Locale } from '@/constants/i18n';

const DB_NAME = 'adhyan.db';

let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    _db = SQLite.openDatabaseSync(DB_NAME);
  }
  return _db;
}

// ─────────────────────────────────────────────
// SCHEMA MIGRATIONS
// Run once on app launch. Safe to run multiple times.
// ─────────────────────────────────────────────

export async function runMigrations(): Promise<void> {
  const db = getDb();

  // Enable WAL mode for better concurrent read performance
  db.execSync('PRAGMA journal_mode = WAL;');

  db.execSync(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id               INTEGER PRIMARY KEY DEFAULT 1,
      locale           TEXT NOT NULL DEFAULT 'hi',
      persona          TEXT NOT NULL DEFAULT 'generic',
      occupation       TEXT,
      age_group        TEXT,
      name             TEXT,
      streak_days      INTEGER NOT NULL DEFAULT 0,
      longest_streak   INTEGER NOT NULL DEFAULT 0,
      last_active_date TEXT,
      highest_milestone INTEGER NOT NULL DEFAULT 0,
      ai_age_level     TEXT NOT NULL DEFAULT 'curious_child',
      onboarding_complete INTEGER NOT NULL DEFAULT 0,
      district         TEXT,
      state            TEXT,
      supabase_user_id TEXT
    );

    CREATE TABLE IF NOT EXISTS user_progress (
      concept_id       TEXT PRIMARY KEY,
      status           TEXT NOT NULL DEFAULT 'not_started',
      current_day      INTEGER NOT NULL DEFAULT 0,
      started_at       INTEGER,
      mastered_at      INTEGER,
      review_due_at    INTEGER,
      ease_factor      REAL NOT NULL DEFAULT 2.5,
      interval_days    INTEGER NOT NULL DEFAULT 1,
      repetitions      INTEGER NOT NULL DEFAULT 0,
      last_quality     INTEGER,
      helpful_today    INTEGER,
      retrieval_answered INTEGER
    );

    CREATE TABLE IF NOT EXISTS local_concepts (
      id               TEXT PRIMARY KEY,
      version          TEXT NOT NULL,
      pillar           TEXT NOT NULL,
      concept_number   INTEGER NOT NULL,
      canonical_title  TEXT NOT NULL,
      icon_emoji       TEXT NOT NULL DEFAULT '💡',
      color_token      TEXT NOT NULL DEFAULT 'use',
      prerequisite_ids TEXT NOT NULL DEFAULT '[]',
      synced_at        INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_skins (
      skin_id          TEXT PRIMARY KEY,
      concept_id       TEXT NOT NULL,
      locale           TEXT NOT NULL,
      persona          TEXT NOT NULL,
      day1_hook        TEXT NOT NULL,
      day2_reveal      TEXT NOT NULL,
      day3_practice    TEXT NOT NULL,
      day4_retrieval_q TEXT NOT NULL,
      day4_acceptable_ans TEXT NOT NULL DEFAULT '[]',
      day5_check_prompt TEXT NOT NULL,
      one_liner        TEXT NOT NULL,
      completion_message TEXT NOT NULL,
      audio_url        TEXT,
      audio_path       TEXT,
      font_size_class  TEXT NOT NULL DEFAULT 'md',
      voice_speed      TEXT NOT NULL DEFAULT 'normal',
      synced_at        INTEGER NOT NULL,
      FOREIGN KEY (concept_id) REFERENCES local_concepts(id)
    );

    CREATE TABLE IF NOT EXISTS prompt_cookbook (
      id               TEXT PRIMARY KEY,
      prompt_text      TEXT NOT NULL,
      context_note     TEXT,
      occupation_tag   TEXT,
      concept_id       TEXT,
      locale           TEXT NOT NULL,
      created_at       INTEGER NOT NULL,
      use_count        INTEGER NOT NULL DEFAULT 0,
      last_used_at     INTEGER,
      is_starred       INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS daily_feed_cache (
      date             TEXT PRIMARY KEY,
      feed_json        TEXT NOT NULL,
      cached_at        INTEGER NOT NULL
    );
  `);
}

// ─────────────────────────────────────────────
// USER PROFILE
// ─────────────────────────────────────────────

export interface UserProfile {
  id: number;
  locale: Locale;
  persona: PersonaKey;
  occupation?: string;
  age_group?: string;
  name?: string;
  streak_days: number;
  longest_streak: number;
  last_active_date?: string;
  highest_milestone: number;
  ai_age_level: string;
  onboarding_complete: boolean;
  district?: string;
  state?: string;
  supabase_user_id?: string;
}

export function getUserProfile(): UserProfile | null {
  const db = getDb();
  const row = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM user_profile WHERE id = 1'
  );
  if (!row) return null;
  return {
    id: row.id as number,
    locale: (row.locale as Locale) ?? 'hi',
    persona: (row.persona as PersonaKey) ?? 'generic',
    occupation: row.occupation as string | undefined,
    age_group: row.age_group as string | undefined,
    name: row.name as string | undefined,
    streak_days: (row.streak_days as number) ?? 0,
    longest_streak: (row.longest_streak as number) ?? 0,
    last_active_date: row.last_active_date as string | undefined,
    highest_milestone: (row.highest_milestone as number) ?? 0,
    ai_age_level: (row.ai_age_level as string) ?? 'curious_child',
    onboarding_complete: Boolean(row.onboarding_complete),
    district: row.district as string | undefined,
    state: row.state as string | undefined,
    supabase_user_id: row.supabase_user_id as string | undefined,
  };
}

export function upsertUserProfile(profile: Partial<Omit<UserProfile, 'id'>>): void {
  const db = getDb();
  const existing = getUserProfile();

  if (!existing) {
    db.runSync(
      `INSERT INTO user_profile (
        id, locale, persona, occupation, age_group, name,
        streak_days, longest_streak, last_active_date,
        highest_milestone, ai_age_level, onboarding_complete,
        district, state, supabase_user_id
      ) VALUES (1, ?, ?, ?, ?, ?, 0, 0, NULL, 0, 'curious_child', 0, ?, ?, ?)`,
      [
        profile.locale ?? 'hi',
        profile.persona ?? 'generic',
        profile.occupation ?? null,
        profile.age_group ?? null,
        profile.name ?? null,
        profile.district ?? null,
        profile.state ?? null,
        profile.supabase_user_id ?? null,
      ]
    );
  } else {
    const fields = Object.keys(profile)
      .filter(k => k !== 'id')
      .map(k => `${k} = ?`)
      .join(', ');
    const values = Object.keys(profile)
      .filter(k => k !== 'id')
      .map(k => (profile as Record<string, unknown>)[k]);

    if (fields) {
      db.runSync(`UPDATE user_profile SET ${fields} WHERE id = 1`, values as SQLite.SQLiteBindValue[]);
    }
  }
}

// ─────────────────────────────────────────────
// STREAK MANAGEMENT
// ─────────────────────────────────────────────

export function updateStreak(): { streakDays: number; isMilestone: boolean; milestoneDay: number } {
  const db = getDb();
  const profile = getUserProfile();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  if (!profile) return { streakDays: 1, isMilestone: false, milestoneDay: 0 };

  if (profile.last_active_date === today) {
    return { streakDays: profile.streak_days, isMilestone: false, milestoneDay: 0 };
  }

  const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const newStreak = profile.last_active_date === yesterday
    ? profile.streak_days + 1
    : 1;

  const newLongest = Math.max(newStreak, profile.longest_streak);
  const milestones = [3, 7, 14, 21, 30, 45, 60];
  const isMilestone = milestones.includes(newStreak);

  db.runSync(
    `UPDATE user_profile
     SET streak_days = ?, longest_streak = ?, last_active_date = ?
     WHERE id = 1`,
    [newStreak, newLongest, today]
  );

  return { streakDays: newStreak, isMilestone, milestoneDay: isMilestone ? newStreak : 0 };
}

// ─────────────────────────────────────────────
// USER PROGRESS
// ─────────────────────────────────────────────

export interface ConceptProgress {
  concept_id: string;
  status: 'not_started' | 'in_progress' | 'mastered';
  current_day: number;
  started_at?: number;
  mastered_at?: number;
  review_due_at?: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  last_quality?: number;
  helpful_today?: boolean;
  retrieval_answered?: boolean;
}

export function getConceptProgress(conceptId: string): ConceptProgress | null {
  const db = getDb();
  const row = db.getFirstSync<Record<string, unknown>>(
    'SELECT * FROM user_progress WHERE concept_id = ?',
    [conceptId]
  );
  if (!row) return null;
  return row as unknown as ConceptProgress;
}

export function getAllProgress(): ConceptProgress[] {
  const db = getDb();
  return db.getAllSync<ConceptProgress>('SELECT * FROM user_progress');
}

export function upsertProgress(data: Partial<ConceptProgress> & { concept_id: string }): void {
  const db = getDb();
  const existing = getConceptProgress(data.concept_id);

  if (!existing) {
    db.runSync(
      `INSERT INTO user_progress (
        concept_id, status, current_day, started_at,
        ease_factor, interval_days, repetitions
      ) VALUES (?, ?, ?, ?, 2.5, 1, 0)`,
      [
        data.concept_id,
        data.status ?? 'in_progress',
        data.current_day ?? 1,
        data.started_at ?? Date.now(),
      ]
    );
  } else {
    const fields = Object.keys(data)
      .filter(k => k !== 'concept_id')
      .map(k => `${k} = ?`)
      .join(', ');
    const values = Object.keys(data)
      .filter(k => k !== 'concept_id')
      .map(k => (data as Record<string, unknown>)[k]);

    if (fields) {
      db.runSync(
        `UPDATE user_progress SET ${fields} WHERE concept_id = ?`,
        [...(values as SQLite.SQLiteBindValue[]), data.concept_id]
      );
    }
  }
}

// ─────────────────────────────────────────────
// PROMPT COOKBOOK
// ─────────────────────────────────────────────

export interface SavedPrompt {
  id: string;
  prompt_text: string;
  context_note?: string;
  occupation_tag?: string;
  concept_id?: string;
  locale: string;
  created_at: number;
  use_count: number;
  last_used_at?: number;
  is_starred: boolean;
}

export function getSavedPrompts(): SavedPrompt[] {
  const db = getDb();
  return db.getAllSync<SavedPrompt>(
    'SELECT * FROM prompt_cookbook ORDER BY is_starred DESC, created_at DESC'
  );
}

export function savePrompt(prompt: Omit<SavedPrompt, 'id' | 'created_at' | 'use_count' | 'is_starred'>): void {
  const db = getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  db.runSync(
    `INSERT INTO prompt_cookbook (
      id, prompt_text, context_note, occupation_tag, concept_id,
      locale, created_at, use_count, is_starred
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 0)`,
    [
      id,
      prompt.prompt_text,
      prompt.context_note ?? null,
      prompt.occupation_tag ?? null,
      prompt.concept_id ?? null,
      prompt.locale,
      Date.now(),
    ]
  );
}

export function incrementPromptUse(id: string): void {
  const db = getDb();
  db.runSync(
    'UPDATE prompt_cookbook SET use_count = use_count + 1, last_used_at = ? WHERE id = ?',
    [Date.now(), id]
  );
}

export function togglePromptStar(id: string): void {
  const db = getDb();
  db.runSync(
    'UPDATE prompt_cookbook SET is_starred = CASE WHEN is_starred = 1 THEN 0 ELSE 1 END WHERE id = ?',
    [id]
  );
}
