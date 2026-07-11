import mammoth from "mammoth";
import { createRequire } from "module";
import { isAllowedResumeMime } from "../utils/resumeAttachments.js";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const MAX_TEXT_CHARS = 12_000;

async function extractPdfText(buffer) {
  const parser = new PDFParse({ data: buffer });
  try {
    const parsed = await parser.getText();
    return String(parsed?.text || "").trim();
  } finally {
    await parser.destroy?.();
  }
}

export async function extractResumeText(buffer, mimeType) {
  if (!buffer || !Buffer.isBuffer(buffer)) {
    throw new Error("Invalid file buffer.");
  }
  const mt = String(mimeType || "").toLowerCase().trim();
  if (!isAllowedResumeMime(mt)) {
    throw new Error("Unsupported file type. Upload a PDF or DOCX file.");
  }

  let text = "";
  if (mt === "application/pdf") {
    text = await extractPdfText(buffer);
  } else if (
    mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    const result = await mammoth.extractRawText({ buffer });
    text = String(result?.value || "").trim();
  }

  if (!text) {
    throw new Error(
      "Could not read text from this file. Try a text-based PDF or DOCX export.",
    );
  }

  if (text.length > MAX_TEXT_CHARS) {
    return text.slice(0, MAX_TEXT_CHARS);
  }
  return text;
}
