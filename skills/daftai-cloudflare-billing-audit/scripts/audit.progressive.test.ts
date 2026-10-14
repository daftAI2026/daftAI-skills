/**
 * [INPUT]: 依赖真实主机适配器、渐进 API 和临时合成项目
 * [OUTPUT]: 验证按需读取、伪造索引拒绝、续读与旧接口兼容
 * [POS]: 渐进审计回归；不运行目标代码，不访问账户
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { auditProject, indexProject, readIndexedEvidence } from './audit.ts';

function fixture(body: (root: string, area: string) => void): void {
  const area = fs.mkdtempSync(path.join(fs.realpathSync(os.tmpdir()), 'cfba-progressive-'));
  const root = path.join(area, 'project');
  fs.mkdirSync(root); fs.mkdirSync(path.join(root, 'src'));
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"src/worker.ts"}');
  fs.writeFileSync(path.join(root, 'src/worker.ts'), 'export default {};');
  try { body(root, area); } finally { fs.rmSync(area, { recursive: true, force: true }); }
}
function snapshot(root: string, area: string, directory: string): string {
  const { index } = indexProject(root, { directory, writeReports: false });
  const output = fs.mkdtempSync(path.join(area, 'snapshot-'));
  const file = path.join(output, 'inventory.json');
  fs.writeFileSync(file, JSON.stringify(index));
  return file;
}
test('indexing reads no source bodies, including local tool examples', () => fixture((root, area) => {
  fs.mkdirSync(path.join(root, '.agents'));
  fs.writeFileSync(path.join(root, '.agents/example.ts'), 'throw new Error("must not execute");');
  const stat = fs.statSync(path.join(root, 'src/worker.ts'));
  const old = fs.readSync;
  let sourceReads = 0;
  fs.readSync = ((fd: number, ...args: unknown[]) => {
    const current = fs.fstatSync(fd);
    if (current.dev === stat.dev && current.ino === stat.ino) sourceReads++;
    return Reflect.apply(old, fs, [fd, ...args]);
  }) as typeof fs.readSync;
  let file: string;
  try { file = snapshot(root, area, 'src'); assert.equal(sourceReads, 0); }
  finally { fs.readSync = old; }
  const result = readIndexedEvidence(root, file!, 'src/worker.ts');
  assert.equal(result.text, 'export default {};'); assert(result.completeFile);
}));
test('on-demand review continues beyond the old whole-audit 2MiB total', () => fixture((root, area) => {
  const data = Buffer.from(`//${'a'.repeat(400000)}\nexport default {};`);
  for (let i = 0; i < 6; i++) fs.writeFileSync(path.join(root, `src/module-${i}.ts`), data);
  const index = snapshot(root, area, 'src');
  let total = 0;
  for (let i = 0; i < 6; i++) {
    const blocks: Buffer[] = []; let offset = 0;
    do {
      const result = readIndexedEvidence(root, index, `src/module-${i}.ts`, { offset });
      const block = Buffer.from(result.contentBase64, 'base64');
      assert.equal(block.length, result.bytes); assert(result.bytes <= 262144);
      assert.equal(createHash('sha256').update(block).digest('hex'), result.sha256);
      assert.equal(result.completeFile, false); assert.equal(result.candidateScan.status, 'not-scanned');
      blocks.push(block); total += block.length; offset = result.nextOffset ?? data.length;
    } while (offset < data.length);
    assert.deepEqual(Buffer.concat(blocks), data);
  }
  assert(total > 2 * 1024 * 1024);
}));
test('unresolved package main differs from a missing local file and never imports code', () => fixture((root) => {
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"@tanstack/react-start/server-entry"}');
  const index = indexProject(root, { writeReports: false }).index;
  assert.equal(index.configs[0]!.environments[0]!.main.status, 'package-entry-unresolved');
  assert.equal(index.configs[0]!.environments[0]!.main.specifier, '@tanstack/react-start/server-entry');
  assert(index.unknowns.some(item => item.code === 'package-entry-unresolved'));
  fs.mkdirSync(path.join(root, '@tanstack/react-start'), {recursive:true});
  fs.writeFileSync(path.join(root, '@tanstack/react-start/server-entry'), 'export default {};');
  assert.equal(indexProject(root, {writeReports:false}).index.configs[0]!.environments[0]!.main.status, 'exists');
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"missing.ts"}');
  assert.equal(indexProject(root, { writeReports: false }).index.configs[0]!.environments[0]!.main.status, 'missing');
}));
test('forged index entries cannot authorize secrets, excluded paths or auxiliary content', () => fixture((root, area) => {
  fs.writeFileSync(path.join(root, 'src/not-allowed.sql'), 'select 1');
  const file = snapshot(root, area, 'src');
  const value = JSON.parse(fs.readFileSync(file, 'utf8'));
  value.entries.push({ path: 'src/not-allowed.sql', kind: 'source-js-ts', bytes: 8, statFingerprint: '0'.repeat(64) });
  fs.writeFileSync(file, JSON.stringify(value));
  assert.throws(() => readIndexedEvidence(root, file, 'src/not-allowed.sql'), /stale|allowlisted/);
  for (const name of ['../outside.ts', '/outside.ts', 'src\\worker.ts', '.git/x.ts', '.env/x.ts', '.dev.vars.production/x.ts', 'src/auth.credentials.ts'])
    assert.throws(() => readIndexedEvidence(root, file, name), /allowlisted/);
}));
test('directory additions and config changes invalidate an index', () => fixture((root, area) => {
  const file = snapshot(root, area, 'src');
  fs.writeFileSync(path.join(root, 'src/new.ts'), 'export {};');
  assert.throws(() => readIndexedEvidence(root, file, 'src/worker.ts'), /stale-inventory/);
  const fresh = snapshot(root, area, 'src');
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"src/worker.ts","vars":{"VERSION":"2"}}');
  assert.throws(() => readIndexedEvidence(root, fresh, 'src/worker.ts'), /stale-inventory/);
}));
test('changed content invalidates subsequent chunks', () => fixture((root, area) => {
  const file = snapshot(root, area, 'src');
  readIndexedEvidence(root, file, 'src/worker.ts', { length: 4 });
  fs.writeFileSync(path.join(root, 'src/worker.ts'), 'export default {changed:true};');
  assert.throws(() => readIndexedEvidence(root, file, 'src/worker.ts', { offset: 4 }), /stale/);
}));
test('UTF8 split is explicit and original bytes remain lossless', () => fixture((root, area) => {
  const data = Buffer.from('中英文'); fs.writeFileSync(path.join(root, 'src/unicode.ts'), data);
  const file = snapshot(root, area, 'src');
  const a = readIndexedEvidence(root, file, 'src/unicode.ts', { length: 2 });
  const b = readIndexedEvidence(root, file, 'src/unicode.ts', { offset: 2 });
  assert.equal(a.text, null); assert.equal(b.text, null);
  assert.deepEqual(Buffer.concat([Buffer.from(a.contentBase64, 'base64'), Buffer.from(b.contentBase64, 'base64')]), data);
}));
test('D1 and workflow evidence must retain current configuration authorization', () => fixture((root, area) => {
  fs.mkdirSync(path.join(root, 'migrations')); fs.writeFileSync(path.join(root, 'migrations/one.sql'), 'select 1;');
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"src/worker.ts","d1_databases":[{"binding":"DB","database_name":"local","database_id":"test"}]}');
  const file = snapshot(root, area, 'migrations');
  assert.equal(readIndexedEvidence(root, file, 'migrations/one.sql').kind, 'd1-migration-sql');
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"src/worker.ts"}');
  assert.throws(() => readIndexedEvidence(root, file, 'migrations/one.sql'), /stale/);
  fs.mkdirSync(path.join(root, '.github/workflows'), { recursive: true });
  fs.writeFileSync(path.join(root, '.github/workflows/build.yml'), 'name: example');
  assert.equal(readIndexedEvidence(root, snapshot(root, area, '.github/workflows'), '.github/workflows/build.yml').kind, 'github-workflow-yaml');
}));
test('range validation and legacy quick scan retain their contracts', () => fixture((root, area) => {
  const file = snapshot(root, area, 'src');
  for (const offset of [-1, NaN, Infinity, 1.5]) assert.throws(() => readIndexedEvidence(root, file, 'src/worker.ts', { offset }), /invalid-evidence-range/);
  for (const length of [0, 262145, NaN, Infinity]) assert.throws(() => readIndexedEvidence(root, file, 'src/worker.ts', { length }), /invalid-evidence-range/);
  assert.throws(() => readIndexedEvidence(root, file, 'src/worker.ts', { offset: 99999 }), /range-out-of-bounds/);
  const legacy = auditProject(root, { writeReports: false }).report;
  assert.equal(legacy.schemaVersion, '1.1'); assert(legacy.readSourceFiles.includes('src/worker.ts'));
}));
test('multiple configs in one workspace do not union auxiliary read authorization', () => fixture((root, area) => {
  fs.mkdirSync(path.join(root, 'migrations'));
  fs.writeFileSync(path.join(root, 'migrations/one.sql'), 'select 1;');
  fs.writeFileSync(path.join(root, 'wrangler.jsonc'), '{"main":"src/worker.ts","d1_databases":[{"binding":"DB","database_name":"test","database_id":"id"}]}');
  const file = snapshot(root, area, 'migrations');
  const index = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert(index.unknowns.some((item: {code:string}) => item.code === 'ambiguous-workspace-config'));
  assert.throws(() => readIndexedEvidence(root, file, 'migrations/one.sql'), /allowlisted/);
  assert.deepEqual(auditProject(root, {writeReports:false}).report.readAuxiliaryFiles, []);
  const sourceIndex = snapshot(root, area, 'src');
  assert.equal(readIndexedEvidence(root, sourceIndex, 'src/worker.ts').text, 'export default {};');
}));
test('installed command shape supports one-directory index and ranged JSON evidence', () => fixture((root, area) => {
  const entry = fileURLToPath(new URL('./audit.ts', import.meta.url));
  const command = spawnSync(process.execPath, [entry, '--index', '--project', root, '--directory', 'src', '--output-dir', path.join(area, 'results')], { encoding: 'utf8' });
  assert.equal(command.status, 0, command.stderr);
  const { outputDirectory } = JSON.parse(command.stdout);
  const read = spawnSync(process.execPath, [entry, '--index', '--project', root, '--inventory', path.join(outputDirectory, 'inventory.json'), '--read-file', 'src/worker.ts', '--length', '4'], { encoding: 'utf8' });
  assert.equal(read.status, 0, read.stderr); assert.equal(JSON.parse(read.stdout).text, 'expo');
}));
test('empty configuration never authorizes workflow text', () => fixture((root, area) => {
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{}');
  fs.mkdirSync(path.join(root, '.github/workflows'), {recursive:true});
  fs.writeFileSync(path.join(root, '.github/workflows/ci.yml'), 'name: ci');
  const file = snapshot(root, area, '.github/workflows');
  assert.throws(() => readIndexedEvidence(root, file, '.github/workflows/ci.yml'), /allowlisted/);
  assert.deepEqual(auditProject(root, {writeReports:false}).report.readAuxiliaryFiles, []);
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"assets":{"directory":"public"}}');
  assert.equal(readIndexedEvidence(root, snapshot(root, area, '.github/workflows'), '.github/workflows/ci.yml').text, 'name: ci');
}));
test('multiple D1 binding scopes retain migration attribution unknown', () => fixture((root) => {
  fs.mkdirSync(path.join(root, 'migrations'));
  fs.writeFileSync(path.join(root, 'migrations/one.sql'), 'select 1;');
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"src/worker.ts","d1_databases":[{"binding":"A"},{"binding":"B"}]}');
  const index = indexProject(root, { directory:'migrations', writeReports:false }).index;
  assert(index.unknowns.some(item => item.code === 'd1-migration-binding-attribution-unknown'));
  assert.equal(index.status, 'partial');
  assert(index.entries.some(entry => entry.kind === 'd1-migration-sql'));
}));
test('excluded links are explicit unknowns, not complete source scope', () => fixture((root) => {
  const target = path.join(root, 'src');
  fs.symlinkSync(target, path.join(root, 'linked-src'), process.platform === 'win32' ? 'junction' : 'dir');
  const index = indexProject(root, {writeReports:false}).index;
  assert.equal(index.status, 'partial'); assert.equal(index.skipped, 1);
  assert(index.unknowns.some(item => item.code === 'index-entry-not-read' && item.detail.includes('linked-src')));
}));
test('an in-project installed helper chooses another external default if the first fallback is inside target', () => fixture((_root, area) => {
  const target = path.join(area, 'cloudflare-billing-audit');
  const installed = path.join(target, '.agents/skills/daftai-cloudflare-billing-audit');
  fs.mkdirSync(installed, {recursive:true});
  const skillRoot = fileURLToPath(new URL('../', import.meta.url));
  fs.cpSync(path.join(skillRoot, 'scripts'), path.join(installed, 'scripts'), {recursive:true});
  fs.writeFileSync(path.join(target, 'wrangler.json'), '{"main":"worker.ts"}');
  fs.writeFileSync(path.join(target, 'worker.ts'), 'export default {};');
  const command = spawnSync(process.execPath, [path.join(installed, 'scripts/audit.ts'), '--index', '--project', target], {
    encoding:'utf8', env:{...process.env, TMPDIR:area, TMP:area, TEMP:area}
  });
  assert.equal(command.status, 0, command.stderr);
  const output = JSON.parse(command.stdout).outputDirectory as string;
  assert(!output.startsWith(`${target}${path.sep}`));
  assert(fs.existsSync(path.join(output, 'inventory.json')));
}));
test('legacy auxiliary authorization counts unread oversized config candidates', () => fixture((root) => {
  fs.mkdirSync(path.join(root, 'migrations'));
  fs.writeFileSync(path.join(root, 'migrations/one.sql'), 'select 1;');
  fs.writeFileSync(path.join(root, 'wrangler.json'), '{"main":"src/worker.ts","d1_databases":[{"binding":"DB"}]}');
  fs.writeFileSync(path.join(root, 'wrangler.jsonc'), '{"padding":"' + 'a'.repeat(262144) + '"}');
  const legacy = auditProject(root, {writeReports:false}).report;
  assert(legacy.unknowns.some(item => item.code === 'ambiguous-workspace-config'));
  assert.deepEqual(legacy.readAuxiliaryFiles, []);
}));
