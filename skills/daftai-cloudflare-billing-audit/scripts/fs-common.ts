/**
 * [INPUT]: 依赖 Node 文件元数据、路径工具与审计读取上限。
 * [OUTPUT]: 提供共享身份指纹、路径显示和受控读取参数校验。
 * [POS]: scripts 文件系统适配器的纯工具层；不打开文件或执行目标内容。
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { MAX_INVENTORY_BYTES } from './audit-types.ts';
export function isWithin(parent: string, candidate: string): boolean {
  // macOS 的路径别名不能绕过目标内输出禁令；大小写敏感卷也保守拒绝。
  const relative = process.platform === 'darwin' ? path.relative(parent.toLowerCase(), candidate.toLowerCase()) : path.relative(parent, candidate);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

export function displayPath(root: string, absolute: string): string {
  const relative = path.relative(root, absolute).split(path.sep).join('/');
  return relative || '.';
}

export type DirectoryIdentity = { name: string; dev: string; ino: string; mode: string };
export type OpenDirectory = { fd: number; identities: DirectoryIdentity[] };
export type StableStat = fs.BigIntStats;
/** 区间末端可短读；偏移必须位于文件内，空文件只接受零偏移。 */
export type ByteRange = { offset: number; length: number };
/** 区间模式下 sha256/base64 对应返回字节；fileBytes 是完整文件长度。 */
export type FileReadResult = { text?: string; bytes?: number; sha256?: string; statFingerprint?: string; fileBytes?: number; contentBase64?: string; error?: string };

export function validateReadRequest(maxBytes: number, range?: ByteRange): string | undefined {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 0 || maxBytes > MAX_INVENTORY_BYTES) return 'invalid-byte-limit';
  if (range === undefined) return undefined;
  if (typeof range !== 'object' || range === null || Array.isArray(range)) return 'invalid-byte-range';
  let offset: number, length: number;
  try { ({ offset, length } = range); }
  catch { return 'invalid-byte-range'; }
  if (!Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length <= 0 || length > maxBytes || !Number.isSafeInteger(offset + length)) return 'invalid-byte-range';
  return undefined;
}

export function digest(value: string | Buffer): string {
  return createHash('sha256').update(value).digest('hex');
}

export function statIdentity(stat: StableStat): string {
  return [stat.dev, stat.ino, stat.mode, stat.size, stat.mtimeNs, stat.ctimeNs].join(':');
}

export function sameDirectory(stat: StableStat, identity: DirectoryIdentity): boolean {
  return stat.isDirectory() && !stat.isSymbolicLink() && String(stat.dev) === identity.dev && String(stat.ino) === identity.ino && String(stat.mode) === String(identity.mode);
}

export function identityOf(name: string, stat: StableStat): DirectoryIdentity {
  return { name, dev: String(stat.dev), ino: String(stat.ino), mode: String(stat.mode) };
}

export function isMissing(error: unknown): boolean {
  return (error as NodeJS.ErrnoException).code === 'ENOENT';
}

export function statFingerprint(stat: StableStat, parentFingerprint: string): string {
  return digest(`${statIdentity(stat)}|${parentFingerprint}`);
}

export function object(value: unknown): Record<string, unknown> | undefined {
  return value !== null && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return object(value) !== undefined;
}
