---
name: preferences-schema
description: EXTEND.md YAML 完整 schema 定义 - daftAI-local-video-subtitler 用户偏好
---

# 偏好配置 Schema

## 完整 Schema 定义

```yaml
---
version: 1

font: "Alibaba PuHuiTi 3.0"  # 字幕字体

font_size: 21           # 字号
outline: 0.75           # 描边粗细
margin_v: 15            # 底部边距（像素）

crf: 18                 # 编码质量（CRF 值）

output_dir: "same-dir"  # 输出目录策略

bilingual:
  auto_merge: false     # 是否自动合并双语字幕
  order: "zh-top"       # 双语排版顺序

watermark:
  enabled: false        # 是否启用水印
  text: ""              # 水印文字内容
  position: "top-right" # 水印位置
  opacity: 0.5          # 水印透明度 (0.0-1.0)

source_label:
  enabled: false        # 是否启用素材来源标注
  prefix: "素材来自于"  # 固定前缀，实际来源每次烧录时询问
  position: "top-left"  # 来源标注位置
  opacity: 0.5          # 来源标注透明度 (0.0-1.0)

quick_mode: false       # 快速模式：跳过确认直接烧录

language: zh            # 界面语言
---
```

## 字段说明

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `version` | int | 1 | Schema 版本号 |
| `font` | string | `"Alibaba PuHuiTi 3.0"` | 字幕字体名称 |
| `font_size` | int | 21 | 字幕字号 |
| `outline` | float | 0.75 | 字幕描边粗细 |
| `margin_v` | int | 15 | 字幕底部边距（像素） |
| `crf` | int | 18 | H.264 编码 CRF 值（0-51，越小质量越高） |
| `output_dir` | string | `"same-dir"` | 输出目录策略 |
| `bilingual.auto_merge` | bool | false | 检测到第二字幕时是否自动合并 |
| `bilingual.order` | string | `"zh-top"` | 双语字幕排版顺序 |
| `watermark.enabled` | bool | false | 是否在视频上叠加水印文字 |
| `watermark.text` | string | "" | 水印文字内容（如 @用户名、品牌名） |
| `watermark.position` | string | "top-right" | 水印位置 |
| `watermark.opacity` | float | 0.5 | 水印透明度（0.0 完全透明 - 1.0 完全不透明） |
| `source_label.enabled` | bool | false | 是否在视频上标注素材来源 |
| `source_label.prefix` | string | "素材来自于" | 来源文字固定前缀，实际来源名称每次烧录时询问 |
| `source_label.position` | string | "top-left" | 来源标注位置 |
| `source_label.opacity` | float | 0.5 | 来源标注透明度 |
| `quick_mode` | bool | false | 是否跳过确认步骤直接使用偏好设置烧录 |
| `language` | string | `"zh"` | 界面交互语言 |

## 字体选项

| 值 | 说明 |
|----|------|
| `Alibaba PuHuiTi 3.0` | 阿里巴巴普惠体 3.0，免费商用，中英文显示效果优秀，推荐首选 |
| `Noto Sans CJK` | Google 思源黑体，完整覆盖中日韩字符集，开源免费 |
| `system` | 使用系统默认字体，无需额外安装，不同系统显示效果可能不同 |

**字体检测逻辑**：
- 配置指定字体后，烧录前仍会检测该字体是否已安装
- 未安装时按优先级回退：Alibaba PuHuiTi 3.0 → Noto Sans CJK → 系统默认
- 回退时会提示用户当前使用的实际字体

## 字幕样式说明

### font_size（字号）

| 值 | 说明 |
|----|------|
| 18 | 小字样式，画面信息密集、不希望字幕遮挡过多画面 |
| 21 | 默认样式，适合大多数视频，1080p 屏幕阅读舒适 |
| 26 | 大字样式，大屏幕、远距离观看、演讲/教学视频 |

### outline（描边粗细）

| 值 | 说明 |
|----|------|
| 0.5 | 细描边，适合小字样式 |
| 0.75 | 默认描边，适合大多数场景 |
| 1.0 | 粗描边，适合大字样式或高对比度需求 |

### margin_v（底部边距）

| 值 | 说明 |
|----|------|
| 12 | 小边距，字幕更贴近底部 |
| 15 | 默认边距，适合大多数视频 |
| 20 | 大边距，字幕距底部更远 |

**补充说明**：
- 所有样式均使用白色字体（`&HFFFFFF`）+ 黑色描边（`&H000000`）
- `outline` 控制描边粗细，确保字幕在明暗背景上均可阅读
- `margin_v` 控制字幕距视频底部的像素距离
- 用户可自定义任意数值组合，不限于以上列出的值

