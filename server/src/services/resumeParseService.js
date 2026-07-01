import OpenAI from "openai";
import {
  TALENT_SKILL_OPTIONS,
  TALENT_SKILL_OPTION_SET,
} from "../domain/talentSkillOptions.js";

const DEFAULT_MODEL = "gpt-4o-mini";

const LINKEDIN_RE =
  /https?:\/\/(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+\/?/gi;
const GITHUB_RE =
  /https?:\/\/(?:www\.)?github\.com\/[a-zA-Z0-9_-]+\/?/gi;

export function isResumeParseConfigured() {
  return Boolean(String(process.env.OPENAI_API_KEY || "").trim());
}

function clampStr(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeSkill(skill) {
  const raw = String(skill || "").trim();
  if (!raw) return null;
  if (TALENT_SKILL_OPTION_SET.has(raw)) return raw;

  const lower = raw.toLowerCase();
  for (const preset of TALENT_SKILL_OPTIONS) {
    if (preset.toLowerCase() === lower) return preset;
    if (lower.includes(preset.toLowerCase()) || preset.toLowerCase().includes(lower)) {
      return preset;
    }
  }
  return raw.slice(0, 100);
}

function normalizeSkills(skills) {
  const seen = new Set();
  const out = [];
  for (const s of Array.isArray(skills) ? skills : []) {
    const norm = normalizeSkill(s);
    if (!norm) continue;
    const key = norm.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(norm);
  }
  return out;
}

function extractUrls(text) {
  const linkedin = text.match(LINKEDIN_RE)?.[0] || "";
  const github = text.match(GITHUB_RE)?.[0] || "";
  return { linkedinUrl: linkedin, githubUrl: github };
}

function normalizeWorkExperiences(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    company: clampStr(row?.company, 200),
    position: clampStr(row?.position, 200),
    startDate: clampStr(row?.startDate, 50),
    endDate: clampStr(row?.endDate, 50),
    current: Boolean(row?.current),
    description: clampStr(row?.description, 2000),
  })).filter((r) => r.company || r.position);
}

function normalizeEducationList(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    institution: clampStr(row?.institution, 200),
    degree: clampStr(row?.degree, 200),
    field: clampStr(row?.field, 200),
    startYear: clampStr(row?.startYear, 20),
    endYear: clampStr(row?.endYear, 20),
    current: Boolean(row?.current),
  })).filter((r) => r.institution || r.degree);
}

function normalizeCertifications(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    name: clampStr(row?.name, 200),
    issuer: clampStr(row?.issuer, 200),
    year: clampStr(row?.year, 20),
    url: clampStr(row?.url, 1000),
  })).filter((r) => r.name);
}

function normalizePortfolioItems(rows) {
  return (Array.isArray(rows) ? rows : []).map((row) => ({
    title: clampStr(row?.title, 200),
    description: clampStr(row?.description, 2000),
    url: clampStr(row?.url, 1000),
    type: clampStr(row?.type || "project", 100),
  })).filter((r) => r.title);
}

function normalizeDraft(raw, sourceText) {
  const urlHints = extractUrls(sourceText);
  const draft = {
    fullName: clampStr(raw?.fullName, 100),
    professionalTitle: clampStr(raw?.professionalTitle, 200),
    location: clampStr(raw?.location, 200),
    bio: clampStr(raw?.bio, 2000),
    skills: normalizeSkills(raw?.skills),
    yearsOfExperience: clampStr(raw?.yearsOfExperience, 50),
    linkedinUrl: clampStr(raw?.linkedinUrl || urlHints.linkedinUrl, 1000),
    githubUrl: clampStr(raw?.githubUrl || urlHints.githubUrl, 1000),
    websiteUrl: clampStr(raw?.websiteUrl, 1000),
    workExperiences: normalizeWorkExperiences(raw?.workExperiences),
    educationList: normalizeEducationList(raw?.educationList),
    certifications: normalizeCertifications(raw?.certifications),
    portfolioItems: normalizePortfolioItems(raw?.portfolioItems),
  };
  return draft;
}

const SYSTEM_PROMPT = `You extract structured talent profile data from resume/CV text.
Return ONLY valid JSON with this exact shape (use empty strings or empty arrays when unknown):
{
  "fullName": "",
  "professionalTitle": "",
  "location": "",
  "bio": "",
  "skills": [],
  "yearsOfExperience": "",
  "linkedinUrl": "",
  "githubUrl": "",
  "websiteUrl": "",
  "workExperiences": [{ "company": "", "position": "", "startDate": "", "endDate": "", "current": false, "description": "" }],
  "educationList": [{ "institution": "", "degree": "", "field": "", "startYear": "", "endYear": "", "current": false }],
  "certifications": [{ "name": "", "issuer": "", "year": "", "url": "" }],
  "portfolioItems": [{ "title": "", "description": "", "url": "", "type": "project" }]
}
Rules:
- skills: concise list of professional skills (technologies, tools, domains)
- dates: use YYYY-MM or YYYY when possible
- portfolioItems: projects, products, or notable work from the CV
- Do not invent employers, degrees, or certifications not supported by the text
- bio: 1-3 sentence professional summary if present`;

export async function parseResumeText(text) {
  const apiKey = String(process.env.OPENAI_API_KEY || "").trim();
  if (!apiKey) {
    const err = new Error("Resume import is not configured.");
    err.status = 503;
    throw err;
  }

  const model = String(process.env.OPENAI_RESUME_MODEL || DEFAULT_MODEL).trim();
  const client = new OpenAI({ apiKey });

  const completion = await client.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    temperature: 0.1,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `Extract profile data from this resume:\n\n${text}`,
      },
    ],
  });

  const content = completion.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Could not parse resume. Please try again.");
  }

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Could not parse resume response. Please try again.");
  }

  return normalizeDraft(parsed, text);
}
