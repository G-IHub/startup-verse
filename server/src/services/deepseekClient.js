/**
 * deepseekClient.js — thin wrapper around DeepSeek's OpenAI-compatible chat
 * completions API. Per docs/ai-agent-roadmap.md's model strategy: DeepSeek
 * powers agent work (drafting, coding, personalizing); model choice stays a
 * config value here, never hardcoded into an agent's own logic.
 */
import { logger } from "../config/logger.js";

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
async function callChatCompletions({ apiKey, model, messages, maxTokens, temperature }) {
  const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data?.error?.message || `DeepSeek API error (${response.status})`);
  }
  return data;
}

export async function chatCompletion({ systemPrompt, messages, model = DEFAULT_MODEL, maxTokens = 1200 }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const err = new Error("DEEPSEEK_API_KEY is not set.");
    err.statusCode = 503;
    throw err;
  }
  const payloadMessages = [{ role: "system", content: systemPrompt }, ...(messages || [])];

  let data = await callChatCompletions({ apiKey, model, messages: payloadMessages, maxTokens, temperature: 0.4 });
  let content = data?.choices?.[0]?.message?.content || "";

  // Real, observed failure: DeepSeek can return a 200 with a genuinely empty
  // message.content — seen live on both a short trailing reply late in a long
  // conversation and on a demanding ask (a goal update plus a detailed
  // multi-task plan in one message). Retried live with the *same* maxTokens
  // and got empty again both times — confirming this isn't a transient
  // blip, it's the model spending the whole budget before emitting visible
  // content (real reasoning-token exhaustion, not an API glitch). Retrying
  // with the same budget just repeats the failure, so the retry escalates
  // it instead — capped well under DeepSeek's real ceiling, not unbounded.
  if (!content.trim()) {
    const retryMaxTokens = Math.min(maxTokens * 2, 8000);
    logger.warn("[deepseekClient] chatCompletion returned empty content, retrying once with a larger budget", {
      finishReason: data?.choices?.[0]?.finish_reason,
      maxTokens,
      retryMaxTokens,
    });
    data = await callChatCompletions({ apiKey, model, messages: payloadMessages, maxTokens: retryMaxTokens, temperature: 0.4 });
    content = data?.choices?.[0]?.message?.content || "";
  }

  return content;
}
