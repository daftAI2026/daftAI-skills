import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ensureSections, splitGuide } from "./split-guide";

export const SOURCE = "https://developers.openai.com/api/docs/guides/image-prompting.md";
export const CACHE_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../references/gpt-image");
const TIMEOUT_MS = 30_000;
const MAX_BYTES = 2_000_000;
const REQUIRED = ["Overview", "Model parameters", "Prompting fundamentals", "Generate images", "Edit images", "Check the result"];
const VERSION = /^\d+(?:\.\d+)*$/;
const hash = (text: string) => createHash("sha256").update(text).digest("hex");

export interface Guide { version: string; content: string }
export interface Options { refresh?: boolean; offline?: boolean; model?: string }
interface HttpMetadata { source: string; pageHash: string; fetchedAt: string; etag?: string; lastModified?: string }
export interface Receipt {
  path: string; indexPath: string; sectionCount: number; version: string;
  status: "downloaded" | "unchanged" | "not-modified" | "offline" | "stale";
  fetchedAt?: string; warning?: string;
}

// --- 屏蔽代码块但保留偏移，防止示例中的伪标题改变栏目边界 ---
function outsideFences(source: string): string {
  let fence: { char: string; length: number } | undefined;
  return source.split(/(?<=\n)/).map(line => {
    const marker = line.trimEnd().match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    const hidden = Boolean(fence || marker);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
    }
    return hidden ? line.replace(/[^\n]/g, " ") : line;
  }).join("");
}

