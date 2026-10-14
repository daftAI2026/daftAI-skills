/**
 * [INPUT]: 外部 JSON 偏好文字或对象；不读取路径、凭据和项目文件
 * [OUTPUT]: 校验后的报告偏好、线上检查入口与待保存配置
 * [POS]: 纯偏好边界；不写文件、不授权账户查询或调用工具
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
export type OnlineEvidencePreference = 'ask' | 'online' | 'offline';
export type OnlineEvidenceMode = 'offline' | 'online';
export type OnlineEvidenceChoice = 'project-once' | 'online-once' | 'online-always' | 'project-always';
export type AuditPreferences = {
  schemaVersion: 1;
  reportLanguage: string;
  technicalWriting: 'auto';
  onlineEvidence: OnlineEvidencePreference;
};
export const DEFAULT_AUDIT_PREFERENCES: Readonly<AuditPreferences> = Object.freeze({
  schemaVersion: 1, reportLanguage: 'auto', technicalWriting: 'auto', onlineEvidence: 'ask',
});
const keys = new Set(['schemaVersion', 'reportLanguage', 'technicalWriting', 'onlineEvidence']);

function preferenceObject(input: unknown): Record<string, unknown> {
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
  return config;
}

export function parseAuditPreferences(input: unknown): AuditPreferences {
  const config = preferenceObject(input);
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
  const online = Object.hasOwn(config, 'onlineEvidence') ? config.onlineEvidence : 'ask';
  if (online !== 'ask' && online !== 'online' && online !== 'offline')
    throw new Error('Invalid online-evidence preference');
  return { schemaVersion: 1, reportLanguage: language, technicalWriting: 'auto', onlineEvidence: online };
}

// ---- 入口选择与配置生成：账户授权仍由独立取证契约验证 ----
export function resolveOnlineEvidenceEntry(
  preferences: AuditPreferences, explicitMode?: OnlineEvidenceMode,
): 'ask' | OnlineEvidenceMode {
  if (explicitMode !== undefined) {
    if (explicitMode !== 'offline' && explicitMode !== 'online') throw new Error('Invalid explicit mode');
    return explicitMode;
  }
  return preferences.onlineEvidence;
}

export function applyOnlineEvidenceChoice(input: unknown, choice: OnlineEvidenceChoice): {
  mode: OnlineEvidenceMode;
  preferencesToSave: Record<string, unknown> | null;
} {
  const config = input === undefined ? { schemaVersion: 1 } : preferenceObject(input);
  parseAuditPreferences(config);
  switch (choice) {
    case 'project-once': return { mode: 'offline', preferencesToSave: null };
    case 'online-once': return { mode: 'online', preferencesToSave: null };
    case 'online-always':
      return { mode: 'online', preferencesToSave: { ...config, onlineEvidence: 'online' } };
    case 'project-always':
      return { mode: 'offline', preferencesToSave: { ...config, onlineEvidence: 'offline' } };
    default: throw new Error('Invalid online-evidence choice');
  }
}
