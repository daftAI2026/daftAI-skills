---
name: local-video-subtitler
description: >
  将字幕烧录到本地视频中。支持 SRT/VTT/ASS 格式，自动检测字幕和语言，
  支持双语字幕合并和翻译。使用场景：当用户需要将字幕硬编码到视频、
  制作带字幕的视频文件时。关键词：字幕烧录、burn subtitles、本地视频、hardcode subtitles
---

# 本地视频字幕烧录工具

将字幕文件烧录（硬编码）到本地视频中。

## 参数优先级

```
用户显式输入 > 项目 EXTEND.md > 用户 EXTEND.md > 内置默认值
```

## 工作流程

### 进度清单

```
字幕烧录进度：
- [ ] Step 0: 检查偏好设置 (EXTEND.md) ⛔ 阻塞
- [ ] Step 1: 环境检测 (FFmpeg + libass + 字体)
- [ ] Step 2: 确认输入文件 (视频 + 字幕 + 语言检测)
- [ ] Step 3: 确认处理方式 (单语/双语/翻译) ⚠️ 仅在偏好不足时询问
- [ ] Step 4: 预处理 (时间轴修正、格式转换、合并双语、翻译)
- [ ] Step 5: 烧录字幕
- [ ] Step 6: 输出报告
```

### 流程图

```
Input → [Step 0: 偏好设置] ─┬─ 找到 → 加载摘要 → 继续
                            └─ 未找到 → 首次设置 ⛔ 阻塞 → 保存 EXTEND.md → 继续
        ↓
[Step 1: 环境检测] → FFmpeg + libass + 字体
        ↓
[Step 2: 输入文件] → 视频 + 字幕扫描 + 语言检测 + 时间轴偏移检测
        ↓
[Step 3: 处理方式] → 单语 / 双语 / 翻译 ⚠️ 可跳过（偏好已明确时）
        ↓
[Step 4: 预处理] ─┬─ 时间轴修正（如有偏移）
                  ├─ VTT → SRT 转换（合并/翻译时）
                  ├─ 双语合并（如需要）
                  └─ 翻译字幕（如需要）
        ↓
[Step 5: 烧录] → FFmpeg 硬编码字幕
        ↓
[Step 6: 输出] → 文件路径 + 大小 + 预览命令
```

---

### Step 0: 加载偏好设置 ⛔ 阻塞

检查 EXTEND.md 存在性（项目级优先，用户级其次）：
```bash
test -f .baoyu-skills/local-video-subtitler/EXTEND.md && echo "project"
test -f "$HOME/.baoyu-skills/local-video-subtitler/EXTEND.md" && echo "user"
```

| 结果 | 操作 |
|------|------|
| 找到 | 加载，显示偏好摘要 → 继续 |
| 未找到 | ⛔ 运行首次设置（[references/config/first-time-setup.md](references/config/first-time-setup.md)）→ 保存 → 继续 |

**关键**：未找到时，必须先完成设置，才能问任何其他问题。

---

### Step 1: 环境检测

**目标**: 确保 FFmpeg 和字体可用

1. 检测 FFmpeg 和 libass 支持：
   ```bash
   ffmpeg -version
   ffmpeg -filters 2>&1 | grep subtitles
   ```

2. 检测字体（按优先级，结合偏好设置）：
   - 偏好指定的字体 → 有就用
   - Alibaba PuHuiTi 3.0 → 有就用
   - Noto Sans CJK → 有就用
   - 都没有 → 系统默认

**如果缺少 libass**：
- macOS: `brew install ffmpeg`
- Ubuntu: `sudo apt install ffmpeg libass-dev`

---

### Step 2: 确认输入文件

**目标**: 获取视频和字幕文件

1. 用户提供视频路径（mp4, mkv, avi 等）

2. 自动扫描同目录字幕文件：
   - 优先同名字幕（video.mp4 → video.srt）
   - 只有一个字幕 → 直接使用
   - 多个字幕 → 列出让用户选择

3. 支持格式：`.srt`、`.vtt`、`.ass`、`.ssa`（FFmpeg 直接支持，无需转换）

4. **时间轴偏移检测**（必须执行）：
   ```bash
   # 获取视频时长（秒）
   ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "<video_path>"
   
   # 获取字幕第一条起始时间
   # 如果起始时间 > 视频时长 → 有偏移，需要修正
   # 如果起始时间 ≤ 视频时长 → 正常，不处理
   ```
   
   **修正逻辑**：偏移量 = 字幕起始时间 - 0，将所有时间轴减去偏移量

5. 仅在以下情况需要转换 VTT → SRT：
   - 合并双语字幕时
   - 翻译字幕时
   ```bash
   python3 ~/.agents/skills/local-video-subtitler/scripts/convert_vtt_to_srt.py "<vtt_path>" "<srt_output>"
   ```

