import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { createInterface } from "node:readline/promises";

export type Mode = "review" | "stable" | "quick";
export type ReportStyle = "brief" | "detailed";
export type InputKind = "text" | "file";
export type SaveScope = "user" | "project";

export interface Preferences {
  version: number;
  defaultMode: Mode;
  autoInstallAutocorrect: boolean;
  reportStyle: ReportStyle;
  language: string;
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
  autoInstallAutocorrect: true,
  reportStyle: "brief",
  language: "zh",
};

export function getProjectPreferencesPath(cwd: string = process.cwd()): string {
  return path.join(cwd, ".daftAI-skills", SKILL_NAME, "EXTEND.md");
}

export function getUserPreferencesPath(homeDir: string = os.homedir()): string {
  return path.join(homeDir, ".daftAI-skills", SKILL_NAME, "EXTEND.md");
}

export function writePreferences(filePath: string, preferences: Preferences): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });

  const lines = [
    "---",
    `version: ${preferences.version}`,
    `default_mode: ${preferences.defaultMode}`,
    `auto_install_autocorrect: ${preferences.autoInstallAutocorrect}`,
    `report_style: ${preferences.reportStyle}`,
    `language: ${preferences.language}`,
    "---",
    "",
  ];

  fs.writeFileSync(filePath, lines.join("\n"), "utf8");
}

export function loadPreferences(filePath: string): Preferences {
  const content = fs.readFileSync(filePath, "utf8");
  const parsed = parseFrontmatter(content);

  return {
    version: toNumber(parsed.version, DEFAULT_PREFERENCES.version),
    defaultMode: toMode(parsed.default_mode, DEFAULT_PREFERENCES.defaultMode),
    autoInstallAutocorrect: toBoolean(
      parsed.auto_install_autocorrect,
      DEFAULT_PREFERENCES.autoInstallAutocorrect,
    ),
    reportStyle: toReportStyle(parsed.report_style, DEFAULT_PREFERENCES.reportStyle),
    language: toStringValue(parsed.language, DEFAULT_PREFERENCES.language),
  };
}

export async function resolvePreferences(
  cwd: string = process.cwd(),
  homeDir: string = os.homedir(),
): Promise<PreferenceResolution> {
  const projectPath = getProjectPreferencesPath(cwd);
  if (fs.existsSync(projectPath)) {
    return {
      preferences: loadPreferences(projectPath),
      sourcePath: projectPath,
      created: false,
    };
  }

  const userPath = getUserPreferencesPath(homeDir);
  if (fs.existsSync(userPath)) {
    return {
      preferences: loadPreferences(userPath),
      sourcePath: userPath,
      created: false,
    };
  }

  const setup = await runFirstTimeSetup(cwd, homeDir);
  return {
    preferences: setup.preferences,
    sourcePath: setup.path,
    created: true,
  };
}

export function resolveMode(explicitMode: Mode | undefined, preferences: Preferences): Mode {
  return explicitMode ?? preferences.defaultMode;
}

export function resolveInput(rawArgs: string[], cwd: string = process.cwd()): ResolvedInput {
  if (rawArgs.length === 0) {
    throw new Error("Missing input. Pass text or a single .md/.txt file path.");
  }

  if (rawArgs.length === 1) {
    const candidatePath = path.resolve(cwd, rawArgs[0]);
    if (fs.existsSync(candidatePath) && fs.statSync(candidatePath).isFile()) {
      const extension = path.extname(candidatePath).toLowerCase();
      if (![".md", ".txt"].includes(extension)) {
        throw new Error(`Unsupported file type: ${extension || "(none)"}. Only .md and .txt are supported.`);
      }

      return {
        kind: "file",
        label: candidatePath,
        content: fs.readFileSync(candidatePath, "utf8"),
        filePath: candidatePath,
        extension,
      };
    }
  }

  const content = rawArgs.join(" ");
  const extension = looksLikeMarkdown(content) ? ".md" : ".txt";
  return {
    kind: "text",
    label: "<text>",
    content,
    extension,
  };
}

export function protectFencedCodeBlocks(content: string): ProtectedContent {
  const blocks: Array<{ token: string; original: string }> = [];
  let blockIndex = 0;

  const protectedContent = content.replace(/```[\s\S]*?```/g, (match) => {
    const lines = match.split("\n");
    const token = lines.map((_, lineIndex) => {
      return lineIndex === 0
        ? `__DAFTAI_FENCE_BLOCK_${blockIndex}__`
        : `__DAFTAI_FENCE_BLOCK_${blockIndex}_PAD_${lineIndex}__`;
    }).join("\n");
    blocks.push({ token, original: match });
    blockIndex += 1;
    return token;
  });

  return { content: protectedContent, blocks };
}

