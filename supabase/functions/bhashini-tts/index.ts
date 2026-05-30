/**
 * tts (was bhashini-tts)
 *
 * Converts concept text to speech via Sarvam AI TTS API.
 * Drop-in replacement for the Bhashini integration — same request/response
 * contract, so no client-side changes are needed.
 *
 * Request body:
 *   text          — plain text to synthesise (max 500 chars)
 *   source_lang   — 'hi' | 'bn' | 'en'
 *   voice_speed   — 'slow' | 'normal' | 'fast'  (optional, default 'normal')
 *   concept_id    — for logging only
 *
 * Response:
 *   { audio_base64: string, mime_type: string, duration_hint_s: number }
 *
 * Failure modes:
 *   - Sarvam API unavailable → 503 with { error: 'tts_unavailable' }
 *   - Text too long          → 400 with { error: 'text_too_long' }
 *   - Auth missing           → 401
 *
 * Sarvam AI docs: https://docs.sarvam.ai/api-reference-docs/text-to-speech
 * Secret required: SARVAM_API_KEY
 */

import { corsHeaders, handleCors } from '../_shared/cors.ts';

// ── Language + voice config ──────────────────────────────────────────────────

// Sarvam BCP-47 language codes
const LANG_CODE: Record<string, string> = {
  hi: 'hi-IN',
  bn: 'bn-IN',
  en: 'en-IN',
};

// Best natural-sounding female speakers per language
const SPEAKER: Record<string, string> = {
  hi: 'meera',    // warm Hindi female
  bn: 'diya',     // Bengali female
  en: 'maya',     // Indian-English female
};

const PACE: Record<string, number> = {
  slow:   0.8,
  normal: 1.0,
  fast:   1.25,
};

// ── Types ────────────────────────────────────────────────────────────────────

interface TTSRequest {
  text: string;
  source_lang: string;
  voice_speed?: string;
  concept_id?: string;
}

// ── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: TTSRequest;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { text, source_lang, voice_speed = 'normal' } = body;

  if (!text || !source_lang) {
    return new Response(JSON.stringify({ error: 'text and source_lang are required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (text.length > 500) {
    return new Response(JSON.stringify({ error: 'text_too_long', max: 500 }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const sarvamKey = Deno.env.get('SARVAM_API_KEY');
  if (!sarvamKey) {
    console.error('[tts] Missing SARVAM_API_KEY env var');
    return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const lang    = LANG_CODE[source_lang] ?? 'hi-IN';
  const speaker = SPEAKER[source_lang]   ?? 'meera';
  const pace    = PACE[voice_speed]      ?? 1.0;

  try {
    const resp = await fetch('https://api.sarvam.ai/text-to-speech', {
      method: 'POST',
      headers: {
        'Content-Type':       'application/json',
        'api-subscription-key': sarvamKey,
      },
      body: JSON.stringify({
        inputs:                   [text],
        target_language_code:     lang,
        speaker,
        model:                    'bulbul:v1',
        pitch:                    0,
        pace,
        loudness:                 1.5,
        speech_sample_rate:       8000,
        enable_preprocessing:     true,
        eng_interpolation_wt:     0,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[tts] Sarvam API error:', resp.status, errText);
      return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await resp.json();
    const audioBase64: string = result?.audios?.[0] ?? '';

    if (!audioBase64) {
      console.error('[tts] Empty audio in Sarvam response');
      return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ~12 chars/second for normal Indian speech pace
    const duration_hint_s = Math.ceil(text.length / (12 * pace));

    return new Response(
      JSON.stringify({
        audio_base64: audioBase64,
        mime_type:    'audio/wav',
        duration_hint_s,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[tts] Fetch exception:', err);
    return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
