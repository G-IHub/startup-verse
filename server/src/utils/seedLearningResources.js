/**
 * One-time seed: inserts all hardcoded stage learning videos into the Resource collection.
 * Run with: node --experimental-vm-modules src/utils/seedLearningResources.js
 * Or call seedLearningResources() from a migration route / startup hook.
 */
import Resource from "../models/Resource.js";

const STAGE_VIDEOS = [
  // Stage 1 — Idea & Validation
  { stageId: 1, title: "How to Get and Evaluate Startup Ideas", source: "Y Combinator", duration: "15:49", youtubeId: "Th8JoIan4dg", description: "Learn how to generate and validate startup ideas from YC partners.", recommended: true },
  { stageId: 1, title: "How to Talk to Users", source: "Y Combinator", duration: "19:05", youtubeId: "MT4Ig2uqjTc", description: "Essential techniques for conducting effective user interviews and getting honest feedback." },
  { stageId: 1, title: "How to Validate Your Startup Idea", source: "Y Combinator", duration: "26:19", youtubeId: "DOtCl5PU8F0", description: "Learn how to validate your startup idea before building your product." },

  // Stage 2 — Company Formation
  { stageId: 2, title: "How to Start a Startup: Legal and Accounting Basics", source: "Y Combinator", duration: "54:23", youtubeId: "EHzvmyMJEK4", description: "Legal basics every founder needs to know when forming a company.", recommended: true },
  { stageId: 2, title: "Startup Legal Mechanics", source: "Y Combinator", duration: "20:11", youtubeId: "SBjy7O1WxEw", description: "Understanding legal structure and incorporation for startups." },

  // Stage 3 — Team Building
  { stageId: 3, title: "How to Find the Right Co-Founder", source: "Y Combinator", duration: "14:23", youtubeId: "RYJx22ZDFjs", description: "Learn what makes a great co-founder and how to find them.", recommended: true },
  { stageId: 3, title: "Splitting Equity Among Co-Founders", source: "Y Combinator", duration: "16:47", youtubeId: "vIEkRML-CQw", description: "How to fairly split equity and avoid common mistakes." },
  { stageId: 3, title: "How to Hire", source: "Y Combinator", duration: "34:46", youtubeId: "LuR7K0k1Tgc", description: "Strategies for hiring your first employees and building your team." },

  // Stage 4 — MVP Development
  { stageId: 4, title: "How to Build an MVP", source: "Y Combinator", duration: "23:45", youtubeId: "1hHMwLxN6EM", description: "Learn how to build your first product version quickly and efficiently.", recommended: true },
  { stageId: 4, title: "How to Launch (Again and Again)", source: "Y Combinator", duration: "18:34", youtubeId: "AlTeW4H7D_Q", description: "Strategies for successfully launching your MVP and getting initial users." },
  { stageId: 4, title: "Building Product", source: "Y Combinator", duration: "48:16", youtubeId: "C27RVio2rOs", description: "Best practices for building products that users actually want." },

  // Stage 5 — Go to Market
  { stageId: 5, title: "How to Get Your First Customers", source: "Y Combinator", duration: "21:15", youtubeId: "hyYwIMhLjBM", description: "Proven strategies for acquiring your first 10-100 customers.", recommended: true },
  { stageId: 5, title: "Growth for Startups", source: "Y Combinator", duration: "17:56", youtubeId: "raIUQP71SBU", description: "How to think about growth and find channels that work for your startup." },
  { stageId: 5, title: "How to Get Users and Grow", source: "Y Combinator", duration: "51:14", youtubeId: "T9ikpoF2GH0", description: "Understanding customer acquisition and growth strategies for early-stage startups." },

  // Stage 6 — Scaling & Fundraising
  { stageId: 6, title: "How to Raise a Seed Round", source: "Y Combinator", duration: "26:18", youtubeId: "KQJ6zsNCA-4", description: "Complete guide to raising your first institutional funding round.", recommended: true },
  { stageId: 6, title: "How to Pitch Your Startup", source: "Y Combinator", duration: "15:52", youtubeId: "17XZGUX_9iM", description: "Crafting and delivering a compelling investor pitch." },
  { stageId: 6, title: "Scaling Your Startup", source: "Y Combinator", duration: "42:08", youtubeId: "r-98YRAF1dY", description: "Strategies for scaling your team, operations, and growth." },
];

export async function seedLearningResources() {
  let inserted = 0;
  let skipped = 0;

  for (const video of STAGE_VIDEOS) {
    const url = `https://youtube.com/watch?v=${video.youtubeId}`;
    const existing = await Resource.findOne({ youtubeId: video.youtubeId });
    if (existing) {
      skipped++;
      continue;
    }
    await Resource.create({
      title: video.title,
      description: video.description || "",
      url,
      type: "video",
      stageId: video.stageId,
      youtubeId: video.youtubeId,
      source: video.source,
      duration: video.duration,
      recommended: video.recommended === true,
      tags: ["yc", `stage-${video.stageId}`],
    });
    inserted++;
  }

  return { inserted, skipped, total: STAGE_VIDEOS.length };
}
