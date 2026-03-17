#!/usr/bin/env npx tsx

import * as fs from "node:fs";

import { ensureAutocorrect, runAutocorrect } from "./autocorrect";
import {
  protectFencedCodeBlocks,
  renderSummary,
  resolveInput,
  resolveMode,
  resolvePreferences,
  restoreFencedCodeBlocks,
  type Mode,
} from "./shared";

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const firstArg = args[0];

  if (!firstArg || firstArg === "--help" || firstArg === "-h") {
    printHelp();
    process.exit(firstArg ? 0 : 1);
  }

  const explicitMode = toMode(firstArg);
  const rawInputArgs = explicitMode ? args.slice(1) : args;
  const preferenceState = await resolvePreferences();
  const mode = resolveMode(explicitMode, preferenceState.preferences);
  const input = resolveInput(rawInputArgs);

  const engineState = ensureAutocorrect(preferenceState.preferences.autoInstallAutocorrect);
  if (!engineState.available) {
    throw new Error(engineState.installLog);
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

  if (mode !== "review" && input.kind === "file" && correctedContent !== undefined && changed) {
    fs.writeFileSync(input.filePath!, correctedContent, "utf8");
  }

  const summary = renderSummary({
    mode,
    input,
    reportStyle: preferenceState.preferences.reportStyle,
    engine: "autocorrect",
    preferencesPath: preferenceState.sourcePath,
    preferencesCreated: preferenceState.created,
    installAttempted: engineState.installAttempted,
    changed,
    lintOutput: runResult.lintOutput,
    correctedContent,
  });

  console.log(summary);

  if (input.kind === "text" && correctedContent && mode !== "review") {
    console.log("");
    console.log(correctedContent);
  }
}

function printHelp(): void {
  console.log("Usage:");
  console.log("  npx tsx scripts/main.ts review <input>");
  console.log("  npx tsx scripts/main.ts stable <input>");
  console.log("  npx tsx scripts/main.ts quick <input>");
  console.log("");
  console.log("Input:");
  console.log("  - Direct text");
  console.log("  - Single .md or .txt file path");
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
