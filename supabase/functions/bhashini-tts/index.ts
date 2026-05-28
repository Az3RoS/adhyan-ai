/**
 * bhashini-tts
 *
 * Converts concept text to speech via the Bhashini AI4Bharat API.
 * Returns a base64-encoded audio string (wav/mp3) the client can play.
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
 *   - Bhashini API unavailable → 503 with { error: 'tts_unavailable' }
 *   - Text too long            → 400 with { error: 'text_too_long' }
 *   - Auth missing             → 401
 *
 * Bhashini docs: https://bhashini.gov.in/ulca/model/api-integration
 * We use the ULCA compliant pipeline inference endpoint.
 */

import { corsHeaders, handleCors } from '../_shared/cors.ts';

// ── Bhashini language + voice config ────────────────────────────────────────

const LANG_MAP: Record<string, string> = {
  hi: 'hi',
  bn: 'bn',
  en: 'en',
};

// Bhashini model IDs for TTS — update these when new models are available
// Current: AI4Bharat IndicTTS (best quality for Indian languages)
const TTS_MODEL_IDS: Record<string, string> = {
  hi: '64392947daac500b55c543cd',  // IndicTTS Hindi female
  bn: '645f0f4cef23b8d83dde21cb',  // IndicTTS Bengali female
  en: '6453c67ce2f0db0f45782285',  // IndicTTS English-Indian female
};

const SPEED_MAP: Record<string, number> = {
  slow: 0.8,
  normal: 1.0,
  fast: 1.2,
};

// ── Request payload ──────────────────────────────────────────────────────────

interface TTSRequest {
  text: string;
  source_lang: string;
  voice_speed?: string;
  concept_id?: string;
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const corsResp = handleCors(req);
  if (corsResp) return corsResp;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // Auth — JWT required
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

  // Enforce character limit (Bhashini has a ~500 char limit per request)
  if (text.length > 500) {
    return new Response(JSON.stringify({ error: 'text_too_long', max: 500 }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const lang      = LANG_MAP[source_lang] ?? 'hi';
  const modelId   = TTS_MODEL_IDS[lang]   ?? TTS_MODEL_IDS['hi'];
  const speedRate = SPEED_MAP[voice_speed] ?? 1.0;

  // ── Bhashini ULCA pipeline request ──────────────────────────────────────────

  const bhashiniApiKey = Deno.env.get('BHASHINI_API_KEY');
  const bhashiniUserId = Deno.env.get('BHASHINI_USER_ID');

  if (!bhashiniApiKey || !bhashiniUserId) {
    console.error('[bhashini-tts] Missing BHASHINI_API_KEY or BHASHINI_USER_ID env vars');
    return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const pipelineReq = {
      pipelineTasks: [
        {
          taskType: 'tts',
          config: {
            language: { sourceLanguage: lang },
            serviceId: modelId,
            gender: 'female',
            samplingRate: 8000,
          },
        },
      ],
      inputData: {
        input: [{ source: text }],
        audio: [{ audioContent: '' }],
      },
    };

    const resp = await fetch(
      'https://dhruva-api.bhashini.gov.in/services/inference/pipeline',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': bhashiniApiKey,
          'userID': bhashiniUserId,
          'ulcaApiKey': bhashiniApiKey,
        },
        body: JSON.stringify(pipelineReq),
      }
    );

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[bhashini-tts] API error:', resp.status, errText);
      return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const result = await resp.json();
    const audioContent: string =
      result?.pipelineResponse?.[0]?.audio?.[0]?.audioContent ?? '';

    if (!audioContent) {
      console.error('[bhashini-tts] Empty audioContent in response');
      return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Rough duration estimate: ~12 chars/second for normal speed Indian speech
    const duration_hint_s = Math.ceil(text.length / (12 * speedRate));

    return new Response(
      JSON.stringify({
        audio_base64: audioContent,
        mime_type: 'audio/wav',
        duration_hint_s,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('[bhashini-tts] Fetch exception:', err);
    return new Response(JSON.stringify({ error: 'tts_unavailable' }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
