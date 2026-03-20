#!/usr/bin/env npx tsx

import * as fs from "node:fs";

import { ensureAutocorrect, runAutocorrect } from "./autocorrect";
import {
  computeOutputPath,
  DEFAULT_PREFERENCES,
  ensurePreferencesConfigured,
  getProjectPreferencesPath,
  getUserPreferencesPath,
  protectFencedCodeBlocks,
  renderSummary,
  resolveInputs,
  resolveMode,
  resolvePreferences,
  restoreFencedCodeBlocks,
  writePreferences,
  type Mode,
  type Preferences,
  type ReportStyle,
} from "./shared";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const firstArg = args[0];

  if (!firstArg || firstArg === "--help" || firstArg === "-h") {
    printHelp();
    process.exit(firstArg ? 0 : 1);
  }

  if (firstArg === "init") {
    runInit(args.slice(1));
    return;
  }

  const explicitMode = toMode(firstArg);
  const rawInputArgs = explicitMode ? args.slice(1) : args;
  const preferenceState = ensurePreferencesConfigured(resolvePreferences());
  const mode = resolveMode(explicitMode, preferenceState.preferences);
  const inputs = resolveInputs(rawInputArgs);

  const engineState = ensureAutocorrect();
  if (!engineState.available) {
    throw new Error(engineState.installLog);
  }

  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    if (i > 0) {
      console.log("");
      console.log("---");
      console.log("");
    }

    const protectedContent = protectFencedCodeBlocks(input.content);
    const runResult = runAutocorrect({
      mode,
      content: protectedContent.content,
      extension: input.extension,
      label: input.label,
    });

    const correctedContent = runResult.correctedContent
      ? restoreFencedCodeBlocks(runResult.correctedContent, protectedContent.blocks)
      : undefined;
    const changed = correctedContent !== undefined
      ? correctedContent !== input.content
      : runResult.changed;

    let outputPath: string | undefined;
    if (mode !== "review" && input.kind === "file" && correctedContent !== undefined && changed) {
      outputPath = computeOutputPath(input.filePath!);
      fs.writeFileSync(outputPath, correctedContent, "utf8");
    }

    const summary = renderSummary({
      mode,
      input,
      reportStyle: preferenceState.preferences.reportStyle,
      engine: "autocorrect",
      preferencesPath: i === 0 ? preferenceState.sourcePath : null,
      preferencesCreated: i === 0 && preferenceState.created,
      installAttempted: i === 0 && engineState.installAttempted,
      changed,
      lintOutput: runResult.lintOutput,
      correctedContent,
      outputPath,
    });

    console.log(summary);

    if (input.kind === "text" && correctedContent && mode !== "review") {
      console.log("");
      console.log(correctedContent);
    }
  }
}

function runInit(args: string[]): void {
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--") && i + 1 < args.length) {
      opts[arg.slice(2)] = args[i + 1];
      i++;
    }
  }

  const preferences: Preferences = {
    ...DEFAULT_PREFERENCES,
    defaultMode: toMode(opts["mode"]) ?? DEFAULT_PREFERENCES.defaultMode,
    reportStyle: toReportStyle(opts["report-style"]) ?? DEFAULT_PREFERENCES.reportStyle,
  };

  const scope = opts["scope"] === "project" ? "project" : "user";
  const filePath = scope === "project"
    ? getProjectPreferencesPath()
    : getUserPreferencesPath();

  writePreferences(filePath, preferences);
  console.log(`Preferences saved to ${filePath}`);
}

function printHelp(): void {
  console.log("Usage:");
  console.log("  npx tsx scripts/main.ts review <input...>");
  console.log("  npx tsx scripts/main.ts stable <input...>");
  console.log("  npx tsx scripts/main.ts quick <input...>");
  console.log("  npx tsx scripts/main.ts init [--mode <mode>] [--report-style <style>] [--scope <user|project>]");
  console.log("");
  console.log("Input:");
  console.log("  - Direct text");
  console.log("  - One or more .md / .txt file paths");
}

function toReportStyle(value: string | undefined): ReportStyle | undefined {
  if (value === "brief" || value === "detailed") {
    return value;
  }
  return undefined;
}

function toMode(value: string | undefined): Mode | undefined {
  if (value === "review" || value === "stable" || value === "quick") {
    return value;
  }
  return undefined;
}

main().catch((error: Error) => {
  console.error(`Error: ${error.message}`);
  process.exit(1);
});
