/**
 * [INPUT]: 依赖 Node 文件系统、临时目录与 Linux/portable 文件适配器。
 * [OUTPUT]: 验证受控区间读取的边界、字节摘要与文件稳定性。
 * [POS]: scripts 文件系统适配器的真实宿主安全回归测试，不执行目标代码。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { AnchoredFs } from './linux-fs.ts';
import { MAX_INVENTORY_BYTES } from './audit-types.ts';
import { PortableFs } from './portable-fs.ts';

type ByteRange = { offset: number; length: number };
type RangeResult = { text?: string; bytes?: number; sha256?: string; statFingerprint?: string; fileBytes?: number; contentBase64?: string; error?: string };
type RangeReader = {
  readFile(relative: string, maxBytes: number, expected?: { stat: fs.BigIntStats; statFingerprint?: string }, range?: ByteRange): RangeResult;
};
type TestTree = { readFile: RangeReader['readFile']; close(): void };

const adapters: Array<{ name: string; open(root: string): TestTree }> = [
  { name: 'portable', open: root => PortableFs.openDirectory(root) as TestTree },
];
if (process.platform === 'linux') adapters.push({ name: 'linux-anchored', open: root => AnchoredFs.openDirectory(root) as TestTree });

function fixture(body: (root: string) => void): void {
  const base = fs.realpathSync(os.tmpdir());
  const root = fs.mkdtempSync(path.join(base, 'cfba-range-'));
  try { body(root); } finally { fs.rmSync(root, { recursive: true, force: true }); }
}

function read(tree: TestTree, relative: string, maxBytes: number, range?: ByteRange, expected?: { stat: fs.BigIntStats; statFingerprint?: string }): RangeResult {
  return tree.readFile(relative, maxBytes, expected, range);
}

for (const adapter of adapters) {
  test(`${adapter.name}: resumes bounded ranges across a file larger than 2 MiB`, () => fixture(root => {
    const content = Buffer.alloc(2 * 1024 * 1024 + 123);
    for (let index = 0; index < content.length; index++) content[index] = index % 251;
    fs.writeFileSync(path.join(root, 'large.bin'), content);
    const tree = adapter.open(root);
    try {
      let totalBytes = 0;
      const chunkSize = 256 * 1024;
      for (let offset = 0; offset < content.length; offset += chunkSize) {
        const result = read(tree, 'large.bin', chunkSize, { offset, length: chunkSize });
        const expected = content.subarray(offset, Math.min(offset + chunkSize, content.length));
        assert.equal(result.error, undefined);
        assert.equal(result.fileBytes, content.length);
        assert.equal(result.bytes, expected.length);
        assert.equal(result.sha256, requireHash(expected));
        totalBytes += result.bytes!;
      }
      assert.equal(totalBytes, content.length);
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: hashes the exact returned UTF-8 bytes, including split code points`, () => fixture(root => {
    const content = Buffer.from('A🌱漢字🫧Z', 'utf8');
    fs.writeFileSync(path.join(root, 'unicode.txt'), content);
    const tree = adapter.open(root);
    try {
      const range = content.subarray(2, 9);
      const result = read(tree, 'unicode.txt', 16, { offset: 2, length: range.length });
      assert.equal(result.error, undefined);
      assert.equal(result.bytes, range.length);
      assert.equal(result.fileBytes, content.length);
      assert.equal(result.sha256, requireHash(range));
      assert.equal(result.text, range.toString('utf8'));
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: base64 chunks reconstruct raw bytes across a Chinese UTF-8 boundary`, () => fixture(root => {
    const chunkSize = 256 * 1024;
    const content = Buffer.concat([Buffer.alloc(chunkSize - 1, 'x'), Buffer.from('中文后续内容', 'utf8')]);
    fs.writeFileSync(path.join(root, 'boundary.txt'), content);
    const tree = adapter.open(root);
    try {
      const firstBytes = content.subarray(0, chunkSize);
      const secondBytes = content.subarray(chunkSize);
      const first = read(tree, 'boundary.txt', chunkSize, { offset: 0, length: chunkSize });
      const second = read(tree, 'boundary.txt', chunkSize, { offset: chunkSize, length: chunkSize });
      assert.equal(first.error, undefined);
      assert.equal(second.error, undefined);
      assert.equal(first.contentBase64, firstBytes.toString('base64'));
      assert.equal(second.contentBase64, secondBytes.toString('base64'));
      assert.deepEqual(Buffer.concat([
        Buffer.from(first.contentBase64!, 'base64'),
        Buffer.from(second.contentBase64!, 'base64'),
      ]), content);
      assert.equal(first.sha256, requireHash(firstBytes));
      assert.equal(second.sha256, requireHash(secondBytes));
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: permits EOF-short final ranges and empty-file offset zero`, () => fixture(root => {
    fs.writeFileSync(path.join(root, 'small.txt'), 'abcdef');
    fs.writeFileSync(path.join(root, 'empty.txt'), Buffer.alloc(0));
    const tree = adapter.open(root);
    try {
      const tail = read(tree, 'small.txt', 4, { offset: 4, length: 4 });
      assert.equal(tail.error, undefined);
      assert.equal(tail.text, 'ef');
      assert.equal(tail.bytes, 2);
      assert.equal(tail.fileBytes, 6);
      const empty = read(tree, 'empty.txt', 4, { offset: 0, length: 4 });
      assert.equal(empty.error, undefined);
      assert.equal(empty.text, '');
      assert.equal(empty.bytes, 0);
      assert.equal(empty.fileBytes, 0);
      assert.equal(empty.sha256, requireHash(Buffer.alloc(0)));
      assert.equal(read(tree, 'small.txt', 4, { offset: 6, length: 1 }).error, 'range-out-of-bounds');
      assert.equal(read(tree, 'empty.txt', 4, { offset: 1, length: 1 }).error, 'range-out-of-bounds');
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: rejects invalid limits and ranges before reading`, () => fixture(root => {
    fs.writeFileSync(path.join(root, 'data.txt'), 'abcdef');
    const tree = adapter.open(root);
    try {
      for (const range of [
        { offset: -1, length: 1 }, { offset: 0, length: 0 }, { offset: 0, length: -1 },
        { offset: 0.5, length: 1 }, { offset: 0, length: 1.5 },
        { offset: Number.MAX_SAFE_INTEGER + 1, length: 1 }, { offset: 0, length: Number.MAX_SAFE_INTEGER + 1 },
        { offset: Number.MAX_SAFE_INTEGER - 1, length: 4 },
        {} as ByteRange,
      ]) assert.equal(read(tree, 'data.txt', 4, range).error, 'invalid-byte-range');
      assert.equal(read(tree, 'data.txt', 4, { offset: 0, length: 5 }).error, 'invalid-byte-range');
      assert.equal(read(tree, 'data.txt', MAX_INVENTORY_BYTES + 1, { offset: 0, length: 1 }).error, 'invalid-byte-limit');
      assert.equal(read(tree, 'data.txt', -1, { offset: 0, length: 1 }).error, 'invalid-byte-limit');
      assert.equal(read(tree, 'data.txt', 4, { offset: 7, length: 1 }).error, 'range-out-of-bounds');
      assert.equal(read(tree, 'data.txt', 4).error, 'file-too-large');
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: rejects symlinks and refuses a file changed during a range read`, () => fixture(root => {
    const target = path.join(root, 'target.txt');
    fs.writeFileSync(target, 'stable-content');
    const external = path.join(root, 'linked-target');
    fs.mkdirSync(external);
    fs.writeFileSync(path.join(external, 'linked.txt'), 'linked-content');
    fs.symlinkSync(external, path.join(root, 'linked'), process.platform === 'win32' ? 'junction' : 'dir');
    const tree = adapter.open(root);
    try {
      assert.match(read(tree, 'linked/linked.txt', 4, { offset: 0, length: 4 }).error ?? '', /symlink/);
      const originalRead = fs.readSync;
      let changed = false;
      fs.readSync = ((...args: Parameters<typeof fs.readSync>) => {
        const result = originalRead(...args);
        if (!changed) {
          changed = true;
          fs.writeFileSync(target, 'broken-content');
        }
        return result;
      }) as typeof fs.readSync;
      try { assert.equal(read(tree, 'target.txt', 8, { offset: 0, length: 8 }).error, 'path-changed'); }
      finally { fs.readSync = originalRead; }
      assert.equal(changed, true);
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: rejects a size change during a range read`, () => fixture(root => {
    const target = path.join(root, 'target.txt');
    fs.writeFileSync(target, 'stable-content');
    const tree = adapter.open(root);
    try {
      const originalRead = fs.readSync;
      let changed = false;
      fs.readSync = ((...args: Parameters<typeof fs.readSync>) => {
        const result = originalRead(...args);
        if (!changed) {
          changed = true;
          fs.writeFileSync(target, 'replacement-content-with-a-different-size');
        }
        return result;
      }) as typeof fs.readSync;
      try { assert.equal(read(tree, 'target.txt', 8, { offset: 0, length: 8 }).error, 'path-changed'); }
      finally { fs.readSync = originalRead; }
      assert.equal(changed, true);
    } finally { tree.close(); }
  }));

  test(`${adapter.name}: rejects a stale expected file fingerprint before returning a slice`, () => fixture(root => {
    const target = path.join(root, 'target.txt');
    fs.writeFileSync(target, 'before');
    const tree = adapter.open(root);
    try {
      const initial = read(tree, 'target.txt', 16);
      assert.equal(initial.contentBase64, undefined);
      const expected = fs.statSync(target, { bigint: true });
      fs.writeFileSync(target, 'after!');
      const result = read(tree, 'target.txt', 16, { offset: 0, length: 3 }, { stat: expected, statFingerprint: initial.statFingerprint });
      assert.equal(result.error, 'path-changed');
    } finally { tree.close(); }
  }));
}

function requireHash(value: Buffer): string {
  // 哈希测试只对适配器返回的原始字节计算，不依赖文本解码结果。
  return createHash('sha256').update(value).digest('hex');
}
