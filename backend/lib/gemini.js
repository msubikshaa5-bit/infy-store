const BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const aiConfigured = () => Boolean(process.env.GEMINI_API_KEY);

// Sends one prompt to Gemini and returns the text of the answer
export async function askGemini({ system, prompt, json = false }) {
  if (!process.env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  // Give up after 15 seconds instead of making the customer wait forever
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(`${BASE}/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': process.env.GEMINI_API_KEY, // key goes in a header, not the URL
      },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 2048,
          ...(json ? { responseMimeType: 'application/json' } : {}),
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Gemini error ${res.status}: ${detail.slice(0, 200)}`);
    }

    const data = await res.json();
    const parts = data.candidates?.[0]?.content?.parts ?? [];
    const text = parts.filter((p) => !p.thought).map((p) => p.text ?? '').join('').trim();
    if (!text) throw new Error('Gemini returned an empty answer');
    return text;
  } finally {
    clearTimeout(timer);
  }
}