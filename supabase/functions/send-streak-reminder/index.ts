/**
 * send-streak-reminder
 *
 * Cron job: called once per day (e.g., 6:30 AM IST = 01:00 UTC).
 * Finds users who:
 *   - have push_token set
 *   - have streak_days > 0
 *   - have not been active today (last_active_date < today)
 *
 * Sends a gentle streak reminder via Expo Push API.
 * Batched in groups of 100 (Expo limit per request).
 *
 * Trigger: Supabase scheduled cron (pg_cron) or external scheduler
 * Auth: service role only — no JWT needed
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const BATCH_SIZE = 100;

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  badge?: number;
  sound?: 'default' | null;
}

Deno.serve(async (req: Request) => {
  // Only allow service role (no JWT check — called by cron)
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceKey) {
    return new Response(JSON.stringify({ error: 'Misconfigured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    serviceKey,
    { auth: { persistSession: false } }
  );

  const today = new Date().toISOString().split('T')[0];

  // Find users to remind
  const { data: users, error } = await supabase
    .from('user_profiles')
    .select('id, push_token, streak_days, locale')
    .not('push_token', 'is', null)
    .gt('streak_days', 0)
    .or(`last_active_date.is.null,last_active_date.lt.${today}`)
    .limit(500);  // Safety cap

  if (error) {
    console.error('[streak-reminder] Query error:', error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!users || users.length === 0) {
    return new Response(JSON.stringify({ sent: 0, message: 'No users to remind' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Build push messages
  const messages: PushMessage[] = users.map(u => {
    const isHindi = u.locale === 'hi';
    const streak  = u.streak_days as number;

    let body: string;
    if (streak >= 7) {
      body = isHindi
        ? `आपकी ${streak} दिन की स्ट्रीक है — आज भी जारी रखें।`
        : `You have a ${streak}-day streak. Keep it going today.`;
    } else if (streak >= 3) {
      body = isHindi
        ? `${streak} दिन हो गए — एक और दिन जोड़ें।`
        : `${streak} days in a row. Add one more.`;
    } else {
      body = isHindi
        ? 'आज का पाठ 5 मिनट में।'
        : 'Today\'s lesson is ready. 5 minutes.';
    }

    return {
      to:    u.push_token as string,
      title: isHindi ? 'अध्यान' : 'Adhyan',
      body,
      data:  { screen: '/(tabs)' },
      badge: 1,
      sound: 'default',
    };
  });

  // Send in batches
  let totalSent = 0;
  let totalFailed = 0;

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);
    try {
      const resp = await fetch(EXPO_PUSH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate',
        },
        body: JSON.stringify(batch),
      });

      if (resp.ok) {
        totalSent += batch.length;
      } else {
        console.error('[streak-reminder] Batch failed:', resp.status, await resp.text());
        totalFailed += batch.length;
      }
    } catch (e) {
      console.error('[streak-reminder] Batch exception:', e);
      totalFailed += batch.length;
    }
  }

  return new Response(
    JSON.stringify({ sent: totalSent, failed: totalFailed, total: users.length }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
});
