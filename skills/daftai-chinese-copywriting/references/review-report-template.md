---
name: review-report-template
description: Template for review mode output report
---

# Review Report Template

The agent MUST format the review report using this template and save it to `{filename}-review.md`.

## Template

```markdown
## 检查报告

**文件**: {file-path}
**问题数**: {count}

| # | 位置 | 原文 | 问题 | 建议 |
|---|------|------|------|------|
| 1 | L{n} | `{original}` | {issue-type} | `{suggested}` |
```

## Issue Types

Use these labels in the "问题" column:

| Label | Description |
|-------|-------------|
| 中英文之间缺少空格 | Missing space between Chinese and English |
| 中文与数字之间缺少空格 | Missing space between Chinese and numbers |
| 半角标点 | Half-width punctuation in Chinese context |
| 半角括号 | Half-width parentheses in Chinese context |
| 重复标点 | Repeated punctuation (！！, ？？) |
| 全角标点后多余空格 | Extra space after full-width punctuation |
| 其他排版问题 | Other formatting issues |

## Rules

- Report combines autocorrect lint findings AND AI review findings
- Each row = one issue at one location
- `位置`: Line number in the source file (L1, L2, ...)
- `原文`: Show enough context to locate the issue (not the entire line)
- `建议`: Show the corrected version of the same span
- If no issues found, output: "检查通过，未发现问题。"
