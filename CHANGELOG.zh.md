# Changelog

[English](./CHANGELOG.md) | 中文

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
