import test from "node:test";
import assert from "node:assert/strict";
import { getGridLayout } from "./getGridLayout.js";

const MOBILE = { width: 375 };
const DESKTOP = { width: 1024 };

test("getGridLayout returns empty layout for count 0", () => {
  const layout = getGridLayout(0, DESKTOP);
  assert.equal(layout.count, 0);
  assert.equal(layout.tileSpans.length, 0);
});

test("getGridLayout caps count at 12 tiles", () => {
  const layout = getGridLayout(20, DESKTOP);
  assert.equal(layout.count, 12);
  assert.equal(layout.tileSpans.length, 12);
});

test("getGridLayout tileSpans length matches count for 1-12", () => {
  for (let count = 1; count <= 12; count += 1) {
    const layout = getGridLayout(count, DESKTOP);
    assert.equal(layout.tileSpans.length, count);
  }
});

test("getGridLayout uses stacked rows for 2 participants on mobile", () => {
  const layout = getGridLayout(2, MOBILE);
  assert.equal(layout.gridTemplateColumns, "1fr");
  assert.equal(layout.gridTemplateRows, "1fr 1fr");
});

test("getGridLayout uses side-by-side columns for 2 participants on desktop", () => {
  const layout = getGridLayout(2, DESKTOP);
  assert.equal(layout.gridTemplateColumns, "1fr 1fr");
  assert.equal(layout.gridTemplateRows, "1fr");
});

test("getGridLayout uses 2x2 grid for 4 participants", () => {
  const layout = getGridLayout(4, DESKTOP);
  assert.equal(layout.gridTemplateColumns, "1fr 1fr");
  assert.equal(layout.gridTemplateRows, "1fr 1fr");
  assert.equal(layout.tileSpans.length, 4);
});

test("getGridLayout uses 3 columns for 6 participants on desktop", () => {
  const layout = getGridLayout(6, DESKTOP);
  assert.equal(layout.gridTemplateColumns, "1fr 1fr 1fr");
});

test("getGridLayout enables scroll for 12 participants on desktop", () => {
  const layout = getGridLayout(12, DESKTOP);
  assert.equal(layout.scrollable, true);
});
