/**
 * salesMarketingExecutors.js — real AI Sales and AI Marketing action executors.
 *
 * Pattern mirrors agentExecutors.js: each function receives an AgentEvent-like
 * object { founderId, startupId, payload } and returns a plain result object
 * that gets stored in AgentEvent.result. DeepSeek is called via draftText().
 *
 * Every executor builds startup context from the database so the AI output
 * is grounded in the actual startup — not generic templates.
 */
import Startup from "../models/Startup.js";
import AgentEvent from "../models/AgentEvent.js";
import ActionType from "../models/ActionType.js";
import Agent from "../models/Agent.js";
import { draftText } from "./deepseekClient.js";
import { sendFounderEmail } from "./founderEmailService.js";
import { publishPost } from "./linkedinService.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const AI_SALES_SYSTEM_PROMPT = `You are AI Sales — a sharp, results-driven sales agent working exclusively for an early-stage startup founder.

Your job is to do real sales work: analyze who to sell to, write outreach that actually gets replies, qualify leads honestly, build email sequences that convert, and create scripts for real calls.

Rules:
- Output ONLY valid JSON. No markdown fences, no narration, no explanation outside the JSON.
- Base everything on the startup context provided. Never invent company names, industries, or facts not given to you.
- Write outreach and sequences in a human, founder-to-prospect tone — not corporate, not template-y.
- Be specific. Vague output is worthless. Use the startup's actual product, pain points, and industry.
- Think like a top SDR / AE: every message has one clear hook, one clear ask, and a next step.`;

const AI_MARKETING_SYSTEM_PROMPT = `You are AI Marketing — a strategic, creative marketing agent working exclusively for an early-stage startup founder.

Your job is to do real marketing work: analyze the ideal customer, plan campaigns, write social posts that get engagement, create email campaigns, and build content calendars.

Rules:
- Output ONLY valid JSON. No markdown fences, no narration, no explanation outside the JSON.
- Base everything on the startup context provided. Never invent metrics, company names, or facts not given to you.
- Write in the startup's voice — human, direct, founder-led. Not corporate, not generic.
- Be specific. Generic output is worthless. Use the actual product, the actual audience, the actual industry.
- Think like a growth marketer: every piece of content has a clear audience, a clear message, and a clear goal.`;

async function getStartupContext(founderId) {
  const startup = await Startup.findOne({ founderId }).lean();
  if (!startup) return { name: "our startup", description: "", industry: "", stage: "" };
  return {
    name: startup.name || "our startup",
    description: startup.description || "",
    industry: startup.industry || "",
    stage: startup.stage || "",
    website: startup.website || "",
  };
}

async function getLatestLandingPageContent(founderId) {
  try {
    const devAgent = await Agent.findOne({ founderId, agentKey: "dev" }).select("_id");
    if (!devAgent) return null;
    const openPrType = await ActionType.findOne({ agentId: devAgent._id, actionKey: "github_open_pr" }).select("_id");
    if (!openPrType) return null;
    const latestBuild = await AgentEvent.findOne({
      founderId,
      actionTypeId: openPrType._id,
      status: { $in: ["autonomous_completed", "human_completed"] },
      "result.fileContent": { $exists: true, $ne: null },
    }).sort({ createdAt: -1 }).lean();
    const content = latestBuild?.result?.fileContent;
    if (!content) return null;
    return String(content).slice(0, 6000);
  } catch {
    return null;
  }
}

function safeParseJson(raw) {
  const text = String(raw || "").trim();
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const toParse = fenced ? fenced[1].trim() : text;
  return JSON.parse(toParse);
}

export async function executeAnalyzeIcp(event) {
  const { founderId } = event;
  const ctx = await getStartupContext(founderId);
  const pageContent = await getLatestLandingPageContent(founderId);

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}
${pageContent ? `\nLanding page content (excerpt):\n${pageContent}` : ""}

Return a JSON object with this exact shape:
{
  "icp": {
    "who": "one-sentence description of the ideal customer",
    "title": "job title or role of the buyer",
    "companySize": "e.g. 1-10 employees, 50-200 employees",
    "painPoints": ["pain point 1", "pain point 2", "pain point 3"],
    "goals": ["goal 1", "goal 2"],
    "triggers": ["what makes them ready to buy right now"]
  },
  "messagingAngles": [
    { "angle": "angle name", "hook": "one sentence hook for this angle" }
  ],
  "channels": [
    { "channel": "e.g. LinkedIn", "why": "why this channel fits this ICP", "approach": "how to use it" }
  ],
  "positioning": "one paragraph: how ${ctx.name} should be positioned vs alternatives for this ICP"
}`;

  const raw = await draftText({ systemPrompt: AI_SALES_SYSTEM_PROMPT, userPrompt, maxTokens: 1200 });
  return safeParseJson(raw);
}

