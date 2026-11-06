import { afterEach, expect, test } from "bun:test";
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import * as guideApi from "./fetch-guide";
const { SOURCE, ensureGuide, extractGuide, resolveGuide } = guideApi;
import { splitGuide } from "./split-guide";

function body(version: string, note = "") {
  return `
## Overview
GPT Image ${version} Flare and GPT Image ${version} Sunburst. ${note}
## Model parameters
Original settings.
## Prompting fundamentals
Original test guidance.
## Generate images
### Control style and lighting
\`\`\`text
Draw a violet kite.
\`\`\`
## Edit images
Original editing sample.
## Check the result
Original final check.
`;
}
function section(version: string, note = "") {
  return `<header><h2 id="gpt-image-${version}-guide">{"GPT Image ${version} prompting guide"}</h2></header>${body(version, note)}`;
}
const old = section("2.5", "OLD_SECTION");
const latest = section("2.6", "NEW_SECTION");
const fixture = latest + old + "<header><h2>GPT Image 2 reference</h2></header>LEGACY_SENTINEL";
const directories: string[] = [];
afterEach(async () => { await Promise.all(directories.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
async function cacheDir() {
  const dir = await mkdtemp(join(tmpdir(), "image-guide-test-"));
  directories.push(dir);
  return join(dir, "references", "gpt-image");
}
const respond = (page = fixture, status = 200, headers: Record<string, string> = {}) =>
  (async () => new Response(status === 304 ? null : page, { status, headers })) as typeof fetch;
const fail = (async () => { throw new Error("NETWORK_SENTINEL"); }) as typeof fetch;

// --- 栏目选择 ---
test("最新指南：同页存在 2.6 和 2.5 时默认选择 2.6", () => {
  const output = extractGuide(fixture);
  expect(output).toStartWith("## GPT Image 2.6 prompting guide");
  expect(output).toContain("NEW_SECTION");
  expect(output).not.toContain("OLD_SECTION");
  expect(output).not.toContain("LEGACY_SENTINEL");
  expect(extractGuide(output)).toBe(output);
});
test("数值排序而非页面顺序或字符串排序，不把 reference 栏目当作新指南", () => {
  const page = section("2.9") + section("2.10") + section("2.6") + "## GPT Image 99 reference\nLegacy";
  expect(resolveGuide(page).version).toBe("2.10");
  expect(resolveGuide(old + latest).version).toBe("2.6");
});
test("显式选择同页 2.5，不静默升级，缺失版本报错", () => {
  const output = extractGuide(fixture, "2.5");
  expect(output).toContain("OLD_SECTION");
  expect(output).not.toContain("NEW_SECTION");
  expect(() => resolveGuide(fixture, "2.4")).toThrow("无法唯一定位");
  expect(() => resolveGuide(fixture, "../2.5")).toThrow("无效");
});
test("支持 Markdown 栏目与 CRLF，忽略示例代码内的模型标题", () => {
  const fake = "```md\n## GPT Image 99 prompting guide\n```\n";
  const page = (`## GPT Image 2.6 prompting guide\n${body("2.6", "\n" + fake)}\n## GPT Image 2.5 prompting guide\n${body("2.5")}`).replaceAll("\n", "\r\n");
  expect(resolveGuide(page).version).toBe("2.6");
  expect(extractGuide(page)).toContain(fake);
});
test("拒绝 HTML、缺章节、重复目标、未闭合代码；不降级到旧栏目", () => {
  expect(() => extractGuide("<html>Blocked</html>")).toThrow();
  expect(() => extractGuide(latest.replace("## Check the result", "Missing") + old)).toThrow("缺失");
  expect(() => extractGuide(fixture + latest)).toThrow("无法唯一定位");
  expect(() => extractGuide(latest + "```text\nunfinished")).toThrow("Unclosed");
  expect(() => extractGuide(latest.replace("## Model parameters", "Missing"))).toThrow("缺失");
});
test("必需标题只在代码内出现不能通过校验", () => {
  expect(() => extractGuide(latest.replace("## Model parameters", "```md\n## Model parameters\n```"))).toThrow("缺失");
});

// --- HTTP 与本地参考 ---
test("首次抓取固定地址，不发送用户内容，生成带版本与布局的索引", async () => {
  const dir = await cacheDir();
  const spy = (async (url, init) => {
    expect(url).toBe(SOURCE);
    expect(init?.redirect).toBe("error");
    expect(init?.body).toBeUndefined();
    expect(new Headers(init?.headers).get("If-None-Match")).toBeNull();
    return new Response(fixture, { headers: { etag: 'W/"v1"' } });
  }) as typeof fetch;
  const first = await ensureGuide(dir, {}, spy);
  expect(first.status).toBe("downloaded");
  expect(first.version).toBe("2.6");
  const index = await readFile(first.indexPath, "utf8");
  expect(index).toContain("Layout: gpt-image/v1");
  expect(index).toContain("Model: GPT Image 2.6");
  expect(await readFile(join(dir, "page.md"), "utf8")).toBe(fixture);
  expect(first.fetchedAt).toBeTruthy();
});
test("ETag 条件请求命中 304，不重写分片与索引", async () => {
  const dir = await cacheDir();
  const first = await ensureGuide(dir, {}, respond(fixture, 200, { etag: 'W/"v1"' }));
  const before = await stat(first.indexPath);
  const check = (async (_url, init) => {
    expect(new Headers(init?.headers).get("If-None-Match")).toBe('W/"v1"');
    return new Response(null, { status: 304 });
  }) as typeof fetch;
  const second = await ensureGuide(dir, {}, check);
  expect(second.status).toBe("not-modified");
  expect(second.path).toBe(first.path);
  expect((await stat(first.indexPath)).mtimeMs).toBe(before.mtimeMs);
});
test("没有 ETag 时使用 Last-Modified", async () => {
  const dir = await cacheDir();
  const date = "Fri, 06 Nov 2026 00:00:00 GMT";
  await ensureGuide(dir, {}, respond(fixture, 200, { "last-modified": date }));
  const check = (async (_url, init) => {
    expect(new Headers(init?.headers).get("If-Modified-Since")).toBe(date);
    return new Response(null, { status: 304 });
  }) as typeof fetch;
  expect((await ensureGuide(dir, {}, check)).status).toBe("not-modified");
});
test("无 HTTP 校验器且正文未变时，复用当前分片，不重写索引", async () => {
  const dir = await cacheDir();
  const first = await ensureGuide(dir, {}, respond());
  const mtime = (await stat(first.indexPath)).mtimeMs;
  const again = await ensureGuide(dir, {}, respond());
  expect(again.status).toBe("unchanged");
  expect(again.path).toBe(first.path);
  expect((await stat(again.indexPath)).mtimeMs).toBe(mtime);
});
test("显式版本与最新指南共用一套当前分片，不串内容", async () => {
  const dir = await cacheDir();
  const current = await ensureGuide(dir, {}, respond());
  const pinned = await ensureGuide(dir, { offline: true, model: "2.5" }, fail);
  expect(pinned.version).toBe("2.5");
  expect(await readFile(pinned.path, "utf8")).toContain("OLD_SECTION");
  expect(pinned.path).toBe(current.path);
  expect(await readFile(pinned.indexPath, "utf8")).toContain("Model: GPT Image 2.5");
  const again = await ensureGuide(dir, { offline: true }, fail);
  expect(again.path).toBe(current.path);
  expect(await readFile(again.path, "utf8")).toContain("NEW_SECTION");
});
test("显式离线不联网；自动降级必须报告 stale；强制刷新失败报错", async () => {
  const dir = await cacheDir();
  await ensureGuide(dir, {}, respond());
  expect((await ensureGuide(dir, { offline: true }, fail)).status).toBe("offline");
  const stale = await ensureGuide(dir, {}, fail);
  expect(stale.status).toBe("stale");
  expect(stale.warning).toContain("不能声称已验证最新");
  await expect(ensureGuide(dir, { refresh: true }, fail)).rejects.toThrow("NETWORK_SENTINEL");
});
test("仅有旧版分片不算命中；新版缓存缺失时必须抓取", async () => {
  const dir = await cacheDir();
  const legacy = join(dirname(dir), "gpt-image-2-5", "source.md");
  await mkdir(dirname(legacy), { recursive: true });
  await writeFile(legacy, extractGuide(old));
  await expect(ensureGuide(dir, { offline: true }, fail)).rejects.toThrow("没有可验证");
  expect((await ensureGuide(dir, {}, respond())).version).toBe("2.6");
  expect(await readFile(legacy, "utf8")).toBe(extractGuide(old));
});
test("更新无效或请求失败不会覆盖上一次页面、索引和源文件", async () => {
  const dir = await cacheDir();
  const first = await ensureGuide(dir, {}, respond());
  const paths = [join(dir, "page.md"), join(dir, "http.json"), first.path, first.indexPath];
  const before = await Promise.all(paths.map(p => readFile(p, "utf8")));
  for (const fetcher of [respond("Unavailable", 503), respond("<html>blocked</html>"), respond(latest.replace("## Check the result", "Missing") + old)]) {
    await expect(ensureGuide(dir, { refresh: true }, fetcher)).rejects.toThrow();
    expect(await Promise.all(paths.map(p => readFile(p, "utf8")))).toEqual(before);
  }
  expect((await ensureGuide(dir, {}, respond("invalid"))).status).toBe("stale");
});
test("新指南直接替换当前分片；仅旧栏目变化不重写最新分片", async () => {
  const dir = await cacheDir();
  const initial = await ensureGuide(dir, {}, respond());
  const mtime = (await stat(initial.indexPath)).mtimeMs;
  const same = await ensureGuide(dir, {}, respond(fixture.replace("OLD_SECTION", "OLD_UPDATED")));
  expect(same.path).toBe(initial.path);
  expect((await stat(same.indexPath)).mtimeMs).toBe(mtime);
  const next = await ensureGuide(dir, {}, respond(section("2.7") + fixture));
  expect(next.version).toBe("2.7");
  expect(next.path).toBe(initial.path);
  expect(await readFile(initial.path, "utf8")).toContain("GPT Image 2.7 prompting guide");
  expect(await readFile(initial.path, "utf8")).not.toContain("NEW_SECTION");
});
test("缓存正文与校验器哈希不匹配时，不发送旧 ETag", async () => {
  const dir = await cacheDir();
  await ensureGuide(dir, {}, respond(fixture, 200, { etag: '"v1"' }));
  await writeFile(join(dir, "page.md"), fixture + "\nManual change\n");
  const check = (async (_url, init) => {
    expect(new Headers(init?.headers).get("If-None-Match")).toBeNull();
    return new Response(fixture);
  }) as typeof fetch;
  expect((await ensureGuide(dir, {}, check)).status).toBe("downloaded");
});
test("损坏 HTTP 元数据自动重新抓取，不影响已校验的离线正文", async () => {
  const dir = await cacheDir();
  await ensureGuide(dir, {}, respond());
  await writeFile(join(dir, "http.json"), "invalid JSON");
  expect((await ensureGuide(dir, { offline: true }, fail)).fetchedAt).toBeUndefined();
  expect((await ensureGuide(dir, {}, respond())).status).toBe("unchanged");
});
test("缺失或被修改的分片从完整页面确定性修复", async () => {
  const dir = await cacheDir();
  const first = await ensureGuide(dir, {}, respond());
  const raw = await readFile(first.path, "utf8");
  const part = splitGuide(raw).find(s => s.title === "Control style and lighting")!;
  const file = join(dirname(first.path), part.file);
  await rm(file);
  await ensureGuide(dir, { offline: true }, fail);
  expect(await readFile(file, "utf8")).toBe(part.text);
  await writeFile(file, "corrupt");
  await writeFile(first.path, "corrupt source");
  await ensureGuide(dir, { offline: true }, fail);
  expect(await readFile(file, "utf8")).toBe(part.text);
  expect(await readFile(first.path, "utf8")).toBe(raw);
});
test("拒绝超大响应、伪成功页面与无缓存 304，不创建可用参考", async () => {
  const dir = await cacheDir();
  await expect(ensureGuide(dir, {}, respond("x".repeat(2_000_001)))).rejects.toThrow("大小上限");
  await expect(ensureGuide(dir, {}, respond("Please log in"))).rejects.toThrow("无法唯一定位");
  await expect(ensureGuide(dir, {}, respond("", 304))).rejects.toThrow("304");
  await expect(readFile(join(dir, "page.md"))).rejects.toThrow();
});
test("强制刷新不使用条件请求；非法参数在联网前拒绝", async () => {
  const dir = await cacheDir();
  await ensureGuide(dir, {}, respond(fixture, 200, { etag: '"v1"' }));
  const check = (async (_url, init) => {
    expect(new Headers(init?.headers).get("If-None-Match")).toBeNull();
    return new Response(fixture);
  }) as typeof fetch;
  await ensureGuide(dir, { refresh: true }, check);
  await expect(ensureGuide(dir, { offline: true, refresh: true }, fail)).rejects.toThrow("不能同时");
  await expect(ensureGuide(dir, { model: "../../bad" }, fail)).rejects.toThrow("无效");
});

test("替换后不残留旧分片或版本目录，不删除缓存外文件", async () => {
  const dir = await cacheDir();
  const first = await ensureGuide(dir, {}, respond());
  const source = await readFile(first.path, "utf8");
  const removed = splitGuide(source).find(s => s.title === "Control style and lighting")!;
  const canary = join(dir, "user-note.txt");
  await writeFile(canary, "keep me");
  await ensureGuide(dir, {}, respond(fixture.replace("### Control style and lighting", "### New example")));
  await expect(readFile(join(dirname(first.path), removed.file))).rejects.toThrow();
  expect(await readFile(canary, "utf8")).toBe("keep me");
  const { readdir } = await import("node:fs/promises");
  expect((await readdir(dir)).sort()).toEqual(["current", "http.json", "page.md", "user-note.txt"]);
});

test("CLI 帮助与非法选项不抓取页面，错误只写 stderr 并返回非零", async () => {
  const dir = await cacheDir();
  await mkdir(join(dir, "scripts"), { recursive: true });
  for (const name of ["fetch-guide.ts", "split-guide.ts"]) {
    await writeFile(join(dir, "scripts", name), await readFile(new URL(name, import.meta.url), "utf8"));
  }
  const run = (...args: string[]) => Bun.spawnSync([process.execPath, "scripts/fetch-guide.ts", ...args], {
    cwd: dir, stdout: "pipe", stderr: "pipe",
  });
  const help = run("--help");
  expect(help.exitCode).toBe(0);
  expect(help.stdout.toString()).toContain("--model <version>");
  expect(help.stderr.toString()).toBe("");
  for (const args of [["--invalid"], ["--model"], ["--model", "../bad"], ["--offline", "--refresh"], ["--offline"]]) {
    const result = run(...args);
    expect(result.exitCode).toBe(1);
    expect(result.stdout.toString()).toBe("");
    expect(result.stderr.toString()).toContain("抓取失败");
  }
  await expect(readFile(join(dir, "references", "gpt-image", "page.md"))).rejects.toThrow();
});
