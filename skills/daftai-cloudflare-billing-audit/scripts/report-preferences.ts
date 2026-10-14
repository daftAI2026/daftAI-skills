/**
 * [INPUT]: 外部 JSON 偏好文字或对象；不读取路径、凭据和项目文件
 * [OUTPUT]: 校验后的报告语言与兼容写作字段
 * [POS]: 报告输出的纯配置边界；不授权联网或调用写作工具
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export type AuditPreferences = {
  schemaVersion: 1;
  reportLanguage: string;
  technicalWriting: 'auto';
};
export const DEFAULT_AUDIT_PREFERENCES: Readonly<AuditPreferences> = Object.freeze({
  schemaVersion: 1, reportLanguage: 'auto', technicalWriting: 'auto',
});
const keys = new Set(['schemaVersion', 'reportLanguage', 'technicalWriting']);

export function parseAuditPreferences(input: unknown): AuditPreferences {
  let value: unknown = input;
  if (typeof value === 'string') {
    if (Buffer.byteLength(value, 'utf8') > 4096) throw new Error('Preferences exceed 4096 bytes');
    value = JSON.parse(value);
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || Object.getPrototypeOf(value) !== Object.prototype)
    throw new Error('Preferences must be a JSON object');
  const config = value as Record<string, unknown>;
  if (config.schemaVersion !== 1 || Object.keys(config).some(key => !keys.has(key)))
    throw new Error('Unsupported preference version or key');
  const language = Object.hasOwn(config, 'reportLanguage') ? config.reportLanguage : 'auto';
  if (typeof language !== 'string' || language.length > 64)
    throw new Error('Invalid report language');
  if (language !== 'auto') {
    if (!/^[A-Za-z]{2,8}(?:-[A-Za-z0-9]{1,8})*$/.test(language))
      throw new Error('Invalid report language');
    try { Intl.getCanonicalLocales(language); } catch { throw new Error('Invalid report language'); }
  }
  const writing = Object.hasOwn(config, 'technicalWriting') ? config.technicalWriting : 'auto';
  if (writing !== 'auto' && writing !== 'off') throw new Error('Invalid technical-writing preference');
  return { schemaVersion: 1, reportLanguage: language, technicalWriting: 'auto' };
}