export async function executeDraftOutreach(event) {
  const { founderId, payload = {} } = event;
  const { channel = "linkedin", targetDescription = "", customContext = "" } = payload;
  const ctx = await getStartupContext(founderId);
  const pageContent = await getLatestLandingPageContent(founderId);

  const channelGuidance = {
    linkedin: "LinkedIn DM: short, conversational, under 150 words. No subject line needed.",
    email: "Cold email: include subject line, under 200 words. Professional but human.",
    instagram: "Instagram DM: very short, casual, 2-3 sentences max.",
    whatsapp: "WhatsApp message: very short, warm, conversational. 2-4 sentences.",
    facebook: "Facebook/Messenger DM: short, friendly, casual tone.",
  }[channel] || "Short outreach message, under 150 words.";

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}
Channel: ${channel}
${targetDescription ? `Target prospect: ${targetDescription}` : ""}
${customContext ? `Additional context: ${customContext}` : ""}
${pageContent ? `\nLanding page (excerpt for product context):\n${pageContent.slice(0, 2000)}` : ""}

Channel format guidance: ${channelGuidance}

Return a JSON object:
{
  "channel": "${channel}",
  "subject": "email subject line (null if not email)",
  "message": "the full outreach message text",
  "hook": "the core pain point or insight this message leads with",
  "cta": "the specific call to action at the end",
  "followUp1": "follow-up message to send 3 days later if no reply",
  "followUp2": "follow-up message to send 7 days later if still no reply",
  "sendingTip": "one tactical tip for sending this on ${channel}"
}`;

  const raw = await draftText({ systemPrompt: AI_SALES_SYSTEM_PROMPT, userPrompt, maxTokens: 1000 });
  return safeParseJson(raw);
}

export async function executeDraftEmailSequence(event) {
  const { founderId, payload = {} } = event;
  const { audience = "cold prospects", goal = "cold_outreach", sequenceName = "" } = payload;
  const ctx = await getStartupContext(founderId);

  const goalLabel = {
    cold_outreach: "Book a discovery call",
    nurture: "Move warm leads toward purchase",
    re_engage: "Re-engage cold/lost leads",
  }[goal] || goal;

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}

Sequence goal: ${goalLabel}
Target audience: ${audience}
${sequenceName ? `Sequence name: ${sequenceName}` : ""}

Return a JSON object:
{
  "sequenceName": "name for this email sequence",
  "audience": "${audience}",
  "goal": "${goal}",
  "emails": [
    {
      "emailNumber": 1,
      "dayOffset": 0,
      "purpose": "what this email accomplishes",
      "subject": "email subject line",
      "body": "full email body text",
      "cta": "specific call to action"
    }
  ]
}

Include 3-5 emails spaced logically (day 0, 3, 7, 14, etc.). Each email should be distinct and move the prospect forward.`;

  const raw = await draftText({ systemPrompt: AI_SALES_SYSTEM_PROMPT, userPrompt, maxTokens: 2000 });
  return safeParseJson(raw);
}

export async function executeQualifyLead(event) {
  const { founderId, payload = {} } = event;
  const { conversationText = "", leadDetails = "" } = payload;
  const ctx = await getStartupContext(founderId);

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}

${conversationText ? `Conversation / message to analyze:\n${conversationText}` : ""}
${leadDetails ? `Lead details:\n${leadDetails}` : ""}

Qualify this lead for ${ctx.name}. Return a JSON object:
{
  "score": 85,
  "tier": "hot",
  "buyerIntent": "high / medium / low",
  "budgetSignals": "what signals suggest budget availability or lack thereof",
  "authoritySignals": "are they likely the decision-maker?",
  "needSignals": "how strong is the need/pain signal?",
  "timingSignals": "urgency signals",
  "reasoning": "2-3 sentence explanation of the score and tier",
  "redFlags": ["any red flags found"],
  "nextAction": "specific recommended next step",
  "draftReply": "a ready-to-send reply to this prospect based on the conversation"
}

