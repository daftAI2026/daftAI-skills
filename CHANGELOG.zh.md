# Changelog

[English](./CHANGELOG.md) | 中文

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
