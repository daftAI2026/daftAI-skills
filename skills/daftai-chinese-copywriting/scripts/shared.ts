import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

export type Mode = "review" | "stable" | "quick";
export type InputKind = "text" | "file";
export type SaveScope = "user" | "project";

export interface Preferences {
  version: number;
  defaultMode: Mode;
  language: string;
  chunkThreshold: number;
  chunkMaxWords: number;
}

export interface ProtectedContent {
  content: string;
  blocks: Array<{ token: string; original: string }>;
}

export interface ResolvedInput {
  kind: InputKind;
  label: string;
  content: string;
  filePath?: string;
  extension: string;
}

export interface PreferenceResolution {
  preferences: Preferences;
  sourcePath: string | null;
  created: boolean;
}

export const SKILL_NAME = "daftai-chinese-copywriting";

export const DEFAULT_PREFERENCES: Preferences = {
  version: 1,
  defaultMode: "stable",
  language: "zh",
  chunkThreshold: 4000,
  chunkMaxWords: 5000,
};

export function getProjectPreferencesPath(cwd: string = process.cwd()): string {
  return path.join(cwd, ".daftAI-skills", SKILL_NAME, "EXTEND.json");
}

export function getUserPreferencesPath(homeDir: string = os.homedir()): string {
  return path.join(homeDir, ".daftAI-skills", SKILL_NAME, "EXTEND.json");
}

export function writePreferences(filePath: string, preferences: Preferences): void {
  const extension = path.extname(filePath).toLowerCase();
  if (extension !== ".json" && extension !== ".md") {
    throw new Error(`Unsupported preferences format: ${filePath}`);
  }

  if (extension === ".json") {
    const stored = {
      version: preferences.version,
      default_mode: preferences.defaultMode,
      language: preferences.language,
      chunk_threshold: preferences.chunkThreshold,
      chunk_max_words: preferences.chunkMaxWords,
    };
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, `${JSON.stringify(stored, null, 2)}\n`, "utf8");
    return;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const lines = [
    "---",
    `version: ${preferences.version}`,
    `default_mode: ${preferences.defaultMode}`,
  ];
  lines.push(
    `language: ${preferences.language}`,
    `chunk_threshold: ${preferences.chunkThreshold}`,
    `chunk_max_words: ${preferences.chunkMaxWords}`,
    "---",
    "",
  );

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

export function loadPreferences(filePath: string): Preferences {
  const content = fs.readFileSync(filePath, "utf8");
  if (path.extname(filePath).toLowerCase() === ".json") {
    return parseJsonPreferences(content, filePath);
  }

  const parsed = parseFrontmatter(content);

  return {
    version: toNumber(parsed.version, DEFAULT_PREFERENCES.version),
    defaultMode: toMode(parsed.default_mode, DEFAULT_PREFERENCES.defaultMode),
    language: toStringValue(parsed.language, DEFAULT_PREFERENCES.language),
    chunkThreshold: toNumber(parsed.chunk_threshold, DEFAULT_PREFERENCES.chunkThreshold),
    chunkMaxWords: toNumber(parsed.chunk_max_words, DEFAULT_PREFERENCES.chunkMaxWords),
  };
}

export function resolvePreferences(
  cwd: string = process.cwd(),
  homeDir: string = os.homedir(),
): PreferenceResolution {
  const directories = [
    path.dirname(getProjectPreferencesPath(cwd)),
    path.dirname(getUserPreferencesPath(homeDir)),
  ];
  for (const directory of directories) {
    for (const filename of ["EXTEND.json", "EXTEND.md"]) {
      const filePath = path.join(directory, filename);
      if (fs.existsSync(filePath)) {
        return {
          preferences: loadPreferences(filePath),
          sourcePath: filePath,
          created: false,
        };
      }
    }
  }

  return {
    preferences: DEFAULT_PREFERENCES,
    sourcePath: null,
    created: false,
  };
}

export function ensurePreferencesConfigured(
  resolution: PreferenceResolution,
): PreferenceResolution {
  if (resolution.sourcePath) {
    return resolution;
  }

  throw new Error(
    "First-time setup required: no EXTEND.json or legacy EXTEND.md found. Ask the user all setup questions in one round, then run `bun scripts/main.ts init --mode <stable|quick> --scope <user|project>` before running quick or stable.",
  );
}

export function resolveMode(explicitMode: Mode | undefined, preferences: Preferences): Mode {
  return explicitMode ?? preferences.defaultMode;
}

export function resolveInputs(rawArgs: string[], cwd: string = process.cwd()): ResolvedInput[] {
  if (rawArgs.length === 0) {
    throw new Error("Missing input. Pass text or file path(s).");
  }

  const files: ResolvedInput[] = [];
  const textParts: string[] = [];

  for (const arg of rawArgs) {
    const candidatePath = path.resolve(cwd, arg);
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      const extension = path.extname(candidatePath).toLowerCase();
      if (![".md", ".txt"].includes(extension)) {
        throw new Error(`Unsupported file type: ${extension || "(none)"}. Only .md and .txt are supported.`);
      }
      files.push({
        kind: "file",
        label: candidatePath,
        content: fs.readFileSync(candidatePath, "utf8"),
        filePath: candidatePath,
        extension,
      });
    } else {
      textParts.push(arg);
    }
  }

  if (files.length > 0) {
    if (textParts.length > 0) {
      throw new Error(`Mixed file and text input not supported. Got ${files.length} file(s) and text: "${textParts.join(" ")}"`);
    }
    return files;
  }

  const content = textParts.join(" ");
  const extension = looksLikeMarkdown(content) ? ".md" : ".txt";
  return [{
    kind: "text",
    label: "<text>",
    content,
    extension,
  }];
}

