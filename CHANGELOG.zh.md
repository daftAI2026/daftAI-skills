# Changelog

[English](./CHANGELOG.md) | 中文

## 1.11.0 - 2026-10-14

### 改进
- 操作段落、工具描述、Agent 指令和状态消息按需加载 STE 启发的中文写作方法。
- 保留许可、义务、条件逻辑、时间状态和失败分支；只改措辞时不新增操作方案或产品保证。

## 1.10.0 - 2026-10-14

### 新增
- 新增 `daftai-chinese-technical-writing`，支持中文技术文档、产品文案与界面文案；随附六份阮一峰指南原文、独立场景扩展与真实修改证据回环。
- 登记到 utility-skills，按需联动现有格式 Skill 检查排版。

### 修复
- 中文格式 CLI 的 `review` 无需偏好文件；`stable` 与 `quick` 保留首次设置要求，并新增隔离 CLI 回归测试。

### 改进
- 中文格式偏好优先读取和保存 `EXTEND.json`，严格校验 JSON，保留项目层级优先与旧 `EXTEND.md` 兼容；读取不会自动迁移文件。
- 移除各技能、脚本和工作流文档中的 GEB 模块图与契约注释。

## 1.9.0 - 2026-10-14

### 新增
- 新增 `daftai-video-compositor`，把本地视频嵌进截图的指定区域，保留原音轨，并只交付一个 MP4。
- 登记到 video-skills。

## 1.8.0 - 2026-10-14

### 新增
- 新增 `daftai-cloudflare-billing-audit`，按产品加载参考，以只读扫描辅助追踪费用放大路径，保留证据与未知项。
- 注册 developer-tools 分类，加入原生平台测试与独立安装检查。

## 1.7.3 - 2026-09-10

### 改进 (daftai-gpt-image-2-5-prompt-optimizer)
- Agent 先对照 `references/gpt-image-2-5/` 的已发布布局（`source.md` 与稳定 `INDEX.md`），检查失败才运行抓取脚本。
- 去掉依赖内容哈希的章节目录，使标准文件在跑脚本前即可核对；已有 `references/cache/` 会无网络迁移。
- 本地官方参考不再叫 cache，避免在已有布局时仍宣称正在抓取或准备指南。
- 新增旧路径迁移测试，十项测试通过。

## 1.7.2 - 2026-09-10

### 改进 (daftai-gpt-image-2-5-prompt-optimizer)
- 默认仍只输出提示词：不因宿主有生图工具就调用，交付提示词后也不追问是否生图。
- 用户明确要求“优化并生成”时，先完成提示词，再由宿主 Agent 作为独立步骤生图，不再二次确认。

## 1.7.1 - 2026-09-10

### 改进 (daftai-gpt-image-2-5-prompt-optimizer)
- 新增 TypeScript 确定性切分，将官方缓存逐字切成章节并生成导航索引，不做摘要。
- 保留示例说明、提示词、设置、链接、父级上下文及完整连续工作流。
- 改为按需读取基础规则与匹配示例，不再默认加载全文。
- 支持本地修复派生文件，以原文内容哈希隔离更新后的切片；官方内容仍全部被 Git 忽略。
- 新增无损重组、代码块边界、索引复用与缓存修复测试，九项测试通过。

## 1.7.0 - 2026-09-10

### 新增 (daftai-gpt-image-2-5-prompt-optimizer)
- 新增 GPT Image 2.5 提示词优化 Skill，英文操作说明、中文触发词，只输出提示词，不生图。
- 从官方指南选择相关示例，区分参考图职责，并在起草前处理画面比例要求。
- 按需引导新手，优先使用原生提问弹窗，不强制首次配置。
- 新增轻量 TypeScript 抓取器：首次获取完整 2.5 栏目，之后复用本地缓存，支持显式刷新。
- 官方缓存不提交、不分发；附来源规则、原创验收场景及六项已通过的抓取测试。

### 改进
- 注册到 utility-skills，同步双语 README、Codex 元数据及架构地图。

## 1.6.0 - 2026-07-04

### 新增 (daftai-image-to-svg)
- 新 Skill：将透明或纯色底单色 PNG/SVG 图像转换为经过误差量化的纯路径真矢量 SVG。
- 支持白底、红底、绿底及其他纯色背景自动去底。
- 支持 Potrace 阈值与参数扫描，可按 `mae`、`rmse`、`iou` 目标选择最佳候选。
- 新增 `--keep-candidates`，调参时可保留候选 SVG/PNG 过程文件。
- 输出预览 PNG 与 JSON 报告，记录颜色、背景去除、Potrace 参数、MAE/RMSE/IoU 和 SVG 结构验证。

### 改进 (README, AGENTS)
- 在 utility skills marketplace 分类注册 `daftai-image-to-svg`。
- 在 README、README.zh、AGENTS.md、CLAUDE.md 中补充 Potrace + librsvg/Inkscape 依赖与新 skill 结构。

