/**
 * deepseekClient.js — thin wrapper around DeepSeek's OpenAI-compatible chat
 * completions API. Per docs/ai-agent-roadmap.md's model strategy: DeepSeek
 * powers agent work (drafting, coding, personalizing); model choice stays a
 * config value here, never hardcoded into an agent's own logic.
 */
// Model name matches server/src/services/resumeParseService.js's DEFAULT_MODEL
// — that integration is already live/proven in this codebase, so this stays
// consistent rather than guessing at a different DeepSeek model string.
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";
const DEFAULT_MODEL = "deepseek-v4-flash";

export function deepseekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function draftText({ systemPrompt, userPrompt, model = DEFAULT_MODEL, maxTokens = 1200 }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const err = new Error("DEEPSEEK_API_KEY is not set.");
    err.statusCode = 503;
    throw err;
  }
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.3,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek API error (${response.status})`);
  }
  return data?.choices?.[0]?.message?.content || "";
}

/**
 * Multi-turn variant for real conversations (AI Product Manager's chat) —
 * draftText() above is single-shot only (one system + one user message),
 * which can't carry conversation history. `messages` is the prior turns as
 * `{ role: "user" | "assistant", content }`, oldest first; the caller is
 * responsible for trimming history to a reasonable length.
 */
export async function chatCompletion({ systemPrompt, messages, model = DEFAULT_MODEL, maxTokens = 1200 }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const err = new Error("DEEPSEEK_API_KEY is not set.");
    err.statusCode = 503;
    throw err;
  }
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
      max_tokens: maxTokens,
      temperature: 0.4,
    }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek API error (${response.status})`);
  }
  return data?.choices?.[0]?.message?.content || "";
}
