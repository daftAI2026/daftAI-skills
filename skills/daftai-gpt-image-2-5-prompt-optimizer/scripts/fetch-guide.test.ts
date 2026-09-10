import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { SOURCE, ensureGuide, extractGuide } from "./fetch-guide";

const body = `
## Overview
GPT Image 2.5 Flare and GPT Image 2.5 Sunburst.
## Prompting fundamentals
Original test guidance.
## Generate images
\`\`\`text
Draw a violet kite.
\`\`\`
## Edit images
Original editing sample.
## Check the result
Original final check.
`;
const fixture = `<header><h2 id="gpt-image-2.5-guide">{"GPT Image 2.5 prompting guide"}</h2></header>${body}<header><h2>GPT Image 2 reference</h2></header>LEGACY_SENTINEL`;
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
async function cachePath() {
  const dir = await mkdtemp(join(tmpdir(), "image-guide-test-"));
  directories.push(dir);
  return join(dir, "cache", "guide.md");
}
const respond = (body: string, status = 200) => (async () => new Response(body, { status })) as typeof fetch;

test("完整保留目标栏目和示例，排除旧版", () => {
  const output = extractGuide(fixture);
  expect(output).toContain("Draw a violet kite.");
  expect(output).toContain("Original final check.");
  expect(output).not.toContain("LEGACY_SENTINEL");
  expect(extractGuide(output)).toBe(output);
});
test("支持 Markdown 栏目边界及 CRLF", () => {
  const output = extractGuide((`## GPT Image 2.5 prompting guide\n${body}\n## GPT Image 1 reference\nOLD`).replaceAll("\n", "\r\n"));
  expect(output).not.toContain("OLD");
});
test("拒绝 HTML、截断和重复目标栏目", () => {
  expect(() => extractGuide("<html>Blocked</html>")).toThrow();
  expect(() => extractGuide(fixture.replace("## Check the result", "Missing"))).toThrow();
  expect(() => extractGuide(fixture + fixture)).toThrow();
});
test("首次抓取，随后命中本地参考不联网", async () => {
  const path = await cachePath();
  const first = await ensureGuide(path, false, respond(fixture));
  expect(first.status).toBe("downloaded");
  expect(first.indexPath).toBe(join(dirname(path), "INDEX.md"));
  const fail = (async () => { throw new Error("不应联网"); }) as typeof fetch;
  expect((await ensureGuide(path, false, fail)).status).toBe("cached");
});
test("旧 cache 路径迁到稳定布局且不联网", async () => {
  const dir = await mkdtemp(join(tmpdir(), "image-guide-legacy-"));
  directories.push(dir);
  const legacy = join(dir, "cache", "official-gpt-image-2-5.md");
  const path = join(dir, "gpt-image-2-5", "source.md");
  await mkdir(dirname(legacy), { recursive: true });
  await writeFile(legacy, `<!--\nSource: ${SOURCE}\nFetched: 2026-01-01T00:00:00.000Z\n-->\n\n${extractGuide(fixture)}`);
  const fail = (async () => { throw new Error("不应联网"); }) as typeof fetch;
  const result = await ensureGuide(path, false, fail);
  expect(result.status).toBe("cached");
  expect(result.indexPath).toBe(join(dir, "gpt-image-2-5", "INDEX.md"));
  expect(await readFile(path, "utf8")).toContain("Draw a violet kite.");
  expect(await readFile(result.indexPath, "utf8")).toContain("Layout: gpt-image-2-5/v1");
});
test("显式刷新替换缓存，失败保留原文", async () => {
  const path = await cachePath();
  await ensureGuide(path, false, respond(fixture));
  await ensureGuide(path, true, respond(fixture.replace("violet kite", "green kite")));
  const previous = await readFile(path, "utf8");
  expect(previous).toContain("green kite");
  await expect(ensureGuide(path, true, respond("Unavailable", 503))).rejects.toThrow("503");
  expect(await readFile(path, "utf8")).toBe(previous);
});
test("拒绝超大响应及伪成功页面", async () => {
  const path = await cachePath();
  await expect(ensureGuide(path, false, respond("a".repeat(2_000_001)))).rejects.toThrow("大小上限");
  await expect(ensureGuide(path, false, respond("Please log in"))).rejects.toThrow("无法唯一定位");
});