## 1.5.6 - 2026-03-27

### 改进 (daftai-chinese-copywriting, daftai-video-subtitler, daftai-subtitle-translator, daftai-extracting-video-subtitles, daftai-url-to-markdown)
- 统一运行时执行方式：所有技能现使用 `bun` 执行（移除 `npx` 引用）
- 更新 `SKILL.md` 脚本目录部分以反映 Bun 运行时模型
- 增强 AGENTS.md、CLAUDE.md、README.md 文档以对齐 Bun 运行时

### 改进 (daftai-chinese-copywriting)
- 增强 `scripts/shared.ts`，添加 `protectSyntax` 和 `restoreSyntax` 函数用于更强健的语法保护（代码块、行内代码、数学公式、链接）
- 改进 `main.test.ts` 测试覆盖，包括全面的工作流测试

## 1.5.5 - 2026-03-26

### 改进 (daftai-chinese-copywriting)
- 模式选择增加明确触发词映射表：「校对、修正、排版」→ stable，「检查、看看有没有问题」→ review，「快速修正、autocorrect」→ quick，避免"校对"被误推断为 review。
- Chunked 后处理改为输出新文件 `chunk-{NN}-corrected.md`（参考 baoyu-translate 模式），合并时读 `chunk-*-corrected.md`，避免覆盖源 chunk 导致 `edit_file` 匹配失败。

## 1.5.4 - 2026-03-25

### 改进 (daftai-chinese-copywriting)
- review 模式推断：用户说"检查"、"check"、"看看有没有问题"时自动进入 review 模式，跳过首次设置。
- review 输出报告文件 `{filename}-review.md`，包含 autocorrect lint + AI 审查的合并结果，使用固定模板（`references/review-report-template.md`）。
- 移除 `report_style` 配置项（`brief` / `detailed`），review 统一输出结构化检查报告。
- 首次设置从 2-3 个问题精简为 2 个（默认模式、保存位置），且仅在 `quick` / `stable` 模式触发。

## 1.5.3 - 2026-03-25

### 改进 (daftai-chinese-copywriting)
- `description` 移除实现细节（auto-install、模式列表、规则来源），只保留触发信号。
- 补充中文触发关键词："校对"、"检查排版"、"中英文空格"、"全角半角"。

## 1.5.2 - 2026-03-24

### 改进 (daftai-chinese-copywriting)
- 新增 Defaults 配置表，明确 `chunk_threshold` (4000) 和 `chunk_max_words` (5000) 默认值，agent 不再猜测分块大小。
- 新增 `references/subagent-prompt-template.md`，为分块 AI 后处理提供精确的 subagent 指令模板（含绝对路径）。
- 重写 Step 6 分块流程，从模糊的"can use subagents"改为强制使用 prompt template 的精确指令。
- `renderSummary` 在 stable 模式下新增"AI 后处理尚未完成"提醒，防止 agent 跑完 autocorrect 就报完成。
- `writePreferences` 在非 review 模式下不再写入 `report_style`，用户首次使用 review 模式时会被询问。
- Save location 默认值从 `user` 改为 `project`。

### 改进 (README)
- README.md 和 README.zh.md 开头结构调整为 baoyu-skills 风格（标题 → 语言切换 → 简介 → 环境要求）。
- Quick Install 精简为单行命令。

## 1.5.1 - 2026-03-21

### 改进 (daftai-chinese-copywriting)
- 支持批量文件：一条命令传入多个文件路径，无需逐个调用。
- 移除 `autoInstallAutocorrect` 偏好 — 缺少 autocorrect 时直接自动安装，不再询问。
- `reportStyle` 设置项改为条件提问 — 仅在默认模式选 `review` 时才问（唯一用到的模式）。
- 首次设置从 4 个问题精简为 2–3 个。

## 1.5.0 - 2026-03-18