export function restoreFencedCodeBlocks(content: string, blocks: ProtectedContent["blocks"]): string {
  let restored = content;
  for (const block of blocks) {
    restored = restored.replaceAll(block.token, block.original);
  }
  return restored;
}

export function renderSummary(params: {
  mode: Mode;
  input: ResolvedInput;
  reportStyle: ReportStyle;
  engine: string;
  preferencesPath: string | null;
  preferencesCreated: boolean;
  installAttempted: boolean;
  changed: boolean;
  lintOutput?: string;
  correctedContent?: string;
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
    if (params.changed && params.reportStyle === "detailed" && params.correctedContent) {
      lines.push("");
      lines.push("Suggested content:");
      lines.push(params.correctedContent);
    } else if (params.changed && params.lintOutput) {
      lines.push("");
      lines.push(params.lintOutput.trim());
    }
    return lines.join("\n");
  }

  lines.push(`Result: ${params.changed ? "content updated" : "already clean"}`);
  return lines.join("\n");
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

function toBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) {
    return fallback;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return fallback;
}

function toStringValue(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

function toMode(value: string | undefined, fallback: Mode): Mode {
  if (value === "review" || value === "stable" || value === "quick") {
    return value;
  }
  return fallback;
}

function toReportStyle(value: string | undefined, fallback: ReportStyle): ReportStyle {
  if (value === "brief" || value === "detailed") {
    return value;
  }
  return fallback;
}

function looksLikeMarkdown(content: string): boolean {
  return /```|^# |\[[^\]]+\]\([^)]+\)/m.test(content);
}

async function runFirstTimeSetup(
  cwd: string,
  homeDir: string,
): Promise<{ preferences: Preferences; path: string }> {
  if (!process.stdin.isTTY) {
    const filePath = getUserPreferencesPath(homeDir);
    writePreferences(filePath, DEFAULT_PREFERENCES);
    console.log(`Preferences saved to ${filePath}`);
    return {
      preferences: DEFAULT_PREFERENCES,
      path: filePath,
    };
  }

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const defaultMode = await askChoice(
      rl,
      "Default mode [stable/quick/review] (default: stable): ",
      ["stable", "quick", "review"],
      DEFAULT_PREFERENCES.defaultMode,
    );
    const autoInstall = await askBoolean(
      rl,
      "Auto-install autocorrect when missing? [Y/n] (default: yes): ",
      DEFAULT_PREFERENCES.autoInstallAutocorrect,
    );
    const reportStyle = await askChoice(
      rl,
      "Report style [brief/detailed] (default: brief): ",
      ["brief", "detailed"],
      DEFAULT_PREFERENCES.reportStyle,
    );
    const scope = await askChoice(
      rl,
      "Save preferences to [user/project] (default: user): ",
      ["user", "project"],
      "user",
    );

    const preferences: Preferences = {
      ...DEFAULT_PREFERENCES,
      defaultMode: defaultMode as Mode,
      autoInstallAutocorrect: autoInstall,
      reportStyle: reportStyle as ReportStyle,
    };

    const filePath = scope === "project"
      ? getProjectPreferencesPath(cwd)
      : getUserPreferencesPath(homeDir);
    writePreferences(filePath, preferences);
    console.log(`Preferences saved to ${filePath}`);

    return { preferences, path: filePath };
  } catch (error) {
    const filePath = getUserPreferencesPath(homeDir);
    writePreferences(filePath, DEFAULT_PREFERENCES);
    console.log(`Preferences saved to ${filePath}`);
    return {
      preferences: DEFAULT_PREFERENCES,
      path: filePath,
    };
  } finally {
    rl.close();
  }
}

async function askChoice(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  allowedValues: string[],
  fallback: string,
): Promise<string> {
  const answer = (await rl.question(prompt)).trim().toLowerCase();
  if (!answer) {
    return fallback;
  }
  return allowedValues.includes(answer) ? answer : fallback;
}

async function askBoolean(
  rl: ReturnType<typeof createInterface>,
  prompt: string,
  fallback: boolean,
): Promise<boolean> {
  const answer = (await rl.question(prompt)).trim().toLowerCase();
  if (!answer) {
    return fallback;
  }
  if (["y", "yes"].includes(answer)) {
    return true;
  }
  if (["n", "no"].includes(answer)) {
    return false;
  }
  return fallback;
}
