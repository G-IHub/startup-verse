#!/usr/bin/env node
/**
 * Removes Tailwind dark: variant classes from client source files.
 * Usage: node client/scripts/strip-dark-mode.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC_ROOT = path.resolve(__dirname, "../src");

const EXTENSIONS = new Set([".jsx", ".js", ".css"]);
const DARK_CLASS_RE = /\s+dark:[^\s"'`]+/g;

function walk(dir, files = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (name === "node_modules") continue;
      walk(full, files);
    } else if (EXTENSIONS.has(path.extname(name))) {
      files.push(full);
    }
  }
  return files;
}

function stripContent(content) {
  let next = content.replace(DARK_CLASS_RE, "");
  // Collapse accidental double spaces inside class strings (common after removal)
  next = next.replace(/className="([^"]*)"/g, (_, classes) => {
    return `className="${classes.replace(/\s{2,}/g, " ").trim()}"`;
  });
  next = next.replace(/className='([^']*)'/g, (_, classes) => {
    return `className='${classes.replace(/\s{2,}/g, " ").trim()}'`;
  });
  return next;
}

let changed = 0;
for (const file of walk(SRC_ROOT)) {
  const original = fs.readFileSync(file, "utf8");
  if (!original.includes("dark:")) continue;
  const updated = stripContent(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated, "utf8");
    changed++;
    console.log("updated:", path.relative(SRC_ROOT, file));
  }
}

console.log(`\nDone. ${changed} file(s) updated.`);
