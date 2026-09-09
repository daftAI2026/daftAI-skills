# scripts/
> L2 | 父级: ../CLAUDE.md

成员清单

- `fetch-guide.ts`: Bun CLI，先验证本地缓存，再从固定官方 Markdown 入口提取完整 2.5 栏目；原子写入被 Git 忽略的参考缓存，再调用切分器返回索引。
- `fetch-guide.test.ts`: Bun 测试，使用原创缩小样本验证栏目边界、缓存复用、失败保留与响应拒绝。

- `split-guide.ts`: 按代码块外 H2/H3 边界逐字切分，以内容哈希隔离派生目录，索引标明父级上下文与完整流程标题。
- `split-guide.test.ts`: 验证原文逐字重组、代码块防误切、连续流程保留、索引复用与派生文件修复。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
