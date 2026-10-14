/**
 * [INPUT]: 依赖平台受控文件访问、非执行配置解析和目录元数据
 * [OUTPUT]: 提供单目录轻量索引与逐文件有界取证，返回范围指纹
 * [POS]: Agent 按调用链取证的入口；不先读取全仓正文，不执行项目
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import path from 'node:path';
import type { AuditFs } from './audit-fs.ts';
import { openAuditFs, resolveAuditPath } from './audit-fs.ts';
import type { AuditOptions, ConfigInventory, UnknownItem } from './audit-types.ts';
import { CONFIG_NAMES, DEFAULT_LIMITS, EXCLUDED_DIRS, MAX_INVENTORY_BYTES, SOURCE_EXTENSIONS } from './audit-types.ts';
import { isSensitivePath } from './discovery.ts';
import { digest, isWithin, object, statFingerprint } from './fs-common.ts';
import { parseConfig, parseWranglerEnvironments, validAuxiliaryConfig, hasWorkerConfigSignal, migrationDirectories } from './config.ts';
import { writeInventoryOutput } from './audit-engine.ts';
import { scanSource } from './source-scan.ts';

type EvidenceKind = 'source-js-ts' | 'd1-migration-sql' | 'github-workflow-yaml';
export type IndexEntry = { path: string; kind: EvidenceKind | 'directory'; bytes: number; statFingerprint: string };
export type ScopeIndex = {
  schemaVersion: '2.0'; mode: 'scope-index'; generatedAt: string;
  runtimePlatform: string; secureReadMode: AuditFs['mode']; projectRootFingerprint: string;
  directory: string; status: 'indexed' | 'partial'; entries: IndexEntry[];
  directoryFingerprint: string; entriesFingerprint: string; observedEntries: number; truncated: boolean;
  configs: ConfigInventory[]; configFingerprints: Array<{ path: string; sha256: string; statFingerprint: string }>;
  unknowns: UnknownItem[]; skipped: number;
};
export type RangeEvidence = {
  schemaVersion: '2.0'; path: string; kind: EvidenceKind; offset: number; bytes: number; fileBytes: number;
  nextOffset: number | null; completeFile: boolean; sha256: string; statFingerprint: string;
  projectRootFingerprint: string; secureReadMode: AuditFs['mode']; generatedAt: string;
  text: string | null; contentBase64: string;
  candidateScan: { status: string; findings: ReturnType<typeof scanSource>['findings']; unknowns: string[] };
};

function safeRelative(relative: string, directory = false): boolean {
  if (directory && relative === '.') return true;
  const parts = relative.split('/');
  return relative.length <= 4096 && parts.length <= 64 && !path.posix.isAbsolute(relative)
    && !relative.includes('\\') && !relative.includes('\0')
    && parts.every(part => part !== '' && part !== '.' && part !== '..' && !isSensitivePath(part) && !EXCLUDED_DIRS.has(part.toLowerCase()));
}

function ancestorDirectories(directory: string): string[] {
  const result = ['.'];
  if (directory !== '.') {
    const parts = directory.split('/');
    for (let i = 1; i <= parts.length; i++) result.push(parts.slice(0, i).join('/'));
  }
  return result;
}

function indexOnTree(tree: AuditFs, directory: string): ScopeIndex {
  if (!safeRelative(directory, true)) throw new Error('unsafe-index-directory');
  const index: ScopeIndex = {
    schemaVersion: '2.0', mode: 'scope-index', generatedAt: new Date().toISOString(),
    runtimePlatform: process.platform, secureReadMode: tree.mode, projectRootFingerprint: tree.rootFingerprint(),
    directory, status: 'indexed', entries: [], configs: [], configFingerprints: [], unknowns: [], skipped: 0,
    directoryFingerprint: '', entriesFingerprint: '', observedEntries: 0, truncated: false,
  };
  const selectedMigrations = new Set<string>();
  const configCounts = new Map<string, number>();
  const auxiliaryDeclarations: Array<{ ancestor: string; workers: boolean; migrations: string[] }> = [];
  const migrationOwners = new Map<string, number>();
  let workersConfig = false;
  let configBytes = 0;
  for (const ancestor of ancestorDirectories(directory)) for (const name of CONFIG_NAMES) {
    const relative = ancestor === '.' ? name : `${ancestor}/${name}`;
    const info = tree.inspectFile(relative);
    if (info.status === 'missing') continue;
    configCounts.set(ancestor, (configCounts.get(ancestor) ?? 0) + 1);
    if (info.status !== 'file' || !info.stat || !info.parentFingerprint) {
      index.unknowns.push({ code: 'config-not-read', detail: `${relative}: ${info.status}` });
      continue;
    }
    const available = Math.min(DEFAULT_LIMITS.maxFileBytes, DEFAULT_LIMITS.maxTotalBytes - configBytes);
    const expected = { stat: info.stat, statFingerprint: statFingerprint(info.stat, info.parentFingerprint) };
    const read = tree.readFile(relative, available, expected);
    if (read.text === undefined) {
      index.unknowns.push({ code: 'config-not-read', detail: `${relative}: ${read.error ?? 'unreadable'}; configuration batch limit is not an audit completion condition.` });
      continue;
    }
    configBytes += read.bytes ?? 0;
    const format = name.endsWith('.toml') ? 'toml' : name.endsWith('.jsonc') ? 'jsonc' : 'json';
    const parsed = parseConfig(format, read.text);
    const candidate = { relative, kind: 'config' as const, stat: info.stat, parentFingerprint: info.parentFingerprint };
    index.configs.push(parseWranglerEnvironments(tree, candidate, parsed.value, format, parsed.status, index.unknowns));
    index.configFingerprints.push({ path: relative, sha256: read.sha256!, statFingerprint: read.statFingerprint! });
    const valid = ['supported-jsonc', 'supported-bun-toml'].includes(parsed.status) && validAuxiliaryConfig(relative, parsed.value);
    if (!valid) index.unknowns.push({ code: 'config-not-understood', detail: `${relative}: ${parsed.status}; auxiliary review is not authorized by this config.` });
    if (valid) {
      const migrations: string[] = [];
      const selections = migrationDirectories(relative, parsed.value);
      if (selections.length > 1) index.unknowns.push({ code: 'd1-migration-binding-attribution-unknown', detail: `${relative}: multiple D1 binding scopes; migration files are not attributed to a single database.` });
      for (const selection of selections) {
        if (selection.invalid || !selection.directory) index.unknowns.push({ code: 'd1-migration-directory-invalid', detail: `${relative}: migration directory remains unknown.` });
        else migrations.push(selection.directory);
      }
      const workers = hasWorkerConfigSignal(parsed.value);
      auxiliaryDeclarations.push({ ancestor, workers, migrations });
    }
  }
  for (const [ancestor, count] of configCounts) if (count > 1)
    index.unknowns.push({ code: 'ambiguous-workspace-config', detail: `${ancestor}: multiple Wrangler config candidates; auxiliary authorization from this workspace is unavailable without explicit config selection.` });
  for (const declaration of auxiliaryDeclarations) if (configCounts.get(declaration.ancestor) === 1) {
    workersConfig ||= declaration.workers;
    declaration.migrations.forEach(directory => {
      selectedMigrations.add(directory);
      migrationOwners.set(directory, (migrationOwners.get(directory) ?? 0) + 1);
    });
  }
  for (const [directory, count] of migrationOwners) if (count > 1)
    index.unknowns.push({ code: 'd1-migration-binding-attribution-unknown', detail: `${directory}: selected by multiple D1 binding scopes; database ownership is unknown.` });
  const listing = tree.listDirectory(directory, DEFAULT_LIMITS.maxEntries);
  index.directoryFingerprint = listing.directoryFingerprint;
  index.observedEntries = listing.entries.length;
  index.truncated = listing.capped;
  index.entriesFingerprint = digest(JSON.stringify(listing.entries.map(entry =>
    [entry.name, entry.isDirectory() ? 'directory' : entry.isFile() ? 'file' : entry.isSymbolicLink() ? 'symlink' : 'other'])
    .sort(([a], [b]) => a!.localeCompare(b!))));
  if (listing.capped) index.unknowns.push({ code: 'index-directory-truncated', detail: `${directory}: directory entry batch limit reached; this directory is not fully indexed.` });
  if (!index.configs.length) index.unknowns.push({ code: 'no-ancestor-wrangler-config', detail: `${directory}: no readable ancestor Wrangler config; nested or sibling configs and deployment wiring remain unknown. Auxiliary evidence is unavailable without its config.` });
  for (const entry of listing.entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = directory === '.' ? entry.name : `${directory}/${entry.name}`;
    if (!safeRelative(relative)) { index.skipped++; continue; }
    if (entry.isSymbolicLink() || (!entry.isFile() && !entry.isDirectory())) {
      index.skipped++;
      index.unknowns.push({ code: 'index-entry-not-read', detail: `${relative}: link or nonregular entry excluded; reachable source coverage remains unknown.` });
      continue;
    }
    const info = tree.inspectFile(relative);
    if (entry.isDirectory()) {
      if (info.status !== 'directory' || !info.stat) {
        index.skipped++;
        index.unknowns.push({ code: 'index-directory-unavailable', detail: `${relative}: safe directory metadata unavailable.` });
        continue;
      }
      index.entries.push({ path: relative, kind: 'directory', bytes: 0, statFingerprint: tree.directoryFingerprint(relative, info.stat) });
      continue;
    }
    let kind: EvidenceKind | undefined;
    const extension = path.extname(relative).toLowerCase();
    if (SOURCE_EXTENSIONS.has(extension)) kind = 'source-js-ts';
    else if (extension === '.sql' && selectedMigrations.has(directory)) kind = 'd1-migration-sql';
    else if (workersConfig && directory === '.github/workflows' && ['.yml', '.yaml'].includes(extension)) kind = 'github-workflow-yaml';
    if (!kind) continue;
    if (info.status !== 'file' || !info.stat || !info.parentFingerprint || info.stat.size > BigInt(Number.MAX_SAFE_INTEGER)) {
      index.unknowns.push({ code: 'index-file-unavailable', detail: `${relative}: safe regular file metadata unavailable.` });
      continue;
    }
    index.entries.push({ path: relative, kind, bytes: Number(info.stat.size), statFingerprint: statFingerprint(info.stat, info.parentFingerprint) });
  }
  // ----- 索引不是审阅；遗漏和文件变化必须保留 -----
  if (index.unknowns.length) index.status = 'partial';
  tree.assertRootStable();
  return index;
}

export function indexProject(projectPath: string, options: AuditOptions & { directory?: string } = {}): { index: ScopeIndex; outputDirectory?: string } {
  const root = resolveAuditPath(projectPath);
  const tree = openAuditFs(root, false, options.accessMode);
  try {
    const index = indexOnTree(tree, options.directory ?? '.');
    if (options.writeReports === false) return { index };
    const markdown = ['# Cloudflare source scope index', '', 'Metadata only; indexed files are not reviewed files.',
      `Directory: ${index.directory}; status: ${index.status}; mode: ${index.secureReadMode}`, '',
      ...index.entries.map(entry => `${JSON.stringify(entry.path)}: ${entry.kind}; ${entry.bytes} bytes`), '',
      ...index.unknowns.map(item => `${item.code}: ${item.detail}`), ''].join('\n');
    return { index, outputDirectory: writeInventoryOutput(root, index, markdown, options) };
  } finally { tree.close(); }
}

export function readIndexedEvidence(projectPath: string, inventoryPath: string, relative: string,
  options: Pick<AuditOptions, 'accessMode'> & { offset?: number; length?: number } = {}): RangeEvidence {
  if (!safeRelative(relative)) throw new Error('review-evidence-not-allowlisted');
  const root = resolveAuditPath(projectPath), absoluteInventory = resolveAuditPath(inventoryPath);
  if (path.basename(absoluteInventory) !== 'inventory.json' || isWithin(root, absoluteInventory)
    || absoluteInventory.split(path.sep).some(isSensitivePath)) throw new Error('unsafe-inventory-path');
  const inventoryTree = openAuditFs(path.dirname(absoluteInventory), false, options.accessMode);
  let value: unknown;
  try {
    const read = inventoryTree.readFile('inventory.json', MAX_INVENTORY_BYTES);
    if (read.text === undefined) throw new Error('invalid-inventory');
    try { value = JSON.parse(read.text); } catch { throw new Error('invalid-inventory'); }
  } finally { inventoryTree.close(); }
  const snapshot = object(value);
  if (!snapshot || snapshot.schemaVersion !== '2.0' || snapshot.mode !== 'scope-index' || typeof snapshot.directory !== 'string'
    || !safeRelative(snapshot.directory, true) || !Array.isArray(snapshot.entries)) throw new Error('stale-inventory');
  const expected = snapshot.entries.map(object).find(entry => entry?.path === relative);
  if (!expected || expected.kind === 'directory') throw new Error('review-evidence-not-allowlisted');
  const offset = options.offset ?? 0, length = options.length ?? DEFAULT_LIMITS.maxFileBytes;
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 1 || length > DEFAULT_LIMITS.maxFileBytes)
    throw new Error('invalid-evidence-range');
  const tree = openAuditFs(root, false, options.accessMode);
  try {
    // ----- 重建同一目录及配置权限；不信任库存内的路径授权 -----
    const fresh = indexOnTree(tree, snapshot.directory);
    if (fresh.projectRootFingerprint !== snapshot.projectRootFingerprint || fresh.secureReadMode !== snapshot.secureReadMode
      || fresh.directoryFingerprint !== snapshot.directoryFingerprint || fresh.entriesFingerprint !== snapshot.entriesFingerprint
      || fresh.observedEntries !== snapshot.observedEntries || fresh.truncated !== snapshot.truncated
      || JSON.stringify(fresh.configFingerprints) !== JSON.stringify(snapshot.configFingerprints)) throw new Error('stale-inventory');
    const current = fresh.entries.find(entry => entry.path === relative);
    if (!current || current.kind === 'directory' || current.kind !== expected.kind || current.bytes !== expected.bytes
      || current.statFingerprint !== expected.statFingerprint) throw new Error('stale-review-evidence');
    const info = tree.inspectFile(relative);
    if (info.status !== 'file' || !info.stat || !info.parentFingerprint) throw new Error('stale-review-evidence');
    const read = tree.readFile(relative, DEFAULT_LIMITS.maxFileBytes,
      { stat: info.stat, statFingerprint: current.statFingerprint }, { offset, length });
    if (read.text === undefined) throw new Error(`review-range-${read.error ?? 'unreadable'}`);
    const bytes = read.bytes ?? 0, completeFile = offset === 0 && bytes === current.bytes;
    if (!read.contentBase64) {
      // 空文件的有效原始编码为空字符串；其他范围必须由适配器提供原始字节。
      if (bytes !== 0 || read.contentBase64 !== '') throw new Error('review-range-raw-bytes-unavailable');
    }
    const raw = Buffer.from(read.contentBase64, 'base64');
    if (raw.length !== bytes || digest(raw) !== read.sha256) throw new Error('stale-review-evidence');
    let text: string | null;
    try { text = new TextDecoder('utf-8', { fatal: true }).decode(raw); } catch { text = null; }
    const mains = new Set(fresh.configs.flatMap(config => config.environments.flatMap(env => env.main.status === 'exists' && env.main.path ? [env.main.path] : [])));
    const scan = completeFile && text !== null && current.kind === 'source-js-ts' ? scanSource(text, relative, mains, DEFAULT_LIMITS.maxCandidates) : undefined;
    return {
      schemaVersion: '2.0', path: relative, kind: current.kind, offset, bytes, fileBytes: current.bytes,
      nextOffset: offset + bytes < current.bytes ? offset + bytes : null, completeFile,
      sha256: read.sha256!, statFingerprint: read.statFingerprint!, projectRootFingerprint: fresh.projectRootFingerprint,
      secureReadMode: fresh.secureReadMode, generatedAt: new Date().toISOString(), text, contentBase64: read.contentBase64,
      candidateScan: { status: scan ? scan.unsupported.length || scan.truncated ? 'partial' : 'scanned' : 'not-scanned',
        findings: scan?.findings ?? [], unknowns: scan ? [...scan.unsupported, ...(scan.truncated ? ['candidate-limit'] : [])] : ['range-or-auxiliary-not-lexically-scanned'] },
    };
  } finally { tree.close(); }
}