## CRF 编码质量选项

| 值 | 说明 | 文件大小参考 |
|----|------|-------------|
| 18 | 视觉无损，推荐用于归档和高质量输出 | 较大（约为原始的 80-100%） |
| 22 | 质量与大小均衡，适合日常使用 | 中等（约为原始的 50-70%） |
| 26 | 文件更小，适合网络分享 | 较小（约为原始的 30-50%） |

**补充说明**：
- CRF（Constant Rate Factor）范围 0-51，值越小质量越高
- 编码器固定使用 H.264（libx264），兼容性最好
- CRF 18 被 FFmpeg 社区普遍认为是「视觉无损」的阈值
- 用户可填写任意 0-51 的整数值，不限于预设

## 输出目录选项

| 值 | 说明 | 示例 |
|----|------|------|
| `same-dir` | 输出到视频文件所在目录 | `/path/to/video_zh.mp4` |
| `output-subdir` | 输出到视频目录下的 `output/` 子目录 | `/path/to/output/video_zh.mp4` |
| 自定义路径 | 填写绝对路径，所有输出统一放到该目录 | `/Users/luo/Videos/output/video_zh.mp4` |

**命名规则**（不受输出目录影响）：
- 单语字幕：`{原文件名}_{语言}.mp4`（如 `video_zh.mp4`）
- 双语字幕：`{原文件名}_{语言1}-{语言2}.mp4`（如 `video_zh-en.mp4`）

## 双语字幕设置

### auto_merge

| 值 | 说明 |
|----|------|
| `false` | 仅烧录单语字幕，不自动合并（默认） |
| `true` | 检测到同名第二字幕文件时自动合并为双语字幕 |

### order

| 值 | 说明 |
|----|------|
| `zh-top` | 中文在上、英文在下（推荐，符合中文阅读习惯） |
| `en-top` | 英文在上、中文在下 |

**补充说明**：
- `auto_merge` 为 `false` 时，`order` 字段不生效
- 自动检测逻辑：扫描同目录下同名但语言后缀不同的字幕文件
- 手动指定两个字幕文件时，忽略 `auto_merge` 设置，直接合并

## 水印设置

### position

| 值 | 说明 |
|----|------|
| `top-right` | 右上角（推荐） |
| `top-left` | 左上角 |
| `bottom-right` | 右下角 |
| `bottom-left` | 左下角 |

### opacity

| 值 | 说明 |
|----|------|
| 0.3 | 较浅，低调不干扰 |
| 0.5 | 半透明（推荐），平衡可读性与美观 |
| 0.7 | 较深，更醒目 |

**补充说明**：
- 水印使用 FFmpeg drawtext 滤镜实现
- 字体与字幕字体一致
- 水印字号默认为字幕字号的 60%
- 水印和素材来源可同时启用，互不干扰

## 素材来源标注设置

与水印设置格式相同，position 和 opacity 选项一致。

## 快速模式

| 值 | 说明 |
|----|------|
| false | 每次烧录前确认处理方式（默认） |
| true | 跳过确认步骤，偏好足够明确时直接执行 |

## 最小配置示例

```yaml
---
version: 1
font: "Alibaba PuHuiTi 3.0"
font_size: 21
outline: 0.75
margin_v: 15
crf: 18
output_dir: "same-dir"
bilingual:
  auto_merge: false
  order: "zh-top"
watermark:
  enabled: false
  text: ""
  position: "top-right"
  opacity: 0.5
source_label:
  enabled: false
  prefix: "素材来自于"
  position: "top-left"
  opacity: 0.5
quick_mode: false
language: zh
---
```

## 完整配置示例

```yaml
---
version: 1

# 字体：阿里巴巴普惠体 3.0
font: "Alibaba PuHuiTi 3.0"

# 字幕样式
font_size: 21
outline: 0.75
margin_v: 15

# 编码质量：视觉无损
crf: 18

# 输出目录：同目录
output_dir: "same-dir"

# 双语字幕：不自动合并，合并时中文在上
bilingual:
  auto_merge: false
  order: "zh-top"

# 水印：默认关闭
watermark:
  enabled: false
  text: ""
  position: "top-right"
  opacity: 0.5

# 素材来源标注：默认关闭，开启后每次烧录时询问来源名称
source_label:
  enabled: false
  prefix: "素材来自于"
  position: "top-left"
  opacity: 0.5

# 快速模式：跳过确认直接烧录
quick_mode: false

# 界面语言
language: zh
---
```