### 新增 (daftai-chinese-copywriting)
- 新 Skill：基于 [autocorrect](https://github.com/huacnlee/autocorrect) 检查和修正中文排版，以 [sparanoid/chinese-copywriting-guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines) 为规则来源。
- 三种模式：`review`（仅检查）、`stable`（修正并输出摘要）、`quick`（快速修正）。
- 自动检测并通过 Homebrew 或 Cargo 安装 `autocorrect`。
- Markdown 代码块保护 — 修正时自动跳过 fenced code blocks。
- 支持 EXTEND.md 偏好配置（项目级/用户级）。

## 1.4.0 - 2026-03-06

### 新增 (daftai-subtitle-translator)
- Step 4 术语扫描 — 翻译前先扫描全文提取专有名词和技术术语，建立 session glossary，确保全文术语一致性。
- Step 6 可选审校 — 翻译后检查术语一致性、漏翻、字幕长度，100+ 条字幕自动触发。
- 独立术语表文件 `references/glossary-en-zh.md`，从 SKILL.md 中提取并扩充至 20 条常见 AI/技术术语。

### 改进 (daftai-subtitle-translator)
- 翻译原则从 5 条扩充到 8 条：新增「意义优先于文字」「比喻意译」「情感保真」。

### 修复 (daftai-subtitle-translator)
- (2026-02-26) 双语字幕默认合并顺序从「译文在上、原文在下」改为「原文在上、译文在下」（英上中下），更符合观看习惯。

## 1.3.1 - 2026-02-24

### 改进 (daftai-video-subtitler)
- 明确过程文件策略：默认保留翻译字幕与双语合并字幕，便于复用和复查。
- 默认清理仅用于检测类产物（截图/探测日志/临时检测文件）；仅在调试场景下保留。
- 已同步更新以下文档与默认配置：
  - `skills/daftai-video-subtitler/SKILL.md`
  - `skills/daftai-video-subtitler/references/config/preferences-schema.md`
  - `skills/daftai-video-subtitler/references/config/first-time-setup.md`

## 1.3.0 - 2026-02-24

### 新增 (daftai-extracting-video-subtitles)
- 新 Skill：使用 OpenAI Whisper 从视频/音频文件中提取带时间戳的 SRT 字幕。
- `scripts/extract_subtitles.ts` — TypeScript 封装完整的 Whisper 提取流程：
  - 自动检测 Whisper 和 FFmpeg 环境
  - 验证音频流是否存在
  - 根据视频时长自动选择 Whisper 模型（medium / turbo / base）
  - 自动处理复杂文件名（复制到临时目录）
  - 自动清理临时文件
  - 输出字幕条数和耗时统计
- 从 `~/.agents/skills/extracting-video-subtitles` 迁移至本仓库，通过软链接引用。
- 从纯指令式 SKILL.md 重构为 TypeScript 脚本封装，与其他 daftai- Skill 保持一致。

## 1.2.0 - 2026-02-18

### 新增 (daftai-url-to-markdown)
- SKILL.md 新增「抓取后核验」流程 — agent 在脚本执行完毕后必须完成以下验证才能汇报完成：
  1. **完整性核对** — 对比原网页与生成的 Markdown，确保无遗漏段落/章节
  2. **视频/嵌入媒体检测** — 扫描原页面源码中的 Vimeo/YouTube/iframe 嵌入，在正确位置插入视频链接
  3. **图片位置验证** — 确认图片出现在正确段落后，验证本地文件是否存在
  4. **无关内容清理** — 删除导航栏、标签列表、Newsletter 表单、推荐阅读、页脚等
  5. **样式格式核验** — 检查粗体/斜体、标题层级、列表结构、引用块、代码块、`<hr>` → `---`
  6. **链接验证** — 修复跨行断裂的链接、相对路径转绝对 URL、验证链接格式完整性

## 1.1.0 - 2026-02-17

### 改进
- 水印/来源标注字号改为按视频高度计算（`高度 × 0.025`），不再跟字幕字号挂钩。修复高分辨率视频上文字过小的问题（1080p：16px → 27px）。
- 水印/来源标注默认透明度从 0.5 改为 0.7，提升可读性。
- SKILL.md 和 first-time-setup.md 重写为结构化英文（参考 baoyu-skills 风格）。
- 新增 `Language: Use user's input language` 和 `AskUserQuestion` 多语言交互规则。
- 新增 `get_video_height()` 函数，通过 ffprobe 获取视频分辨率实现自适应字号。

## 1.0.1 - 2026-02-14

### 改进
- 翻译规则：英译中时，字幕行末尾不加句号（。），保持字幕简洁。

## 1.0.0 - 2026-02-10

### 新功能
- 首次设置偏好机制（EXTEND.md），首次使用时阻塞式引导用户配置。
- 偏好配置 Schema 文档（`references/config/preferences-schema.md`）。
- 首次设置流程文档（`references/config/first-time-setup.md`）。
- 项目指令文件（`CLAUDE.md`）。
- 双语版本变更记录（`CHANGELOG.md` + `CHANGELOG.zh.md`）。
- 结构化 7 步工作流，含进度清单和流程图。
- 参数优先级链：用户输入 > 项目 EXTEND.md > 用户 EXTEND.md > 内置默认值。

### 重构
- SKILL.md 从 6 阶段重构为 7 步结构化工作流（Step 0-6）。
- 烧录参数从硬编码改为「偏好字段 → 内置默认值」模式。

## 0.1.0 - 2026-02-04

### 新功能
- 字幕烧录核心引擎（`scripts/burn_subtitles.py`）。
- VTT 转 SRT 格式转换（`scripts/convert_vtt_to_srt.py`）。
- 语言自动检测（`scripts/detect_language.py`）。
- 双语字幕合并（`scripts/merge_bilingual_subtitles.py`）。
- 通用工具函数（`scripts/utils.py`）。
- 支持 SRT/VTT/ASS/SSA 字幕格式。
- 时间轴偏移自动检测与修正。
- 字体自动检测与回退机制。
- 翻译字幕功能（批量翻译 + 条数验证）。
