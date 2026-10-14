/**
 * [INPUT]: 依赖 node:test、报告模板示例及 Bun 的 Markdown 渲染器
 * [OUTPUT]: 提供模板强调、编号与基础样式的渲染回归测试
 * [POS]: 维护者验收边界；不读取或执行受审项目，不冒充阅读器点击验收
 * [PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const bun = (globalThis as typeof globalThis & {
  Bun?: { markdown?: { html: (source: string) => string } };
}).Bun;

function render(source: string): string {
  assert.ok(bun?.markdown, 'Maintainer rendering tests require Bun.markdown.');
  return bun.markdown.html(source);
}

function assertFormatting(source: string): void {
  const html = render(source);
  const visible = html.replace(/<pre\b[^>]*>[\s\S]*?<\/pre>/g, '')
    .replace(/<code\b[^>]*>[\s\S]*?<\/code>/g, '').replace(/<[^>]*>/g, '');
  assert.ok(!visible.includes('**'), 'Unrendered emphasis remains in prose.');
}

test('report template Markdown examples render without literal formatting markers', () => {
  const contract = fs.readFileSync(new URL('../references/report-schema.md', import.meta.url), 'utf8');
  const examples = [...contract.matchAll(/```markdown\n([\s\S]*?)\n```/g)].map(match => match[1]!);
  assert.ok(examples.length > 0, 'No output pattern was checked.');
  for (const example of examples) assertFormatting(example);
});

test('punctuation-adjacent labels reproduce the bug and corrected labels preserve text', () => {
  for (const [label, suffix] of [['下一步', '由维护者核对。'], ['日期', '2026-10-14']]) {
    assert.throws(() => assertFormatting(`**${label}：**${suffix}`), /Unrendered emphasis/);
    const source = `**${label}**：${suffix}`;
    assertFormatting(source);
    assert.ok(render(source).includes(`<strong>${label}</strong>`));
    assert.equal(render(source).replace(/<[^>]*>/g, '').trim(), `${label}：${suffix}`);
  }
});

test('literal stars inside commands and code are not formatting failures', () => {
  assertFormatting('Use `**literal**` with **rendered prose**.');
  assertFormatting('```text\nsrc/**\n```\n\n**Rendered prose**');
});

test('portable patterns keep finding IDs first and require no HTML anchors', () => {
  for (const separator of [': ', '：']) {
    const html = render(`- **F-01${separator}Review repeated work**\n\n### F-01${separator}Repeated work`);
    assert.ok(html.includes(`<strong>F-01${separator}`));
    assert.ok(html.includes(`<h3>F-01${separator}`));
    assert.ok(!html.includes('<a '));
  }
  assert.ok(render('> Note: Review scope remains limited.').includes('<blockquote>'));
});
