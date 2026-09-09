# daftai-gpt-image-2-5-prompt-optimizer/
> L2 | 父级: ../CLAUDE.md

成员清单

- `SKILL.md`: 英文工作流入口，按需引导新手且优先原生提问弹窗，解析参考图职责与比例，选择官方示例结构后优化提示词；不承担生图执行。
- `references/official-guide.md`: 在线来源协议，以 2.5 栏目隔离模型版本，限定完整栏目范围，指导忽略提交的本地缓存复用。
- `references/acceptance-cases.md`: 原创行为验收场景，覆盖新手引导、免初始化、语言选择、意图保真与来源失效。
- `references/CLAUDE.md`: 参考模块地图，区分运行时来源与维护验收。
- `agents/openai.yaml`: Codex 发现元数据，提供显示名称与显式调用示例。
- `agents/CLAUDE.md`: 元数据模块地图，保持 UI 入口与技能职责一致。

- `scripts/fetch-guide.ts`: 首次获取完整 2.5 栏目；缓存命中不联网，显式刷新，失败不覆盖旧内容。
- `scripts/fetch-guide.test.ts`: 原创离线样本覆盖提取与缓存边界。
- `scripts/CLAUDE.md`: 抓取模块地图。
- `.gitignore`: 阻止官方参考缓存进入版本控制。

依赖边界

依赖 Bun 与 Node 内建模块直接读取官方 Markdown，不需要 Firecrawl、npm 包或 API Key。官方参考缓存跨会话复用但不提交；可选图片由宿主读取。

配置决策

当前不实现持久偏好。若后续增加，使用严格 JSON 的 `config.json`，不采用 EXTEND.md；届时定义字段与校验后再实现读写，不预建空文件或首次阻塞。

[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
