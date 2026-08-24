import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("team messaging initializes reply state before using it", () => {
  const source = readFileSync(
    new URL("../components/office/SimpleTeamMessaging.jsx", import.meta.url),
    "utf8",
  );
  const declaration = source.indexOf(
    "const { replyingTo, setReplyingTo, clearReply } = useReplyState();",
  );
  const firstUsage = source.indexOf("setReplyingTo(");

  assert.notEqual(declaration, -1);
  assert.ok(declaration < firstUsage);
});
