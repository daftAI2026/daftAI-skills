/**
 * [INPUT]: node:test 与纯报告偏好校验器
 * [OUTPUT]: JSON 偏好、无效输入和权限不扩展的回归
 * [POS]: 只验证配置契约；不冒充真实 Agent 写作验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import { DEFAULT_AUDIT_PREFERENCES, parseAuditPreferences } from './report-preferences.ts';

test('optional fields preserve defaults and produce an independent object', () => {
  const result = parseAuditPreferences('{"schemaVersion":1}');
  assert.deepEqual(result, DEFAULT_AUDIT_PREFERENCES);
  result.reportLanguage = 'en';
  assert.equal(DEFAULT_AUDIT_PREFERENCES.reportLanguage, 'auto');
});
test('JSON template is valid but not automatically written or activated', () => {
  const template = fs.readFileSync(new URL('../references/preferences.example.json', import.meta.url), 'utf8');
  assert.deepEqual(parseAuditPreferences(template), DEFAULT_AUDIT_PREFERENCES);
});
test('language tags and legacy off input normalize to mandatory writing', () => {
  for (const language of ['auto', 'zh', 'zh-Hans', 'en-US', 'ja', 'fr', 'de-DE', 'en-US-u-ca-gregory', 'zh-Hans-u-nu-hanidec']) {
    assert.deepEqual(parseAuditPreferences({ schemaVersion: 1, reportLanguage: language, technicalWriting: 'off' }),
      { schemaVersion: 1, reportLanguage: language, technicalWriting: 'auto' });
  }
});
test('invalid JSON, object shapes, versions and language tags are rejected', () => {
  for (const value of ['{', 'null', '[]', 'true', '1', {}, { schemaVersion: 2 },
    Object.assign(Object.create({ schemaVersion: 1 }), {}),
    ...['', 'English please', 'zh_CN', 'auto; deploy', 'en-x', 1, false, null].map(reportLanguage => ({ schemaVersion: 1, reportLanguage })),
    ...['required', true, '', {}, null].map(technicalWriting => ({ schemaVersion: 1, technicalWriting }))])
    assert.throws(() => parseAuditPreferences(value));
});
test('unknown safety, path, command and prompt fields cannot grant authority', () => {
  for (const key of ['online', 'token', 'accountId', 'budget', 'commands', 'prompt', 'writerPath', 'project', 'outputDir', '__proto__']) {
    const input = JSON.stringify({ schemaVersion: 1, reportLanguage: 'zh', [key]: 'synthetic-only' });
    assert.throws(() => parseAuditPreferences(input));
  }
});
test('size ceiling counts UTF-8 bytes and accepts the exact JSON limit', () => {
  const json = '{"schemaVersion":1}';
  assert.deepEqual(parseAuditPreferences(json + ' '.repeat(4096 - Buffer.byteLength(json))), DEFAULT_AUDIT_PREFERENCES);
  assert.throws(() => parseAuditPreferences(json + ' '.repeat(4097 - Buffer.byteLength(json))));
  assert.throws(() => parseAuditPreferences(' '.repeat(4094) + '中'));
  const longLocale = 'en-US-u-ca-gregory-nu-hanidec-co-standard-kf-upper-hc-h23-ms-uksystem-rg-gbzzzz-tz-usnyc-va-posix-kn-true';
  assert.ok(Intl.getCanonicalLocales(longLocale).length === 1);
  assert.ok(longLocale.length > 64);
  assert.throws(() => parseAuditPreferences({ schemaVersion: 1, reportLanguage: longLocale }));
});
