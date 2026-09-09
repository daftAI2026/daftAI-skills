/**
 * [INPUT]: 依赖 Node fs/path/url 与 Bun 的 Web API，读取固定官方 Markdown 来源和本地参考缓存。
 * [OUTPUT]: 提供 extractGuide、ensureGuide 和 CLI；输出缓存路径，不向终端倾倒官方正文。
 * [POS]: 技能的来源获取边界；缓存命中不联网，失败不覆盖旧内容，不抓取其他网站或图片。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */

import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const SOURCE = "https://developers.openai.com/api/docs/guides/image-prompting.md";
const CACHE = resolve(dirname(fileURLToPath(import.meta.url)), "../references/cache/official-gpt-image-2-5.md");
const TIMEOUT_MS = 30_000;
const MAX_BYTES = 2_000_000;
const REQUIRED = ["Overview", "Prompting fundamentals", "Generate images", "Edit images", "Check the result"];

// --- 栏目边界：仅识别官方 MDX 标题或等价 Markdown 标题 ---
export function extractGuide(source: string): string {
  const text = source.replace(/\r\n/g, "\n");
  if (/^\s*(?:<!doctype|<html)/i.test(text)) throw new Error("来源返回 HTML，不是官方 Markdown 正文");
  const markers = [...text.matchAll(/<header\b[^>]*>[\s\S]*?<\/header>|^#{1,2} GPT Image [^\n]+/gm)]
    .filter(m => /GPT Image/.test(m[0]));
  const starts = markers.filter(m => /GPT Image 2\.5 prompting guide/.test(m[0]));
  if (starts.length !== 1) throw new Error("无法唯一定位 GPT Image 2.5 栏目，拒绝缓存");
  const start = starts[0];
  const end = markers.find(m => m.index! > start.index!);
  const body = text.slice(start.index! + start[0].length, end?.index).trim();
  for (const heading of REQUIRED) {
    if (!body.includes(`\n## ${heading}\n`) && !body.startsWith(`## ${heading}\n`)) {
      throw new Error(`2.5 栏目缺失 ${heading}，可能截断或页面结构已变`);
    }
  }
  if (!body.includes("GPT Image 2.5 Flare") || !body.includes("GPT Image 2.5 Sunburst")) {
    throw new Error("正文无法确认 2.5 子模型范围");
  }
  if ((body.match(/^```/gm)?.length ?? 0) % 2) throw new Error("正文代码块未闭合，拒绝缓存");
  return `## GPT Image 2.5 prompting guide\n\n${body}\n`;
}

// --- 网络边界：限制时间、大小与重定向，不发送用户内容 ---
async function download(fetcher: typeof fetch): Promise<string> {
  const response = await fetcher(SOURCE, {
    signal: AbortSignal.timeout(TIMEOUT_MS),
    redirect: "error",
    headers: { Accept: "text/markdown, text/plain" },
  });
  if (!response.ok) throw new Error(`官方来源 HTTP ${response.status}`);
  if (!response.body) throw new Error("官方来源返回空响应");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BYTES) throw new Error("官方响应超过大小上限，拒绝缓存");
      chunks.push(value);
    }
  } finally {
    await reader.cancel();
  }
  return Buffer.concat(chunks).toString("utf8");
}

export async function ensureGuide(
  path = CACHE,
  refresh = false,
  fetcher: typeof fetch = fetch,
): Promise<{ path: string; status: "cached" | "downloaded" }> {
  if (!refresh) {
    try {
      const cached = await readFile(path, "utf8");
      if (!cached.includes(`Source: ${SOURCE}\n`)) throw new Error("缓存缺少来源");
      extractGuide(cached);
      return { path, status: "cached" };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new Error(`缓存不可用；请检查后用 --refresh 重新抓取：${(error as Error).message}`);
      }
    }
  }
  const guide = extractGuide(await download(fetcher));
  const content = `<!--\nSource: ${SOURCE}\nFetched: ${new Date().toISOString()}\nLocal reference only; do not commit or redistribute this cache.\n-->\n\n${guide}`;
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, path);
  } finally {
    await rm(temporary, { force: true });
  }
  return { path, status: "downloaded" };
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  if (args.some(arg => arg !== "--refresh") || args.length > 1) {
    process.stderr.write("用法：bun scripts/fetch-guide.ts [--refresh]\n");
    process.exitCode = 1;
  } else {
    try {
      process.stdout.write(`${JSON.stringify(await ensureGuide(CACHE, args.includes("--refresh")))}\n`);
    } catch (error) {
      process.stderr.write(`抓取失败：${(error as Error).message}\n`);
      process.exitCode = 1;
    }
  }
}
