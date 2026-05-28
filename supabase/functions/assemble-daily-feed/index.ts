/**
 * assemble-daily-feed
 *
 * Builds a personalised daily feed for one user.
 * Called by the app on startup (with JWT) whenever network is available.
 *
 * Request body (JSON):
 *   persona   — one of the 10 Adhyan personas
 *   locale    — 'en' | 'hi' | 'bn'
 *   state     — optional Indian state string
 *   district  — optional district string
 *
 * Response (JSON):
 *   cards: DailyFeedCard[]
 *
 * Card types returned (in order):
 *   1. scam_alert      — if any active high/critical alert exists for the user's profile
 *   2. concept         — next concept due (SM-2 due date) or first unseen concept
 *   3. good_read       — this week's curated article if publish_date <= today
 *   4. prompt_tip      — one cookbook prompt matching persona
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

// ── Types ────────────────────────────────────────────────────────────────────

interface RequestPayload {
  persona: string;
  locale: string;
  state?: string;
  district?: string;
}

interface DailyFeedCard {
  card_type: 'scam_alert' | 'concept' | 'good_read' | 'prompt_tip';
  card_id: string;
  title: string;
  body: string;
  cta_label: string;
  cta_route: string;
  pillar?: string;
  safety_critical?: boolean;
  icon_emoji?: string;
  color_token?: string;
  source_url?: string;
  read_time_minutes?: number;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth check — Supabase passes user JWT via Authorization header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Service client (for reading all data)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  );

  // User client (to get caller identity)
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await userClient.auth.getUser();
  if (authError || !user) {
    return new Response(JSON.stringify({ error: 'Invalid token' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Parse request body
  let payload: RequestPayload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { persona, locale } = payload;
  if (!persona || !locale) {
    return new Response(
      JSON.stringify({ error: 'persona and locale are required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const cards: DailyFeedCard[] = [];
  const today = new Date().toISOString().split('T')[0];

  // ── 1. Scam Alert ───────────────────────────────────────────────────────────
  const { data: alert } = await supabase
    .from('scam_alerts')
    .select('id, alert_title_en, alert_title_hi, safe_action, severity, source_url, warning_signs')
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .in('severity', ['high', 'critical'])
    .eq('verified', true)
    .or(`affected_occupations.cs.{${persona}},affected_occupations.cs.{all}`)
    .order('severity', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (alert) {
    const title = locale === 'hi' && alert.alert_title_hi
      ? alert.alert_title_hi
      : alert.alert_title_en;

    cards.push({
      card_type: 'scam_alert',
      card_id: alert.id,
      title,
      body: alert.safe_action,
      cta_label: locale === 'hi' ? 'पूरी जानकारी' : 'Learn more',
      cta_route: `/alert/${alert.id}`,
      safety_critical: true,
      color_token: 'protect',
      icon_emoji: '🛡️',
      source_url: alert.source_url ?? undefined,
    });
  }

  // ── 2. Next Concept ─────────────────────────────────────────────────────────
  // Get user's progress to find next concept due
  const { data: progress } = await supabase
    .from('user_progress')
    .select('concept_id, next_review_date, status')
    .eq('user_id', user.id);

  const seenConceptIds = new Set(
    (progress ?? []).map((p: { concept_id: string }) => p.concept_id)
  );

  const dueConceptId = (progress ?? [])
    .filter((p: { status: string; next_review_date: string }) =>
      p.status !== 'mastered' && p.next_review_date <= today
    )
    .sort((a: { next_review_date: string }, b: { next_review_date: string }) =>
      a.next_review_date.localeCompare(b.next_review_date)
    )[0]?.concept_id ?? null;

  let conceptId = dueConceptId;

  if (!conceptId) {
    // No review due — find next unseen concept in order
    const { data: allConcepts } = await supabase
      .from('concept_nodes')
      .select('id, concept_number')
      .eq('status', 'published')
      .order('concept_number', { ascending: true });

    const nextConcept = (allConcepts ?? []).find(
      (c: { id: string }) => !seenConceptIds.has(c.id)
    );
    conceptId = nextConcept?.id ?? null;
  }

  if (conceptId) {
    // Try to get a matching skin (persona + locale), fall back to generic/en
    const skinQuery = await supabase
      .from('explanation_skins')
      .select('skin_id, one_liner, day1_hook, concept_id')
      .eq('concept_id', conceptId)
      .eq('status', 'published')
      .eq('locale', locale)
      .eq('persona', persona)
      .maybeSingle();

    const skin = skinQuery.data ?? null;

    const { data: concept } = await supabase
      .from('concept_nodes')
      .select('id, canonical_title, canonical_one_liner, pillar, icon_emoji, color_token, estimated_minutes, safety_critical')
      .eq('id', conceptId)
      .maybeSingle();

    if (concept) {
      const conceptTitle = locale === 'hi'
        ? concept.canonical_title  // TODO: add localised title field
        : concept.canonical_title;

      cards.push({
        card_type: 'concept',
        card_id: concept.id,
        title: conceptTitle,
        body: skin?.one_liner ?? concept.canonical_one_liner,
        cta_label: locale === 'hi' ? 'सीखना शुरू करें' : 'Start learning',
        cta_route: `/concept/${concept.id}`,
        pillar: concept.pillar,
        safety_critical: concept.safety_critical,
        icon_emoji: concept.icon_emoji,
        color_token: concept.color_token,
        read_time_minutes: concept.estimated_minutes,
      });
    }
  }

  // ── 3. Weekly Good Read ─────────────────────────────────────────────────────
  const { data: read } = await supabase
    .from('weekly_good_reads')
    .select('id, title_en, title_hi, why_this_matters_en, why_this_matters_hi, source_url, read_time_minutes, source_name')
    .lte('publish_date', today)
    .order('publish_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (read) {
    const readTitle = locale === 'hi' && read.title_hi ? read.title_hi : read.title_en;
    const readBody = locale === 'hi' && read.why_this_matters_hi
      ? read.why_this_matters_hi
      : read.why_this_matters_en;

    cards.push({
      card_type: 'good_read',
      card_id: read.id,
      title: readTitle,
      body: readBody,
      cta_label: locale === 'hi' ? 'पढ़ें' : `Read on ${read.source_name}`,
      cta_route: read.source_url,
      color_token: 'evaluate',
      icon_emoji: '📖',
      source_url: read.source_url,
      read_time_minutes: read.read_time_minutes,
    });
  }

  // ── 4. Prompt Tip ───────────────────────────────────────────────────────────
  const { data: prompt } = await supabase
    .from('prompt_cookbook')
    .select('id, title_en, title_hi, prompt_template_en, prompt_template_hi')
    .eq('status', 'published')
    .or(`target_personas.cs.{${persona}},target_personas.cs.{all}`)
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (prompt) {
    const promptTitle = locale === 'hi' && prompt.title_hi ? prompt.title_hi : prompt.title_en;
    const promptBody = locale === 'hi' && prompt.prompt_template_hi
      ? prompt.prompt_template_hi
      : prompt.prompt_template_en;

    cards.push({
      card_type: 'prompt_tip',
      card_id: prompt.id,
      title: promptTitle,
      body: promptBody,
      cta_label: locale === 'hi' ? 'कोशिश करें' : 'Try this',
      cta_route: `/cookbook/${prompt.id}`,
      color_token: 'use',
      icon_emoji: '✍️',
    });
  }

  return new Response(JSON.stringify({ cards }), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});
