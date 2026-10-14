/**
 * [INPUT]: 依赖 Linux 描述符适配器和便携稳定树适配器
 * [OUTPUT]: 提供按真实宿主选择的受控文件访问与路径校验
 * [POS]: 平台选择边界；不因原生能力缺失退回裸路径读取
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import { AnchoredFs } from './linux-fs.ts';
import path from 'node:path';
import { PortableFs, validateWindowsUserPath } from './portable-fs.ts';
export type AuditFs = Pick<AnchoredFs, 'rootPath' | 'assertRootStable' | 'rootFingerprint' | 'directoryFingerprint' | 'listDirectory' | 'inspectFile' | 'readFile' | 'writeNewFile' | 'close'> & {
  readonly mode: 'descriptor-anchored' | 'portable-stable-tree';
  createChildDirectory(name: string): AuditFs;
};
export function openAuditFs(input: string, createMissing = false, mode?: 'portable-stable-tree'): AuditFs {
  if (mode !== undefined && mode !== 'portable-stable-tree') throw new Error('unsupported-access-mode');
  if (mode === 'portable-stable-tree' || process.platform === 'darwin' || process.platform === 'win32') return PortableFs.openDirectory(input, createMissing);
  if (process.platform === 'linux') return AnchoredFs.openDirectory(input, createMissing);
  throw new Error('secure-path-access-unsupported');
}

export function resolveAuditPath(input: string): string {
  if (process.platform === 'win32') validateWindowsUserPath(input);
  return path.resolve(input);
}
