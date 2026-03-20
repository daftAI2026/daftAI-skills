import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawnSync } from "node:child_process";

import type { Mode } from "./shared";

export interface EnsureAutocorrectResult {
  available: boolean;
  installAttempted: boolean;
  installLog: string;
}

export interface RunAutocorrectResult {
  changed: boolean;
  correctedContent?: string;
  lintOutput?: string;
  installAttempted: boolean;
  installLog: string;
}

export function ensureAutocorrect(): EnsureAutocorrectResult {
  if (hasCommand("autocorrect")) {
    return {
      available: true,
      installAttempted: false,
      installLog: "",
    };
  }

  const attempts = [
    ["brew", ["install", "autocorrect"]],
    ["cargo", ["install", "autocorrect"]],
  ] as const;

  const logs: string[] = [];
  for (const [command, args] of attempts) {
    if (!hasCommand(command)) {
      logs.push(`Skip: ${command} not found`);
      continue;
    }

    const result = spawnSync(command, args, {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });

    logs.push(renderCommandLog(command, args, result.status, result.stdout, result.stderr));

    if (result.status === 0 && hasCommand("autocorrect")) {
      return {
        available: true,
        installAttempted: true,
        installLog: logs.join("\n\n"),
      };
    }
  }

  return {
    available: false,
    installAttempted: true,
    installLog: logs.join("\n\n") || "Unable to install autocorrect.",
  };
}

export function runAutocorrect(params: {
  mode: Mode;
  content: string;
  extension: string;
  label: string;
}): RunAutocorrectResult {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "daftai-copywriting-"));
  const tempPath = path.join(tempDir, `input${params.extension}`);

  try {
    fs.writeFileSync(tempPath, params.content, "utf8");

    if (params.mode === "review") {
      const lintResult = spawnSync("autocorrect", ["--lint", tempPath], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });
      const previewResult = spawnSync("autocorrect", [tempPath], {
        encoding: "utf8",
        maxBuffer: 10 * 1024 * 1024,
      });

      if (previewResult.status !== 0) {
        throw new Error(extractErrorMessage(previewResult.stderr, previewResult.stdout));
      }

      const correctedContent = previewResult.stdout;
      const changed = correctedContent !== params.content;

      return {
        changed,
        correctedContent,
        lintOutput: normalizeLintOutput(lintResult.stdout || lintResult.stderr, tempPath, params.label),
        installAttempted: false,
        installLog: "",
      };
    }

    const fixResult = spawnSync("autocorrect", ["--fix", tempPath], {
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });

    if (fixResult.status !== 0) {
      throw new Error(extractErrorMessage(fixResult.stderr, fixResult.stdout));
    }

    const correctedContent = fs.readFileSync(tempPath, "utf8");
    return {
      changed: correctedContent !== params.content,
      correctedContent,
      installAttempted: false,
      installLog: "",
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

function hasCommand(command: string): boolean {
  const result = spawnSync("sh", ["-lc", `command -v ${command}`], {
    stdio: "ignore",
  });
  return result.status === 0;
}

function renderCommandLog(
  command: string,
  args: readonly string[],
  status: number | null,
  stdout: string,
  stderr: string,
): string {
  const output = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n");
  const tail = output.split("\n").slice(-10).join("\n");
  return [
    `$ ${command} ${args.join(" ")}`,
    `exit: ${status ?? "null"}`,
    tail,
  ].filter(Boolean).join("\n");
}

function extractErrorMessage(stderr: string, stdout: string): string {
  const output = stderr.trim() || stdout.trim();
  return output || "autocorrect failed.";
}

function normalizeLintOutput(output: string, tempPath: string, label: string): string {
  return output.replaceAll(tempPath, label).trim();
}