6. 自动检测语言：
   - 从文件名识别（subtitles_zh.srt → zh）
   - 从内容检测（中文字符 → zh，日文假名 → ja）

---

### Step 3: 确认处理方式

**目标**: 确认单语/双语/翻译

⚠️ 如果偏好设置中已有足够信息且用户意图明确，可跳过询问。

询问用户（仅在偏好不足时）：
- 是否需要双语字幕？（选择第二个字幕文件）
- 是否需要翻译？（用户主动要求时触发）

---

### Step 4: 预处理

**目标**: 准备最终字幕文件

#### 4a: 双语字幕合并（如需要）

```bash
python3 ~/.agents/skills/local-video-subtitler/scripts/merge_bilingual_subtitles.py \
  "<上方字幕.srt>" \
  "<下方字幕.srt>" \
  "<输出_bilingual.srt>"
```

顺序：从偏好 `bilingual.order` 读取，回退到内置默认（中文在上，英文在下）

#### 4b: 翻译字幕（如需要）

**触发条件**: 用户主动要求翻译

**翻译要求**：

原则：信达雅，准确第一

1. **准确性**：保持原意，不添加或删减内容
2. **流畅性**：优先使用地道的中文语序
3. **简洁性**：自然流畅，避免冗长，适当口语化
4. **一致性**：同一术语在整个字幕中翻译保持一致

**术语规范**：
| 英文 | 中文 |
|------|------|
| AI Agent | AI 智能体 |
| LLM | 大语言模型 |
| Skills | Skills（保留英文）|
| overfitting | 过拟合 |
| 其他专业术语 | 使用行业公认标准翻译 |

**批量翻译**：每批 20 条字幕一起翻译，节省 API 调用

**翻译条数验证**（必须执行）：
- 翻译完成后，必须验证：翻译后条数 = 原字幕条数
- 如果不匹配，必须修复，**禁止说"只差一条，影响不大"**
- 验证方法：`grep -c "^[0-9]\+$" <原字幕>` 与 `grep -c "^[0-9]\+$" <翻译字幕>` 比较

---

### Step 5: 烧录字幕

**目标**: 将字幕硬编码到视频

执行烧录：
```bash
python3 ~/.agents/skills/local-video-subtitler/scripts/burn_subtitles.py \
  "<video_path>" \
  "<subtitle_path>" \
  "<output_path>"
```

**参数来源**：从偏好读取，回退到内置默认值

| 参数 | 偏好字段 | 内置默认值 |
|------|----------|------------|
| 编码 | `encoding.codec` | H.264 |
| 质量 | `encoding.crf` | CRF 18（近无损）|
| 字体 | `subtitle_style.font` | Alibaba PuHuiTi 3.0 |
| 字号 | `subtitle_style.font_size` | 21 |
| 描边 | `subtitle_style.outline` | 0.75 |
| 边距 | `subtitle_style.margin_v` | 15 |
| 颜色 | `subtitle_style.color` + `subtitle_style.outline_color` | 白字黑边 |

---

### Step 6: 输出报告

**目标**: 展示处理结果

1. 输出目录：从偏好 `output.directory` 读取，回退到 `./output/`

2. 命名规则（从偏好 `output.naming` 读取，回退到内置默认）：
   - 单语：`video_zh.mp4`
   - 双语：`video_zh-en.mp4`

3. 向用户展示：
   - 输出文件路径
   - 文件大小
   - 预览命令：`open "<output_path>"`

---

## 错误处理

| 问题 | 解决方案 |
|------|----------|
| FFmpeg 无 subtitles 滤镜 | 安装带 libass 的 FFmpeg |
| 字幕文件编码错误 | 转换为 UTF-8 |
| 路径包含空格 | 脚本自动使用临时目录处理 |
| 字体未找到 | 自动回退到下一优先级字体 |

---

## 示例

**单语字幕**：
```
用户：把这个视频加上中文字幕
→ 加载偏好 → 检测环境 → 扫描字幕 → 烧录 → 输出 video_zh.mp4
```

**双语字幕**：
```
用户：把中英文字幕都加上
→ 加载偏好 → 合并双语字幕 → 烧录 → 输出 video_zh-en.mp4
```

**翻译后烧录**：
```
用户：把英文字幕翻译成中文再烧录
→ 加载偏好 → 翻译字幕 → 烧录 → 输出 video_zh.mp4
```

## 扩展支持

通过 EXTEND.md 自定义配置。参见 **Step 0** 了解路径。

支持：字体 | 字号 | 描边 | 边距 | 颜色 | 编码质量 | 双语顺序 | 输出目录 | 命名规则 | 语言

Schema：[references/config/preferences-schema.md](references/config/preferences-schema.md)

## 引用

**配置**：[preferences-schema.md](references/config/preferences-schema.md) | [first-time-setup.md](references/config/first-time-setup.md)
