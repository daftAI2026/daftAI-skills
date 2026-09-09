/**
 * [INPUT]: 依赖 Node fs/path/crypto，接收已核验的本地官方原文；不联网、不调用 LLM。
 * [OUTPUT]: 提供 splitGuide 与 ensureSections，输出逐字切片、父级上下文关系和按标题导航的索引。
 * [POS]: fetch-guide 的派生缓存层；保留连续编辑流程整体，避免把前后步骤切断。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const SPLIT_EXAMPLES = new Set(["Generate images", "Edit images", "More workflows"]);
const FORMAT_VERSION = "1";

interface Heading { title: string; level: number; offset: number }
export interface GuideSection {
  title: string;
  file: string;
  text: string;
  context?: string;
  headings: string[];
}

// --- 仅按代码块外标题定位，保留源文本字符与换行 ---
function headings(source: string): Heading[] {
  const result: Heading[] = [];
  let fence: { char: string; length: number } | undefined;
  let offset = 0;
  for (const line of source.match(/[^\n]*\n|[^\n]+$/g) ?? []) {
    const bare = line.replace(/\r?\n$/, "");
    const marker = bare.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (marker) {
      if (!fence) fence = { char: marker[1][0], length: marker[1].length };
      else if (marker[1][0] === fence.char && marker[1].length >= fence.length && !marker[2].trim()) fence = undefined;
    } else if (!fence) {
      const heading = bare.match(/^(#{2,6})[ \t]+(.+?)\s*$/);
      if (heading) result.push({ title: heading[2], level: heading[1].length, offset });
    }
    offset += line.length;
  }
  if (fence) throw new Error("Unclosed code fence in reference");
  return result;
}

export function splitGuide(source: string): GuideSection[] {
  const all = headings(source);
  const sections: GuideSection[] = [];
  let parent: string | undefined;
  let parentFile: string | undefined;
  const cuts = all.filter(h => {
    if (h.level === 2) { parent = h.title; return true; }
    return h.level === 3 && SPLIT_EXAMPLES.has(parent ?? "");
  });
  if (!cuts.length) throw new Error("No reference sections found");
  for (let i = 0; i < cuts.length; i++) {
    const h = cuts[i];
    const start = i === 0 ? 0 : h.offset;
    const end = cuts[i + 1]?.offset ?? source.length;
    const slug = h.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const file = `${String(i + 1).padStart(2, "0")}-${slug || "section"}.md`;
    const context = h.level === 3 ? parentFile : undefined;
    if (h.level === 2) parentFile = file;
    sections.push({ title: h.title, file, context, text: source.slice(start, end),
      headings: all.filter(item => item.offset >= start && item.offset < end).map(item => item.title) });
  }
  return sections;
}

async function writeIfChanged(path: string, content: string) {
  try { if (await readFile(path, "utf8") === content) return; }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
  const temporary = `${path}.${crypto.randomUUID()}.tmp`;
  try {
    await writeFile(temporary, content, { flag: "wx" });
    await rename(temporary, path);
  } finally { await rm(temporary, { force: true }); }
}

export async function ensureSections(sourcePath: string, source: string) {
  const sections = splitGuide(source);
  const digest = createHash("sha256").update(FORMAT_VERSION).update(source).digest("hex");
  const directory = join(dirname(sourcePath), `sections-${digest.slice(0, 16)}`);
  await mkdir(directory, { recursive: true });
  for (const section of sections) await writeIfChanged(join(directory, section.file), section.text);
  const basics = sections.filter(s => ["Overview", "Prompting fundamentals"].includes(s.title));
  const metadata = source.match(/^<!--[\s\S]*?-->/)?.[0] ?? "";
  const index = `${metadata}\n\n# GPT Image 2.5 Reference Index\n\n` +
    `Local generated navigation only. Source SHA-256: ${createHash("sha256").update(source).digest("hex")}\n\n` +
    `Read first: ${basics.map(s => `[${s.title}](${s.file})`).join(", ")}.\n\n` +
    "Then read only the matching task section(s) and any listed parent context. Sections contain verbatim source slices, not summaries. " +
    "Sequential refinement and runnable workflows stay intact. For a cross-reference such as a previous step or input image, locate its heading below and read that section too. " +
    "Relative links and anchors in slices remain unchanged; resolve them using this index or the official source URL. Do not load every file or the full source by default.\n\n" +
    sections.map(s => `- [${s.title}](${s.file})${s.context ? ` — read parent context: [${s.context}](${s.context})` : ""}` +
      (s.headings.length > 1 ? `\n  Included headings: ${s.headings.slice(1).join("; ")}` : "")).join("\n") + "\n";
  const indexPath = join(directory, "INDEX.md");
  await writeIfChanged(indexPath, index);
  return { indexPath, sectionCount: sections.length };
}