export function resolveGuide(source: string, model?: string): Guide {
  if (model !== undefined && !VERSION.test(model)) throw new Error("无效的模型版本，例如应填写 2.5");
  const text = source.replace(/\r\n/g, "\n");
  if (/^\s*(?:<!doctype|<html)/i.test(text)) throw new Error("来源返回 HTML，不是官方 Markdown 正文");
  const markers = [...outsideFences(text).matchAll(/<header\b[^>]*>[\s\S]*?<\/header>|^#{1,2}[ \t]+GPT Image [^\n]+/gm)]
    .filter(m => /GPT Image/.test(m[0]));
  const guides = markers.flatMap(marker => {
    const match = marker[0].match(/GPT Image (\d+(?:\.\d+)*) prompting guide\b/);
    return match ? [{ marker, version: match[1] }] : [];
  });
  guides.sort((a, b) => {
    const left = a.version.split(".").map(Number), right = b.version.split(".").map(Number);
    for (let i = 0; i < Math.max(left.length, right.length); i++) {
      const delta = (right[i] ?? 0) - (left[i] ?? 0);
      if (delta) return delta;
    }
    return 0;
  });
  const version = model ?? guides[0]?.version;
  const selected = guides.filter(g => g.version === version);
  if (selected.length !== 1) throw new Error(`无法唯一定位 GPT Image ${version ?? "最新"} 指南，拒绝保存`);
  const start = selected[0].marker;
  const end = markers.find(m => m.index! > start.index!);
  const body = text.slice(start.index! + start[0].length, end?.index).trim();
  const content = `## GPT Image ${version} prompting guide\n\n${body}\n`;
  const sections = splitGuide(content);
  for (const title of REQUIRED) {
    if (!sections.some(s => s.title === title)) throw new Error(`${version} 栏目缺失 ${title}，拒绝保存`);
  }
  if (!outsideFences(body).includes(`GPT Image ${version}`)) throw new Error("正文无法确认所选模型范围");
  return { version: version!, content };
}

export function extractGuide(source: string, model?: string): string {
  return resolveGuide(source, model).content;
}

async function readOptional(path: string): Promise<string | undefined> {
  try { return await readFile(path, "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
}

async function writeAtomic(path: string, content: string) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

// --- HTTP 校验器只适用于哈希匹配的完整页面 ---
async function download(fetcher: typeof fetch, metadata?: HttpMetadata) {
  const headers: Record<string, string> = { Accept: "text/markdown, text/plain" };
  if (metadata?.etag) headers["If-None-Match"] = metadata.etag;
  else if (metadata?.lastModified) headers["If-Modified-Since"] = metadata.lastModified;
  const response = await fetcher(SOURCE, { signal: AbortSignal.timeout(TIMEOUT_MS), redirect: "error", headers });
  if (response.status === 304) return { response };
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
      if (size > MAX_BYTES) throw new Error("官方响应超过大小上限，拒绝保存");
      chunks.push(value);
    }
  } finally { await reader.cancel(); }
  return { response, page: Buffer.concat(chunks).toString("utf8") };
}

// --- 只保留当前分片：先生成再切换，失败恢复旧目录 ---
async function publishGuide(directory: string, guide: Guide) {
  const current = join(directory, "current"), path = join(current, "source.md");
  const content = `<!--\nSource: ${SOURCE}\nLocal official reference only; do not commit or redistribute.\n-->\n\n${guide.content}`;
  if (await readOptional(path) === content) return { path, ...await ensureSections(path, content) };
  await mkdir(directory, { recursive: true });
  const temporary = await mkdtemp(join(directory, ".update-"));
  const backup = join(directory, `.previous-${crypto.randomUUID()}`);
  let previous = false;
  try {
    const staged = join(temporary, "source.md");
    await writeFile(staged, content);
    const { sectionCount } = await ensureSections(staged, content);
    try { await rename(current, backup); previous = true; }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    try { await rename(temporary, current); }
    catch (error) { if (previous) await rename(backup, current); throw error; }
    if (previous) await rm(backup, { recursive: true, force: true });
    return { path, indexPath: join(current, "INDEX.md"), sectionCount };
  } finally { await rm(temporary, { recursive: true, force: true }); }
}

export async function ensureGuide(directory = CACHE_DIR, options: Options = {}, fetcher: typeof fetch = fetch): Promise<Receipt> {
  if (options.refresh && options.offline) throw new Error("--refresh 与 --offline 不能同时使用");
  if (options.model !== undefined && !VERSION.test(options.model)) throw new Error("无效的模型版本");
  const pagePath = join(directory, "page.md"), metadataPath = join(directory, "http.json");
  const localPage = await readOptional(pagePath);
  let localGuide: Guide | undefined;
  if (localPage) {
    try { localGuide = resolveGuide(localPage, options.model); } catch {}
  }
  let metadata: HttpMetadata | undefined;
  try {
    const parsed = JSON.parse(await readOptional(metadataPath) ?? "null");
    if (localGuide && parsed?.source === SOURCE && parsed.pageHash === hash(localPage!) &&
        typeof parsed.fetchedAt === "string" && Number.isFinite(Date.parse(parsed.fetchedAt)) &&
        (parsed.etag === undefined || typeof parsed.etag === "string") &&
        (parsed.lastModified === undefined || typeof parsed.lastModified === "string")) metadata = parsed;
  } catch {}
  const result = async (guide: Guide, status: Receipt["status"], info?: HttpMetadata, warning?: string): Promise<Receipt> => ({
    ...await publishGuide(directory, guide), version: guide.version, status,
    ...(info ? { fetchedAt: info.fetchedAt } : {}), ...(warning ? { warning } : {}),
  });
  if (options.offline) {
    if (!localGuide) throw new Error("没有可验证的本地页面，无法离线继续；旧版分片不等于新版参考");
    return result(localGuide, "offline", metadata, "使用本地参考，未检查官方页面更新");
  }
  let downloaded: Awaited<ReturnType<typeof download>>;
  let guide: Guide;
  try {
    downloaded = await download(fetcher, options.refresh ? undefined : metadata);
    if (downloaded.response.status === 304) {
      if (options.refresh || !localGuide || !(metadata?.etag || metadata?.lastModified)) throw new Error("304 响应没有匹配的本地页面校验器");
      return result(localGuide, "not-modified", metadata);
    }
    guide = resolveGuide(downloaded.page!, options.model);
  } catch (error) {
    if (!localGuide || options.refresh) throw error;
    return result(localGuide, "stale", metadata,
      `更新失败；使用 GPT Image ${localGuide.version} 本地参考，不能声称已验证最新：${(error as Error).message}`);
  }
  const next: HttpMetadata = { source: SOURCE, pageHash: hash(downloaded.page!), fetchedAt: new Date().toISOString(),
    etag: downloaded.response.headers.get("etag") ?? undefined,
    lastModified: downloaded.response.headers.get("last-modified") ?? undefined };
  const receipt = await result(guide, downloaded.page === localPage ? "unchanged" : "downloaded", next);
  if (downloaded.page !== localPage) await writeAtomic(pagePath, downloaded.page!);
  await writeAtomic(metadataPath, JSON.stringify(next, null, 2) + "\n");
  return receipt;
}

if (import.meta.main) {
  const usage = "用法：bun scripts/fetch-guide.ts [--refresh | --offline] [--model <version>]";
  try {
    const args = process.argv.slice(2);
    if (args.length === 1 && args[0] === "--help") {
      process.stdout.write(`${usage}\n`);
    } else {
      const options: Options = {};
      for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg === "--refresh" && !options.refresh) options.refresh = true;
        else if (arg === "--offline" && !options.offline) options.offline = true;
        else if (arg === "--model" && !options.model && args[i + 1]) options.model = args[++i];
        else throw new Error(usage);
      }
      process.stdout.write(`${JSON.stringify(await ensureGuide(CACHE_DIR, options))}\n`);
    }
  } catch (error) {
    process.stderr.write(`抓取失败：${(error as Error).message}\n`);
    process.exitCode = 1;
  }
}
