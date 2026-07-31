import test from "node:test";
import assert from "node:assert/strict";
import {
  isResumeParseConfigured,
  parseResumeText,
} from "./resumeParseService.js";

const originalApiKey = process.env.DEEPSEEK_API_KEY;
const originalModel = process.env.DEEPSEEK_RESUME_MODEL;
const originalFetch = globalThis.fetch;

test.afterEach(() => {
  if (originalApiKey === undefined) delete process.env.DEEPSEEK_API_KEY;
  else process.env.DEEPSEEK_API_KEY = originalApiKey;

  if (originalModel === undefined) delete process.env.DEEPSEEK_RESUME_MODEL;
  else process.env.DEEPSEEK_RESUME_MODEL = originalModel;

  globalThis.fetch = originalFetch;
});

test("resume parsing is configured only by the DeepSeek API key", () => {
  delete process.env.DEEPSEEK_API_KEY;
  assert.equal(isResumeParseConfigured(), false);

  process.env.DEEPSEEK_API_KEY = "deepseek-key";
  assert.equal(isResumeParseConfigured(), true);
});

test("parseResumeText calls DeepSeek JSON mode and normalizes its result", async () => {
  process.env.DEEPSEEK_API_KEY = "deepseek-key";
  process.env.DEEPSEEK_RESUME_MODEL = "deepseek-v4-pro";
  let request;

  globalThis.fetch = async (url, options) => {
    request = { url, options };
    return {
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                fullName: "  Ada Lovelace  ",
                professionalTitle: "Engineer",
                skills: ["TypeScript", "typescript"],
                workExperiences: [
                  { company: "Analytical Engines", position: "Programmer" },
                ],
              }),
            },
          },
        ],
      }),
    };
  };

  const result = await parseResumeText(
    "Ada Lovelace https://github.com/ada-lovelace",
  );

  assert.equal(request.url, "https://api.deepseek.com/chat/completions");
  assert.equal(request.options.method, "POST");
  assert.equal(request.options.headers.Authorization, "Bearer deepseek-key");
  const body = JSON.parse(request.options.body);
  assert.equal(body.model, "deepseek-v4-pro");
  assert.deepEqual(body.response_format, { type: "json_object" });
  assert.deepEqual(body.thinking, { type: "disabled" });
  assert.match(body.messages[1].content, /return JSON/);
  assert.equal(result.fullName, "Ada Lovelace");
  assert.deepEqual(result.skills, ["TypeScript"]);
  assert.equal(result.githubUrl, "https://github.com/ada-lovelace");
  assert.equal(result.workExperiences[0].company, "Analytical Engines");
});

test("parseResumeText reports DeepSeek API failures as a bad gateway", async () => {
  process.env.DEEPSEEK_API_KEY = "deepseek-key";
  globalThis.fetch = async () => ({ ok: false, status: 401 });

  await assert.rejects(parseResumeText("Resume text"), (error) => {
    assert.equal(error.status, 502);
    assert.match(error.message, /DeepSeek/);
    return true;
  });
});
