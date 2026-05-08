/**
 * Server-side talent ↔ startup post scoring (mirrors client smartTeamMatching intent).
 * Returns an integer 0–100.
 */

function norm(s) {
  return String(s || "")
    .toLowerCase()
    .trim();
}

function asList(v) {
  if (Array.isArray(v)) return v.map((x) => String(x));
  if (v == null || v === "") return [];
  return [String(v)];
}

function tokenOverlap(candidates, targets) {
  const cand = [...new Set(asList(candidates).map(norm).filter(Boolean))];
  const targ = asList(targets).map(norm).filter(Boolean);
  if (!cand.length || !targ.length) return 0;

  let score = 0;
  for (const t of targ) {
    if (!t) continue;
    if (cand.some((c) => c === t)) {
      score += 1;
      continue;
    }
    if (cand.some((c) => c.includes(t) || t.includes(c))) {
      score += 0.55;
    }
  }
  return score;
}

function industryMatch(profileIndustries, postIndustry) {
  const pi = norm(postIndustry);
  if (!pi) return 0;
  for (const ind of asList(profileIndustries)) {
    const n = norm(ind);
    if (!n) continue;
    if (pi.includes(n) || n.includes(pi)) return 1;
  }
  return 0;
}

function experienceWeight(yearsStr) {
  const n = parseInt(String(yearsStr || "").replace(/\D/g, ""), 10);
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n >= 7) return 8;
  if (n >= 4) return 5;
  return 3;
}

/**
 * @param {object|null} profile - TalentProfile lean doc or similar
 * @param {object|null} post - StartupPost lean doc
 */
export function scoreTalentToStartupPost(profile, post) {
  if (!post) return 0;
  const p = profile || {};

  const skills = p.skills || [];
  const prefRoles = p.preferredRoles || [];
  const interests = p.interests || [];
  const industries = p.industryPreferences || [];

  const lookingFor = post.lookingFor || [];
  const tags = post.tags || [];
  const haystack = [...lookingFor, ...tags, post.title, post.description].filter(Boolean);

  let score = 38;

  score += Math.min(34, tokenOverlap(skills, haystack) * 7);
  score += Math.min(18, tokenOverlap(prefRoles, lookingFor) * 9);
  score += Math.min(8, tokenOverlap(interests, tags) * 4);

  if (industryMatch(industries, post.industry)) score += 12;

  score += experienceWeight(p.yearsOfExperience);

  const avail = norm(p.availability || p.availabilityStatus || p.preferredCommitment);
  const comm = norm(post.commitment);
  if (avail && comm) {
    if (avail.includes("full") && comm.includes("full")) score += 4;
    else if (avail.includes("part") && comm.includes("part")) score += 4;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function attachMatchScores(profile, posts) {
  return (posts || []).map((post) => {
    const id = String(post._id || post.id || "");
    const matchScore = scoreTalentToStartupPost(profile, post);
    const lookingFor = Array.isArray(post.lookingFor) ? post.lookingFor : [];
    return {
      ...post,
      id,
      matchScore,
      match: matchScore,
      role: lookingFor[0] || "",
      requirements: lookingFor,
      type: post.stage || "startup",
    };
  });
}
