/**
 * check-scam
 *
 * Takes a suspicious message (text or URL) and returns a scam risk analysis.
 * Uses Gemini Flash 1.5 as primary; Groq (llama-3-8b) as fallback.
 *
 * Request body:
 *   message     — the suspicious text or URL to analyse
 *   locale      — 'en' | 'hi' | 'bn'  (response language)
 *   context?    — extra context ("this was a WhatsApp message from unknown number")
 *
 * Response:
 *   {
 *     risk:       'low' | 'medium' | 'high' | 'critical'
 *     verdict:    string   — 1-line plain-language verdict
 *     signs:      string[] — red flags found (max 4)
 *     safe_action: string  — what to do next
 *     confidence: number   — 0–1
 *   }
 *
 * Non-negotiables:
 *   - Response is always in plain language — no jargon
 *   - Safe action is always specific and actionable
 *   - We never say "AI said this is a scam" — we say "This looks like a scam"
 *   - Max 120 words total across all fields
 */

import { corsHeaders, handleCors } from '../_shared/cors.ts';

// ── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(message: string, locale: string, context?: string): string {
  const langInstruction =
    locale === 'hi' ? 'Respond in simple Hindi (not English).' :
    locale === 'bn' ? 'Respond in simple Bengali (not English).' :
    'Respond in simple English.';

  return `You are a scam detection assistant for people in India who may be unfamiliar with digital fraud. Analyse the following message for signs of fraud.

${langInstruction}

Message to analyse:
"""
${message}
"""
${context ? `\nAdditional context: ${context}` : ''}

Respond ONLY with valid JSON in this exact format — no markdown, no extra text:
{
  "risk": "low" | "medium" | "high" | "critical",
  "verdict": "one sentence plain-language verdict (max 20 words)",
  "signs": ["red flag 1", "red flag 2"],
  "safe_action": "specific actionable step (max 25 words)",
  "confidence": 0.0 to 1.0
}

Rules:
- Never use the words: LLM, AI, model, hallucination, token
- Signs must be concrete (not vague like "suspicious"). Max 4 signs.
- Safe action must be specific: "Call your bank at the number on your debit card" not "Contact your bank"
- If the message appears safe, still give safe_action: "This looks safe, but verify with a trusted person before acting"
- risk = "critical" only if there is immediate financial danger
`;
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

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  let body: { message: string; locale?: string; context?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const { message, locale = 'en', context } = body;

  if (!message?.trim()) {
    return new Response(JSON.stringify({ error: 'message is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (message.length > 2000) {
    return new Response(JSON.stringify({ error: 'message_too_long', max: 2000 }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const prompt = buildPrompt(message, locale, context);

  // ── Try Gemini Flash first ──────────────────────────────────────────────────

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (geminiKey) {
    try {
      const geminiResp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.1,
              maxOutputTokens: 400,
              responseMimeType: 'application/json',
            },
          }),
        }
      );

      if (geminiResp.ok) {
        const geminiData = await geminiResp.json();
        const rawText: string =
          geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

        const parsed = parseScamResponse(rawText);
        if (parsed) {
          return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.warn('[check-scam] Gemini failed, trying Groq fallback:', e);
    }
  }

  // ── Groq fallback ───────────────────────────────────────────────────────────

  const groqKey = Deno.env.get('GROQ_API_KEY');
  if (groqKey) {
    try {
      const groqResp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 400,
          response_format: { type: 'json_object' },
        }),
      });

      if (groqResp.ok) {
        const groqData = await groqResp.json();
        const rawText: string = groqData?.choices?.[0]?.message?.content ?? '';
        const parsed = parseScamResponse(rawText);
        if (parsed) {
          return new Response(JSON.stringify(parsed), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } catch (e) {
      console.warn('[check-scam] Groq also failed:', e);
    }
  }

  // ── Both failed ─────────────────────────────────────────────────────────────

  const fallback = {
    risk: 'medium' as const,
    verdict: locale === 'hi'
      ? 'हम अभी जाँच नहीं कर सके। किसी भरोसेमंद व्यक्ति से पूछें।'
      : 'Could not analyse right now. Please ask a trusted person.',
    signs: [],
    safe_action: locale === 'hi'
      ? 'इस संदेश पर कोई कार्रवाई न करें जब तक किसी भरोसेमंद व्यक्ति से जाँच न कर लें।'
      : 'Do not act on this message until you verify with a trusted person.',
    confidence: 0,
  };

  return new Response(JSON.stringify(fallback), {
    status: 200,  // 200 even for fallback — client gets a usable response
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
});

// ── JSON response parser ──────────────────────────────────────────────────────

function parseScamResponse(raw: string): {
  risk: string; verdict: string; signs: string[];
  safe_action: string; confidence: number;
} | null {
  try {
    // Strip any markdown code fences if present
    const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const obj = JSON.parse(clean);

    // Validate required fields
    if (!obj.risk || !obj.verdict || !obj.safe_action) return null;
    if (!['low', 'medium', 'high', 'critical'].includes(obj.risk)) return null;

    return {
      risk:        obj.risk,
      verdict:     String(obj.verdict).slice(0, 150),
      signs:       Array.isArray(obj.signs)
        ? obj.signs.slice(0, 4).map((s: unknown) => String(s))
        : [],
      safe_action: String(obj.safe_action).slice(0, 200),
      confidence:  typeof obj.confidence === 'number'
        ? Math.max(0, Math.min(1, obj.confidence))
        : 0.5,
    };
  } catch {
    return null;
  }
}
