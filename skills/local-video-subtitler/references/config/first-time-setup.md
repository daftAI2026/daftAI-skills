---
name: first-time-setup
description: 首次设置流程 - local-video-subtitler 用户偏好配置
---

# 首次设置

## 概述

当未找到 EXTEND.md 时，引导用户完成偏好设置。

**⛔ 阻塞操作**：此设置必须在任何其他工作流步骤之前完成。禁止：
- 询问视频文件路径
- 询问字幕文件
- 开始环境检测
- 执行烧录操作

必须先完成设置问答、保存 EXTEND.md，然后才能继续工作流。

## 检查 EXTEND.md

按以下顺序查找 EXTEND.md：

1. **项目级**：`.baoyu-skills/local-video-subtitler/EXTEND.md`
2. **用户级**：`~/.baoyu-skills/local-video-subtitler/EXTEND.md`

找到任一文件 → 读取配置，跳过设置，继续工作流。
两处均未找到 → 触发首次设置流程。

## 设置流程

```
未找到 EXTEND.md
        │
        ▼
┌─────────────────────┐
│ 一次性询问全部问题   │
│ （6 个问题）        │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ 创建 EXTEND.md      │
└─────────────────────┘
        │
        ▼
    继续工作流（阶段 1）
```

## 问题

**语言**：使用中文。

使用 AskUserQuestion 将所有问题在一次调用中全部提出：

### 问题 1：字体偏好

```yaml
header: "字体"
question: "字幕烧录使用哪种字体？"
options:
  - label: "Alibaba PuHuiTi 3.0（推荐）"
    description: "阿里巴巴普惠体，免费商用，中英文显示效果优秀"
  - label: "Noto Sans CJK"
    description: "Google 思源黑体，覆盖中日韩字符，开源免费"
  - label: "系统默认"
    description: "使用系统自带字体，无需额外安装"
```

### 问题 2：字幕样式预设

```yaml
header: "样式"
question: "字幕样式预设？"
options:
  - label: "默认样式（推荐）"
    description: "字号 21 / 描边 0.75 / 边距 15 — 适合大多数视频"
  - label: "大字样式"
    description: "字号 26 / 描边 1.0 / 边距 20 — 适合大屏或远距离观看"
  - label: "小字样式"
    description: "字号 18 / 描边 0.5 / 边距 12 — 适合画面信息密集的视频"
```

### 问题 3：编码质量

```yaml
header: "质量"
question: "视频编码质量（CRF 值越小质量越高，文件越大）？"
options:
  - label: "CRF 18 无损（推荐）"
    description: "视觉无损，文件较大，适合归档和高质量输出"
  - label: "CRF 22 均衡"
    description: "质量与文件大小平衡，适合日常使用"
  - label: "CRF 26 文件更小"
    description: "文件更小，适合网络分享，画质略有损失"
```

### 问题 4：输出目录策略

```yaml
header: "输出"
question: "烧录后的视频输出到哪里？"
options:
  - label: "同目录（推荐）"
    description: "输出到视频文件所在目录"
  - label: "output 子目录"
    description: "输出到视频所在目录下的 output/ 子目录"
  - label: "自定义路径"
    description: "指定固定输出路径（需填写具体路径）"
```

### 问题 5：双语字幕默认行为

```yaml
header: "双语"
question: "双语字幕处理方式和排版顺序？"
options:
  - label: "仅单语（推荐）"
    description: "只烧录一种语言的字幕，不自动合并"
  - label: "自动合并（中上英下）（推荐排版）"
    description: "检测到第二字幕时自动合并，中文在上、英文在下"
  - label: "自动合并（英上中下）"
    description: "检测到第二字幕时自动合并，英文在上、中文在下"
```

### 问题 6：保存位置

```yaml
header: "保存"
question: "偏好配置保存到哪里？"
options:
  - label: "用户级（推荐）"
    description: "~/.baoyu-skills/ — 所有项目共享配置"
  - label: "项目级"
    description: ".baoyu-skills/ — 仅当前项目使用"
```

## 保存位置

| 选择 | 路径 | 作用范围 |
|------|------|----------|
| 用户级 | `~/.baoyu-skills/local-video-subtitler/EXTEND.md` | 所有项目 |
| 项目级 | `.baoyu-skills/local-video-subtitler/EXTEND.md` | 仅当前项目 |

## 设置完成后

1. 按需创建目录
2. 写入 EXTEND.md（含 YAML frontmatter）
3. 确认："偏好配置已保存至 [路径]"
4. 继续工作流阶段 1（环境检测）

## EXTEND.md 模板

```yaml
---
version: 1

font: "[Alibaba PuHuiTi 3.0 / Noto Sans CJK / system]"

style_preset:
  font_size: [21 / 26 / 18]
  outline: [0.75 / 1.0 / 0.5]
  margin_v: [15 / 20 / 12]

crf: [18 / 22 / 26]

output_dir: "[same-dir / output-subdir / 自定义路径]"

bilingual:
  auto_merge: [false / true]
  order: "[zh-top / en-top]"

language: zh
---
```

## 后续修改偏好

用户可以直接编辑 EXTEND.md 或重新触发设置：
- 删除 EXTEND.md 即可重新触发设置流程
- 直接编辑 YAML frontmatter 快速修改
- 完整字段说明参见 `preferences-schema.md`

**EXTEND.md 支持配置项**：字体 | 样式预设 | 编码质量 | 输出目录 | 双语字幕行为 | 语言偏好
