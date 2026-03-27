import { strict as assert } from "node:assert";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

import {
  DEFAULT_PREFERENCES,
  ensurePreferencesConfigured,
  loadPreferences,
  protectSyntax,
  resolvePreferences,
  restoreSyntax,
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

  const result = protectSyntax(content);

  assert.notEqual(result.content, content);
  assert.match(result.content, /__DAFTAI_FENCE_0__/);
  assert.ok(!result.content.includes("const value"));

  const restored = restoreSyntax(result.content, result.blocks);
  assert.equal(restored, content);
}

async function testInlineCodeProtection(): Promise<void> {
  const content = "使用 `console.log` 来调试hello世界";
  const result = protectSyntax(content);

  assert.ok(!result.content.includes("console.log"));
  assert.match(result.content, /__DAFTAI_CODE_/);

  const restored = restoreSyntax(result.content, result.blocks);
  assert.equal(restored, content);
}

async function testBlockMathProtection(): Promise<void> {
  const content = [
    "公式如下：",
    "$$",
    "E = mc^2",
    "$$",
    "结束",
  ].join("\n");

  const result = protectSyntax(content);

  assert.ok(!result.content.includes("E = mc^2"));
  assert.match(result.content, /__DAFTAI_BMATH_/);

  const restored = restoreSyntax(result.content, result.blocks);
  assert.equal(restored, content);
}

async function testInlineMathProtection(): Promise<void> {
  const content = "其中 $x + y = z$ 是基本公式";
  const result = protectSyntax(content);

  assert.ok(!result.content.includes("x + y = z"));
  assert.match(result.content, /__DAFTAI_IMATH_/);

  const restored = restoreSyntax(result.content, result.blocks);
  assert.equal(restored, content);
}

async function testLinkUrlProtection(): Promise<void> {
  const content = "请参考[这篇文章](https://example.com/path?q=1)了解详情";
  const result = protectSyntax(content);

  assert.ok(result.content.includes("这篇文章"));
  assert.ok(!result.content.includes("https://example.com"));
  assert.match(result.content, /__DAFTAI_URL_/);

  const restored = restoreSyntax(result.content, result.blocks);
  assert.equal(restored, content);
}

async function testImageUrlProtection(): Promise<void> {
  const content = "截图如下 ![示意图](images/screenshot.png) 可以看到";
  const result = protectSyntax(content);

  assert.ok(result.content.includes("示意图"));
  assert.ok(!result.content.includes("images/screenshot.png"));

  const restored = restoreSyntax(result.content, result.blocks);
  assert.equal(restored, content);
}

async function testMixedProtection(): Promise<void> {
  const content = [
    "# 标题title",
    "",
    "正文中有 `code` 和 $E=mc^2$ 以及[链接](https://x.com)。",
    "",
    "```python",
    "print('hello世界')",
    "```",
    "",
    "$$",
    "\\sum_{i=1}^{n} x_i",
    "$$",
  ].join("\n");

  const result = protectSyntax(content);

  assert.ok(!result.content.includes("print('hello"));
  assert.ok(!result.content.includes("\\sum_"));
  assert.ok(!result.content.includes("https://x.com"));
  assert.ok(result.content.includes("标题title"));
  assert.ok(result.content.includes("链接"));

  const restored = restoreSyntax(result.content, result.blocks);
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
  await testInlineCodeProtection();
  await testBlockMathProtection();
  await testInlineMathProtection();
  await testLinkUrlProtection();
  await testImageUrlProtection();
  await testMixedProtection();
  await testMissingPreferencesFails();
  console.log("main.test.ts passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
