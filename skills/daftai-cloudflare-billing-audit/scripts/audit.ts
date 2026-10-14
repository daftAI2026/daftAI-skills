/**
 * [INPUT]: 依赖渐进索引与兼容快速扫描的只读接口
 * [OUTPUT]: 导出审计 API；CLI 提供索引、分段取证及旧模式
 * [POS]: Skill 命令入口；不执行目标项目的配置或包脚本
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { auditProject, readReviewEvidenceFile } from './audit-engine.ts';
import { indexProject, readIndexedEvidence } from './progressive.ts';
export { indexProject, readIndexedEvidence } from './progressive.ts';
export { auditProject, readReviewEvidenceFile } from './audit-engine.ts';
export type { UnknownItem, Binding, MainStatus, EnvironmentInventory, ConfigInventory, CandidateFinding, AuditReport, ReviewEvidenceFile, AuditOptions } from './audit-types.ts';
export { stripJsoncComments, parseJsoncStrict } from './config.ts';
export { maskJavaScript, scanSource } from './source-scan.ts';
export type { SourceScanResult } from './source-scan.ts';
function parseArgs(args: string[]): { project?: string; outputDir?: string; inventory?: string; readFile?: string; help: boolean; index: boolean; directory?: string; offset?: number; length?: number } {
  let project: string | undefined;
  let outputDir: string | undefined;
  let inventory: string | undefined;
  let readFile: string | undefined;
  let help = false;
  let index = false, directory: string | undefined, offset: number | undefined, length: number | undefined;
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;
    if (arg === '--help' || arg === '-h') { help = true; continue; }
    if (arg === '--index') { index = true; continue; }
    if (arg === '--directory') { directory = args[++i]; if (!directory) throw new Error('unsafe-index-directory'); continue; }
    if (arg === '--offset' || arg === '--length') {
      const value = args[++i];
      if (!value || !/^\d+$/.test(value)) throw new Error('invalid-evidence-range');
      if (arg === '--offset') offset = Number(value); else length = Number(value);
      continue;
    }
    if (arg === '--project') { project = args[++i]; if (!project) throw new Error('missing-project-path'); continue; }
    if (arg === '--output-dir') { outputDir = args[++i]; if (!outputDir) throw new Error('missing-output-directory'); continue; }
    if (arg === '--inventory') { inventory = args[++i]; if (!inventory) throw new Error('missing-inventory-path'); continue; }
    if (arg === '--read-file') { readFile = args[++i]; if (!readFile) throw new Error('missing-review-path'); continue; }
    throw new Error('unknown-cli-option');
  }
  return { project, outputDir, inventory, readFile, help, index, directory, offset, length };
}

export function runCli(args = process.argv.slice(2)): number {
  try {
    const parsed = parseArgs(args);
    if (parsed.help) {
      console.log('Usage: bun scripts/audit.ts --project <path> [--output-dir <audit-workdir>] | --project <path> --inventory <inventory.json> --read-file <listed-relative-path>');
      console.log('Progressive: --index --project <path> [--directory <relative-directory>] [--output-dir <audit-workdir>] | --index --project <path> --inventory <inventory.json> --read-file <listed-relative-path> [--offset <bytes>] [--length <bytes>]');
      return 0;
    }
    if (!parsed.project) throw new Error('explicit-project-required');
    if (!parsed.index && (parsed.directory !== undefined || parsed.offset !== undefined || parsed.length !== undefined)) throw new Error('invalid-reader-arguments');
    if (parsed.inventory || parsed.readFile) {
      if (!parsed.inventory || !parsed.readFile || parsed.outputDir || parsed.directory !== undefined) throw new Error('invalid-reader-arguments');
      if (parsed.index) {
        const evidence = readIndexedEvidence(parsed.project, parsed.inventory, parsed.readFile, { offset: parsed.offset, length: parsed.length });
        process.stdout.write(`${JSON.stringify(evidence)}\n`);
        return 0;
      }
      const source = readReviewEvidenceFile(parsed.project, parsed.inventory, parsed.readFile);
      process.stdout.write(source);
      return 0;
    }
    if (parsed.index) {
      if (parsed.offset !== undefined || parsed.length !== undefined) throw new Error('invalid-reader-arguments');
      const result = indexProject(parsed.project, { directory: parsed.directory, outputDir: parsed.outputDir });
      console.log(JSON.stringify({ mode: result.index.mode, status: result.index.status, directory: result.index.directory,
        entries: result.index.entries.length, skipped: result.index.skipped, unknowns: result.index.unknowns.length, outputDirectory: result.outputDirectory }));
      return 0;
    }
    const result = auditProject(parsed.project, { outputDir: parsed.outputDir });
    console.log(JSON.stringify({ status: result.report.status, workspaces: result.report.workspaces.length, configs: result.report.configs.length, sourceFilesScanned: result.report.sourceFilesScanned, candidateFindings: result.report.findings.length, outputDirectory: result.outputDirectory }));
    return 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'audit-failed';
    const publicMessages: Record<string, string> = {
      'explicit-project-required': 'Error: pass an explicit --project <path>.',
      'project-path-not-found': 'Error: the project path does not exist or cannot be resolved.',
      'project-path-through-symlink': 'Error: the project path contains a symlink component; symlink paths are not followed.',
      'project-path-not-directory': 'Error: --project must point to a directory.',
      'output-inside-project': 'Error: output directory must be outside the target project.',
      'missing-project-path': 'Error: --project requires a path.',
      'missing-output-directory': 'Error: --output-dir requires a path.',
      'inventory-too-large': 'Error: inventory metadata exceeds 16 MiB; choose a narrower explicit project scope.',
      'secure-path-access-unsupported': 'Error: required secure filesystem access is unavailable on this host.',
      'unsafe-windows-path': 'Error: use an ordinary local Windows drive path without reserved or ambiguous components.',
      'unknown-cli-option': 'Error: unsupported command-line option.',
      'unsafe-index-directory': 'Error: index only an ordinary project-relative directory outside excluded paths.',
      'invalid-evidence-range': 'Error: use nonnegative byte offset and a positive range of at most 262144 bytes.',
      'review-range-range-out-of-bounds': 'Error: the requested offset is outside this file; use its indexed byte size.',
    };
    console.error(publicMessages[message] ?? 'Error: audit could not complete safely.');
    return /stale|inventory|review-evidence-not-allowlisted/.test(message) ? 3 : 2;
  }
}

const entryArg = process.argv[1] ? path.resolve(process.argv[1]) : '';
if (entryArg && entryArg === path.resolve(fileURLToPath(import.meta.url))) process.exitCode = runCli();
