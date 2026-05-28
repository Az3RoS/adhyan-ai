/**
 * Adhyan — SM-2 Spaced Repetition Algorithm
 * https://www.supermemo.com/en/archives1990-2015/english/ol/sm2
 *
 * Quality ratings (0–5):
 *   5 — Perfect recall
 *   4 — Correct after a moment's hesitation
 *   3 — Correct with serious difficulty (just passed)
 *   2 — Incorrect but the answer felt familiar
 *   1 — Incorrect; the correct answer was easy to recall
 *   0 — Complete blackout
 */

export interface SM2State {
  ease_factor: number;    // starts at 2.5
  interval_days: number;  // starts at 1
  repetitions: number;    // number of successful reviews
}

export interface SM2Result {
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: number; // unix ms timestamp
}

/**
 * Map a user's answer to a quality rating.
 * We map a binary or fuzzy match to a 0-5 quality.
 */
export function answerToQuality(
  userAnswer: string,
  acceptableAnswers: string[],
): number {
  if (!userAnswer.trim()) return 0;

  const normalised = userAnswer.toLowerCase().trim();
  const exact = acceptableAnswers.some(a => a.toLowerCase().trim() === normalised);
  if (exact) return 5;

  const partial = acceptableAnswers.some(a =>
    normalised.includes(a.toLowerCase()) || a.toLowerCase().includes(normalised)
  );
  if (partial) return 4;

  // Check if any key word is present
  const keywords = acceptableAnswers.flatMap(a => a.toLowerCase().split(/\s+/));
  const keywordMatch = keywords.some(k => normalised.includes(k) && k.length > 3);
  if (keywordMatch) return 3;

  return 1;
}

export function sm2Update(state: SM2State, quality: number): SM2Result {
  const q = Math.max(0, Math.min(5, quality));

  let { ease_factor, interval_days, repetitions } = state;

  if (q >= 3) {
    // Correct response
    if (repetitions === 0) {
      interval_days = 1;
    } else if (repetitions === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetitions += 1;
  } else {
    // Incorrect — reset to start
    repetitions = 0;
    interval_days = 1;
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  ease_factor = Math.max(1.3, ease_factor); // floor at 1.3

  const next_review_at = Date.now() + interval_days * 24 * 60 * 60 * 1000;

  return { ease_factor, interval_days, repetitions, next_review_at };
}

/**
 * Returns all concept IDs where review is due today or overdue.
 */
export function getDueConceptIds(
  progresses: Array<{ concept_id: string; review_due_at?: number; status: string }>
): string[] {
  const now = Date.now();
  return progresses
    .filter(p => p.status === 'mastered' && p.review_due_at && p.review_due_at <= now)
    .map(p => p.concept_id);
}