export function protectSyntax(content: string): ProtectedContent {
  const blocks: Array<{ token: string; original: string }> = [];
  let idx = 0;

  const replace = (tag: string, original: string, preserveLines = false): string => {
    if (preserveLines) {
      const lines = original.split("\n");
      const token = lines.map((_, li) =>
        li === 0 ? `__DAFTAI_${tag}_${idx}__` : `__DAFTAI_${tag}_${idx}_L${li}__`
      ).join("\n");
      blocks.push({ token, original });
      idx += 1;
      return token;
    }
    const token = `__DAFTAI_${tag}_${idx}__`;
    blocks.push({ token, original });
    idx += 1;
    return token;
  };

  let s = content;
  // 1. Fenced code blocks (preserve line count for autocorrect compatibility)
  s = s.replace(/```[\s\S]*?```/g, (m) => replace("FENCE", m, true));
  // 2. Block math $$...$$
  s = s.replace(/\$\$[\s\S]*?\$\$/g, (m) => replace("BMATH", m, true));
  // 3. Inline code `...`
  s = s.replace(/`[^`\n]+`/g, (m) => replace("CODE", m));
  // 4. Inline math $...$  (not preceded/followed by $)
  s = s.replace(/(?<!\$)\$(?!\$|\s)([^\n$]+?)(?<!\s)\$(?!\$)/g, (m) => replace("IMATH", m));
  // 5. Image/link URLs — protect only the (url) part, keep [text] for copywriting rules
  s = s.replace(/(!?\[[^\]]*\])\(([^)]+)\)/g, (_, text, url) => {
    const urlToken = replace("URL", url);
    return `${text}(${urlToken})`;
  });

  return { content: s, blocks };
}

export function restoreSyntax(content: string, blocks: ProtectedContent["blocks"]): string {
  let restored = content;
  for (const block of blocks) {
    restored = restored.replaceAll(block.token, () => block.original);
  }
  return restored;
}

/** @deprecated Use protectSyntax instead */
export const protectFencedCodeBlocks = protectSyntax;
/** @deprecated Use restoreSyntax instead */
export const restoreFencedCodeBlocks = restoreSyntax;

export function computeOutputPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const base = path.basename(filePath, ext);
  return path.join(dir, `${base}-corrected${ext}`);
}

export function computeReviewOutputPath(filePath: string): string {
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, path.extname(filePath));
  return path.join(dir, `${base}-review.md`);
}

export function renderSummary(params: {
  mode: Mode;
  input: ResolvedInput;
  engine: string;
  preferencesPath: string | null;
  preferencesCreated: boolean;
  installAttempted: boolean;
  changed: boolean;
  lintOutput?: string;
  outputPath?: string;
}): string {
  const lines: string[] = [];
  lines.push(`Mode: ${params.mode}`);
  lines.push(`Input: ${params.input.label}`);
  lines.push(`Engine: ${params.engine}`);

  if (params.preferencesPath) {
    lines.push(`Preferences: ${params.preferencesPath}${params.preferencesCreated ? " (created)" : ""}`);
  }

  if (params.installAttempted) {
    lines.push("Dependency: autocorrect installed during this run");
  }

  if (params.mode === "review") {
    lines.push(`Result: ${params.changed ? "issues found" : "no issues found"}`);
    if (params.changed && params.lintOutput) {
      lines.push("");
      lines.push(params.lintOutput.trim());
    }
    return lines.join("\n");
  }

  lines.push(`Result: ${params.changed ? "content updated" : "already clean"}`);
  if (params.outputPath) {
    lines.push(`Output: ${params.outputPath}`);
  }
  if (params.mode === "stable") {
    lines.push("");
    lines.push("⚠ autocorrect pass complete. AI post-processing (Step 4–6) still required — do NOT report completion yet.");
  }
  return lines.join("\n");
}

function parseJsonPreferences(content: string, filePath: string): Preferences {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`Invalid preferences JSON: ${filePath}`);
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error(`Preferences JSON must be an object: ${filePath}`);
  }

  const data = parsed as Record<string, unknown>;
  const allowed = new Set(["version", "default_mode", "language", "chunk_threshold", "chunk_max_words"]);
  for (const key of Object.keys(data)) {
    if (!allowed.has(key)) {
      throw new Error(`Unknown preferences field "${key}": ${filePath}`);
    }
  }

  const read = <T>(key: string, fallback: T, valid: (value: unknown) => value is T): T => {
    const value = data[key];
    if (value === undefined) return fallback;
    if (!valid(value)) throw new Error(`Invalid preferences field "${key}": ${filePath}`);
    return value;
  };

  return {
    version: read("version", DEFAULT_PREFERENCES.version, (value): value is number => value === 1),
    defaultMode: read("default_mode", DEFAULT_PREFERENCES.defaultMode, isMode),
    language: read("language", DEFAULT_PREFERENCES.language,
      (value): value is string => typeof value === "string" && value.trim().length > 0),
    chunkThreshold: read("chunk_threshold", DEFAULT_PREFERENCES.chunkThreshold, isPositiveInteger),
    chunkMaxWords: read("chunk_max_words", DEFAULT_PREFERENCES.chunkMaxWords, isPositiveInteger),
  };
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isMode(value: unknown): value is Mode {
  return value === "review" || value === "stable" || value === "quick";
}

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) {
    return {};
  }

  const data: Record<string, string> = {};
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");
    data[key] = value;
  }

  return data;
}

function toNumber(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStringValue(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

function toMode(value: string | undefined, fallback: Mode): Mode {
  if (isMode(value)) {
    return value;
  }
  return fallback;
}

function looksLikeMarkdown(content: string): boolean {
  return /```|^# |\[[^\]]+\]\([^)]+\)/m.test(content);
}
