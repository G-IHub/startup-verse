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
// responding normally. 90s was well above what a real completion took at
// the token budgets that existed then.
//
// Real follow-up bug, 2026-09-15: once file drafts started escalating to
// much larger budgets (see completeWithRetry's 4000->32000 loop below), a
// fixed 90s became exactly the same kind of artificial ceiling the user
// was pushing back on — a genuinely large, real, still-in-progress
// generation could get aborted for producing a lot of real content, not
// for actually being stuck. Confirmed live: an isolated 32000-token call
// legitimately took ~75s to complete successfully — close enough to 90s
// that a real request could get killed by this timer alone. The timeout
// now scales with the requested budget instead of staying fixed, with the
// original 90s kept as a floor so small requests (a short chat reply, a
// typical file draft) keep the exact same "stuck vs slow" protection as
// before.
const DEEPSEEK_TIMEOUT_MS = 90_000;
const DEEPSEEK_TIMEOUT_MS_PER_TOKEN = 6;

export function deepseekConfigured() {
  return Boolean(process.env.DEEPSEEK_API_KEY);
}

async function callChatCompletions({ apiKey, model, messages, maxTokens, temperature }) {
  const timeoutMs = Math.max(DEEPSEEK_TIMEOUT_MS, maxTokens * DEEPSEEK_TIMEOUT_MS_PER_TOKEN);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
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
      throw new Error(`DeepSeek API call timed out after ${timeoutMs / 1000}s (maxTokens: ${maxTokens}) — likely a hung connection, not just a long generation.`);
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
 * check).
 *
 * Real bug found live, 2026-09-15: the original version only ever retried
 * ONCE, and only on a fully EMPTY response — but a real founder's repeated
 * "rebuild it bigger/better/more pages" asks kept failing with a
 * *non-empty but truncated* draft (real partial HTML, no closing </html>),
 * a case the single-retry logic never even checked for, so a genuinely
 * recoverable failure kept failing the exact same way every single time.
 *
 * Escalated to a real loop, not a fixed one-shot retry, after the user
 * asked directly why a big real job should ever be stopped by a hardcoded
 * ceiling instead of the system trying harder on its own. It now keeps
 * doubling the budget and retrying — real backoff, not a guess — until
 * either a real, complete response comes back or `maxRetryTokens` (an
 * honest, evidence-based ceiling, not an arbitrary one) is reached.
 * `finish_reason: "length"` is the real, reliable signal DeepSeek gives
 * for "truncated by the token cap," used regardless of whether any visible
 * content came out before the cutoff — confirmed live: at 4000 tokens,
 * 100% of the budget can go to this model's own invisible reasoning with
 * zero visible output; at 16000, a real demanding page was still cut off
 * with only ~5K real characters written; a full escalation to 32000 was
 * the first budget that reliably produced a genuinely complete file for
 * the most demanding real case tested — that's why file drafts now escalate
 * that far by default (see agentExecutors.js) instead of stopping at 8000.
 * The ceiling still exists, deliberately: an unbounded retry loop has no
 * natural stopping point and would let one runaway request burn unlimited
 * real cost and time — 32000 is a real, tested number, not an arbitrary
 * guess at "big enough."
 */
async function completeWithRetry({ apiKey, model, messages, maxTokens, temperature, callerLabel, maxRetryTokens = 8000 }) {
  let currentMaxTokens = maxTokens;
  let attempt = 1;

  for (;;) {
    // eslint-disable-next-line no-await-in-loop -- each escalation depends on the last attempt's real result
    const data = await callChatCompletions({ apiKey, model, messages, maxTokens: currentMaxTokens, temperature });
    const content = data?.choices?.[0]?.message?.content || "";
    const finishReason = data?.choices?.[0]?.finish_reason;
    const truncated = !content.trim() || finishReason === "length";

    if (!truncated || currentMaxTokens >= maxRetryTokens) {
      if (truncated) {
        logger.warn(`[deepseekClient] ${callerLabel} still truncated after reaching the real ceiling`, { attempt, finishReason, maxRetryTokens });
      }
      return content;
    }

    const nextMaxTokens = Math.min(currentMaxTokens * 2, maxRetryTokens);
    logger.warn(`[deepseekClient] ${callerLabel} ${content.trim() ? "was truncated" : "returned empty content"} (attempt ${attempt}), escalating budget`, {
      finishReason, maxTokens: currentMaxTokens, nextMaxTokens,
    });
    currentMaxTokens = nextMaxTokens;
    attempt += 1;
  }
}

export async function draftText({ systemPrompt, userPrompt, model = DEFAULT_MODEL, maxTokens = 1200, maxRetryTokens }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    const err = new Error("DEEPSEEK_API_KEY is not set.");
    err.statusCode = 503;
    throw err;
  }
  return completeWithRetry({
    apiKey, model, maxTokens, temperature: 0.3, callerLabel: "draftText",
    messages: [{ role: "system", content: systemPrompt }, { role: "user", content: userPrompt }],
    ...(maxRetryTokens ? { maxRetryTokens } : {}),
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
  return completeWithRetry({
    apiKey, model, maxTokens, temperature: 0.4, callerLabel: "chatCompletion",
    messages: [{ role: "system", content: systemPrompt }, ...(messages || [])],
  });
}