Tier: hot (score 75+), warm (50-74), cold (below 50).`;

  const raw = await draftText({ systemPrompt: AI_SALES_SYSTEM_PROMPT, userPrompt, maxTokens: 1000 });
  return safeParseJson(raw);
}

export async function executeCreateSalesScript(event) {
  const { founderId, payload = {} } = event;
  const { callType = "discovery" } = payload;
  const ctx = await getStartupContext(founderId);
  const pageContent = await getLatestLandingPageContent(founderId);

  const callLabel = {
    discovery: "Discovery call",
    demo: "Product demo call",
    closing: "Closing call",
  }[callType] || callType;

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}
${pageContent ? `\nProduct landing page (excerpt):\n${pageContent.slice(0, 2000)}` : ""}

Create a ${callLabel} script for ${ctx.name}. Return a JSON object:
{
  "callType": "${callType}",
  "callLabel": "${callLabel}",
  "estimatedDuration": "e.g. 20-30 minutes",
  "intro": "opening script — how to start the call warmly and set the agenda",
  "discoveryQuestions": [
    { "question": "the question", "purpose": "why you ask this" }
  ],
  "pitchPoints": [
    { "point": "key value point", "evidence": "how to back it up" }
  ],
  "objectionHandling": [
    { "objection": "common objection", "response": "how to handle it" }
  ],
  "closingAsk": "specific ask at the end of the call",
  "followUpTemplate": "what to send within 24 hours after the call"
}`;

  const raw = await draftText({ systemPrompt: AI_SALES_SYSTEM_PROMPT, userPrompt, maxTokens: 1500 });
  return safeParseJson(raw);
}

export async function executeCreateSocialPost(event) {
  const { founderId, payload = {} } = event;
  const { platform = "linkedin", topic = "", angle = "" } = payload;
  const ctx = await getStartupContext(founderId);
  const pageContent = await getLatestLandingPageContent(founderId);

  const platformGuidance = {
    linkedin: "LinkedIn post: thought leadership, founder story, traction update, or insight. 150-300 words. Use line breaks for readability. End with a question or CTA.",
    instagram: "Instagram caption: visual storytelling, punchy opener, 80-150 words, 5-10 relevant hashtags.",
    twitter: "Tweet/X: punchy, opinionated, under 280 chars for the hook. Add 2-3 thread posts if needed.",
    facebook: "Facebook post: conversational, community-building, 100-200 words.",
    tiktok: "TikTok script: hook in first 2 seconds, storytelling format, 30-60 second video script.",
  }[platform] || "Social post: engaging, 100-200 words.";

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}
Platform: ${platform}
${topic ? `Post topic: ${topic}` : ""}
${angle ? `Angle / perspective: ${angle}` : ""}
${pageContent ? `\nProduct context (landing page excerpt):\n${pageContent.slice(0, 1500)}` : ""}

Platform guidance: ${platformGuidance}

Return a JSON object:
{
  "platform": "${platform}",
  "topic": "what this post is about",
  "caption": "the full post text ready to publish",
  "hook": "the first line / hook that stops the scroll",
  "hashtags": ["hashtag1", "hashtag2"],
  "imagePrompt": "description of an image that would pair with this post",
  "bestPostTime": "best day and time to post on ${platform}",
  "engagementTip": "one tip to maximize engagement on this specific post"
}`;

  const raw = await draftText({ systemPrompt: AI_MARKETING_SYSTEM_PROMPT, userPrompt, maxTokens: 1000 });
  return safeParseJson(raw);
}

export async function executePlanCampaign(event) {
  const { founderId, payload = {} } = event;
  const { goal = "generate_leads", timeline = "4 weeks", budget = "" } = payload;
  const ctx = await getStartupContext(founderId);
  const pageContent = await getLatestLandingPageContent(founderId);

  const goalLabel = {
    generate_leads: "Generate qualified leads",
    brand_awareness: "Build brand awareness",
    launch: "Product launch / announcement",
    retention: "Customer retention / upsell",
  }[goal] || goal;

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}
${pageContent ? `\nLanding page (excerpt):\n${pageContent.slice(0, 2000)}` : ""}

Campaign goal: ${goalLabel}
Timeline: ${timeline}
${budget ? `Budget context: ${budget}` : "Budget: bootstrap / zero or near-zero paid budget"}

Create a full marketing campaign plan. Return a JSON object:
{
  "campaignTitle": "name for this campaign",
  "goal": "${goal}",
  "goalLabel": "${goalLabel}",
  "targetAudience": "who this campaign is targeting",
  "coreMessage": "the single core message this entire campaign communicates",
  "channels": [
    {
      "channel": "e.g. LinkedIn organic",
      "role": "what this channel does in the campaign",
      "contentTypes": ["post", "article"],
      "frequency": "e.g. 3x per week",
      "budget": "e.g. organic / free"
    }
  ],
  "weeklyPlan": [
    {
      "week": 1,
      "theme": "week theme",
      "actions": ["action 1", "action 2", "action 3"]
    }
  ],
  "kpis": [
    { "metric": "metric name", "target": "e.g. 50 new followers", "how": "how to measure it" }
  ],
  "launchChecklist": ["thing to do before launching"]
}`;

  const raw = await draftText({ systemPrompt: AI_MARKETING_SYSTEM_PROMPT, userPrompt, maxTokens: 2000 });
  return safeParseJson(raw);
}

