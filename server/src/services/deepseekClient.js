/**
 * deepseekClient.js — thin wrapper around DeepSeek's OpenAI-compatible chat
 * completions API. Per docs/ai-agent-roadmap.md's model strategy: DeepSeek
 * powers agent work (drafting, coding, personalizing); model choice stays a
 * config value here, never hardcoded into an agent's own logic.
 */
const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

export function deepseekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

export async function draftText({ systemPrompt, userPrompt, model = "deepseek-chat", maxTokens = 1200 }) {
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
