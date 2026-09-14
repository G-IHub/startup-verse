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
// Real bug found live, 2026-09-14, while investigating "chat is taking very
// long": this fetch had no timeout at all, so a genuine network hang (not
// just a slow real generation) blocked a founder's chat reply forever, with
// no error, no log line, nothing — confirmed by a real request that sat
// with zero server activity for 5+ minutes while every other endpoint kept
// responding normally. 90s is well above what a real completion (even with
// the empty-content retry escalation) has ever taken live this session, so
// hitting it means the connection is genuinely stuck, not just working.
const DEEPSEEK_TIMEOUT_MS = 90_000;

export function deepseekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

async function callChatCompletions({ apiKey, model, messages, maxTokens, temperature }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS);
  try {
    // Real bug caught live, right after first shipping this timeout: `fetch()`
    // itself only resolves once real response *headers* arrive — the actual
    // observed stall (confirmed with a direct, isolated test) happens while
    // reading the *body* afterward, which is a real, separate await. Clearing
    // the timer in a `finally` around only the `fetch()` call disarmed it the
    // moment headers arrived, leaving the body-read completely unprotected —
    // exactly the case that mattered. `response.json()` must stay inside the
    // same try, under the same still-armed signal, for the whole real
    // request (headers + body) to actually be covered.
    const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error?.message || `DeepSeek API error (${response.status})`);
    }
    return data;
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(`DeepSeek API call timed out after ${DEEPSEEK_TIMEOUT_MS / 1000}s — likely a hung connection, not just a long generation.`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Real, observed failure, shared by both callers below: DeepSeek can return
 * a 200 with a genuinely empty message.content — seen live both on AI PM's
 * chat (a short trailing reply, and a demanding multi-part ask) and on AI
 * Developer's actual code-writing call (executeGithubOpenPr's draftText,
 * which shipped a real, empty index.html to production with no error at
 * all — the file-writing equivalent is worse than a dropped chat reply,
 * since nothing here would ever surface it to the founder without this
 * check). Retrying with the *same* token budget reproduced the same empty
 * result live, confirming this is the model exhausting its budget before
 * emitting visible content, not a transient blip — so the retry escalates
 * the budget instead of repeating it, capped well under a runaway cost.
 */
async function completeWithEmptyRetry({ apiKey, model, messages, maxTokens, temperature, callerLabel }) {
  let data = await callChatCompletions({ apiKey, model, messages, maxTokens, temperature });
  let content = data?.choices?.[0]?.message?.content || "";

  if (!content.trim()) {
    const retryMaxTokens = Math.min(maxTokens * 2, 8000);
    logger.warn(`[deepseekClient] ${callerLabel} returned empty content, retrying once with a larger budget`, {
      finishReason: data?.choices?.[0]?.finish_reason,
      maxTokens,
      retryMaxTokens,
    });
    data = await callChatCompletions({ apiKey, model, messages, maxTokens: retryMaxTokens, temperature });
    content = data?.choices?.[0]?.message?.content || "";
  }

  return content;
}

export async function draftText({ systemPrompt, userPrompt, model = DEFAULT_MODEL, maxTokens = 1200 }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const err = new Error("DEEPSEEK_API_KEY is not set.");
    err.statusCode = 503;
    throw err;
  }
  return completeWithEmptyRetry({
    apiKey, model, maxTokens, temperature: 0.3, callerLabel: "draftText",
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
  });
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
  return completeWithEmptyRetry({
    apiKey, model, maxTokens, temperature: 0.4, callerLabel: "chatCompletion",
    messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
  });
}
