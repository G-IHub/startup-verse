import fs from "fs/promises";
import path from "path";
import https from "https";
import http from "http";
import { getUploadRoot } from "./storage.js";

function downloadBufferFromUrl(url, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) {
      reject(new Error("Too many redirects."));
      return;
    }
    const client = url.startsWith("https://") ? https : http;
    client
      .get(url, (res) => {
        if (
          res.statusCode >= 300 &&
          res.statusCode < 400 &&
          res.headers.location
        ) {
          downloadBufferFromUrl(res.headers.location, redirectCount + 1)
            .then(resolve)
            .catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to fetch file (HTTP ${res.statusCode}).`));
          return;
        }
        const chunks = [];
        res.on("data", (chunk) => chunks.push(chunk));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      })
      .on("error", reject);
  });
}

async function readDiskKey(key) {
  const normalizedKey = String(key || "").replace(/^\/uploads\//, "");
  const diskPath = path.join(getUploadRoot(), normalizedKey);
  const normalizedRoot = path.resolve(getUploadRoot());
  const normalizedFile = path.resolve(diskPath);
  if (!normalizedFile.startsWith(normalizedRoot)) {
    throw new Error("Invalid upload path.");
  }
  return fs.readFile(normalizedFile);
}

/**
 * Load a previously uploaded resume by storage key or URL.
 */
export async function loadResumeBuffer({ key, url }) {
  const keyStr = String(key || "").trim();
  const urlStr = String(url || "").trim();

  if (keyStr) {
    return readDiskKey(keyStr);
  }

  if (urlStr.startsWith("/uploads/")) {
    return readDiskKey(urlStr);
  }

  if (/^https?:\/\//i.test(urlStr)) {
    return downloadBufferFromUrl(urlStr);
  }

  throw new Error("Resume file reference is required (key or url).");
}
