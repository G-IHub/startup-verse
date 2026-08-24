import assert from "node:assert/strict";
import test from "node:test";
import { startWorkLogRefresh } from "../components/dashboards/founder/workLogRefresh.js";

class FakeTarget extends EventTarget {
  visibilityState = "visible";
  intervalCallback = null;
  clearedInterval = null;

  setInterval(callback) {
    this.intervalCallback = callback;
    return 42;
  }

  clearInterval(intervalId) {
    this.clearedInterval = intervalId;
  }
}

test("refreshes founder work logs after focus, visibility, and polling events", () => {
  const windowTarget = new FakeTarget();
  const documentTarget = new FakeTarget();
  let refreshCount = 0;
  const stop = startWorkLogRefresh(() => refreshCount++, {
    windowTarget,
    documentTarget,
  });

  windowTarget.dispatchEvent(new Event("focus"));
  documentTarget.dispatchEvent(new Event("visibilitychange"));
  windowTarget.intervalCallback();
  assert.equal(refreshCount, 3);

  documentTarget.visibilityState = "hidden";
  windowTarget.intervalCallback();
  assert.equal(refreshCount, 3);

  stop();
  windowTarget.dispatchEvent(new Event("focus"));
  assert.equal(refreshCount, 3);
  assert.equal(windowTarget.clearedInterval, 42);
});
