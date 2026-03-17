import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  DEFAULT_PREFERENCES,
  loadPreferences,
  protectFencedCodeBlocks,
  restoreFencedCodeBlocks,
  writePreferences,
} from "./shared";

async function testPreferencesRoundTrip(): Promise<void> {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "copywriting-test-"));
  const prefsPath = path.join(tempDir, "EXTEND.md");

  writePreferences(prefsPath, {
    ...DEFAULT_PREFERENCES,
    defaultMode: "quick",
    autoInstallAutocorrect: false,
    reportStyle: "detailed",
  });

  const loaded = loadPreferences(prefsPath);

  assert.equal(loaded.defaultMode, "quick");
  assert.equal(loaded.autoInstallAutocorrect, false);
  assert.equal(loaded.reportStyle, "detailed");
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

async function main(): Promise<void> {
  await testPreferencesRoundTrip();
  await testFenceProtection();
  console.log("main.test.ts passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