export async function executeCreateContentCalendar(event) {
  const { founderId, payload = {} } = event;
  const { duration = "2 weeks", platforms = ["linkedin", "instagram"] } = payload;
  const ctx = await getStartupContext(founderId);

  const platformList = Array.isArray(platforms) ? platforms.join(", ") : String(platforms);
  const platformsJson = JSON.stringify(Array.isArray(platforms) ? platforms : [platforms]);

  const userPrompt = `Startup context:
Name: ${ctx.name}
Description: ${ctx.description}
Industry: ${ctx.industry}
Stage: ${ctx.stage}

Create a content calendar for ${duration} across: ${platformList}

Return a JSON object:
{
  "duration": "${duration}",
  "platforms": ${platformsJson},
  "theme": "overall theme for this calendar period",
  "calendar": [
    {
      "day": "Monday Week 1",
      "platform": "linkedin",
      "contentType": "e.g. founder story, tip, traction update, case study",
      "topic": "specific topic for this post",
      "hook": "opening line / scroll-stopping hook",
      "caption": "full post caption ready to publish",
      "hashtags": ["hashtag1"]
    }
  ],
  "contentPillars": [
    { "pillar": "pillar name", "description": "what content falls under this", "percentage": "30%" }
  ],
  "tips": ["scheduling tip", "engagement tip"]
}

Include 2 posts per day across active platforms in the calendar, spaced across the ${duration} period.`;

  const raw = await draftText({ systemPrompt: AI_MARKETING_SYSTEM_PROMPT, userPrompt, maxTokens: 2500 });
  return safeParseJson(raw);
}

/**
 * Real external send, 2026-09-18 — every executor above only ever drafts;
 * this is the one action that actually reaches a real person. Requires a
 * real, founder-supplied recipient — AI PM's own system prompt is told to
 * never invent one, and this is the structural backstop for that rule, the
 * same "prompt steer + real guard" pattern used throughout this codebase:
 * a bare format check can't confirm the address is a real, wanted contact,
 * but it does reject the more common failure (a hallucinated or malformed
 * address) before it ever reaches a live send call.
 */
export async function executeSendOutreachEmail(event) {
  const { founderId, payload = {} } = event;
  const { recipientEmail, recipientName = "", subject, body } = payload;

  if (!recipientEmail || !EMAIL_RE.test(String(recipientEmail).trim())) {
    throw new Error("send_outreach_email requires a real, valid recipientEmail.");
  }
  if (!subject || !body) {
    throw new Error("send_outreach_email requires both subject and body.");
  }

  const record = await sendFounderEmail(founderId, {
    recipientEmail: String(recipientEmail).trim(),
    recipientName: String(recipientName || "").trim(),
    subject: String(subject),
    htmlBody: String(body),
  });

  return {
    sent: record.status === "sent",
    recipientEmail: record.recipientEmail,
    subject: record.subject,
    sentAt: record.sentAt || null,
  };
}

/**
 * Real external publish, 2026-09-18 — wires to the already-existing, already-
 * working linkedinService.publishPost(founderId, text) (real REST call to
 * LinkedIn's own API via the founder's connected OAuth token), previously
 * built but never called from any executor. ask_first by default (see
 * coreAgentSeeds.js) — this posts to the founder's real public LinkedIn page
 * and can't be quietly undone, so it always needs a real approval first,
 * same reasoning as executeSendOutreachEmail above.
 */
export async function executePublishLinkedinPost(event) {
  const { founderId, payload = {} } = event;
  const text = String(payload.text || "").trim();
  if (!text) {
    throw new Error("publish_linkedin_post requires non-empty text.");
  }
  const { postId } = await publishPost(founderId, text);
  return { published: true, postId: postId || null, text };
}

export const salesMarketingExecutors = {
  analyze_icp: executeAnalyzeIcp,
  draft_outreach: executeDraftOutreach,
  draft_email_sequence: executeDraftEmailSequence,
  qualify_lead: executeQualifyLead,
  create_sales_script: executeCreateSalesScript,
  create_social_post: executeCreateSocialPost,
  plan_campaign: executePlanCampaign,
  create_content_calendar: executeCreateContentCalendar,
  send_outreach_email: executeSendOutreachEmail,
  publish_linkedin_post: executePublishLinkedinPost,
};
