import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  DEFAULT_PREFERENCES,
  ensurePreferencesConfigured,
  loadPreferences,
  protectFencedCodeBlocks,
  resolvePreferences,
  restoreFencedCodeBlocks,
  writePreferences,
} from "./shared";

async function testPreferencesRoundTrip(): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "copywriting-test-"));
  const prefsPath = path.join(tempDir, "EXTEND.md");

  writePreferences(prefsPath, {
    ...DEFAULT_PREFERENCES,
    defaultMode: "quick",
  });

  const loaded = loadPreferences(prefsPath);

  assert.equal(loaded.defaultMode, "quick");
}

async function testFenceProtection(): Promise<void> {
  const content = [
    "你好world",
    "```ts",
    "const value = 'hello世界';",
    "```",
    "结尾text",
  ].join("\n");

  const protectedResult = protectFencedCodeBlocks(content);

  assert.notEqual(protectedResult.content, content);
  assert.equal(protectedResult.blocks.length, 1);
  assert.match(protectedResult.content, /__DAFTAI_FENCE_BLOCK_0__/);

  const restored = restoreFencedCodeBlocks(protectedResult.content, protectedResult.blocks);

  assert.equal(restored, content);
}

async function testMissingPreferencesFails(): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "copywriting-no-prefs-"));
  const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), "copywriting-no-prefs-home-"));
  const resolution = resolvePreferences(tempDir, fakeHome);

  assert.equal(resolution.sourcePath, null);
  assert.throws(
    () => ensurePreferencesConfigured(resolution),
    /First-time setup required/,
  );
}

async function main(): Promise<void> {
  await testPreferencesRoundTrip();
  await testFenceProtection();
  await testMissingPreferencesFails();
  console.log("main.test.ts passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
