# daftAI Skills

为 Amp、Claude Code 等 AI 编程助手打造的 Skills 合集。

## 可用 Skills

| Skill | 描述 |
|-------|------|
| [daftai-video-subtitler](skills/daftai-video-subtitler/) | 本地视频字幕烧录工具，支持 SRT/VTT/ASS 格式、双语字幕合并和翻译 |
| [daftai-subtitle-translator](skills/daftai-subtitle-translator/) | 字幕文件翻译（SRT/VTT），支持术语一致性检查 |
| [daftai-extracting-video-subtitles](skills/daftai-extracting-video-subtitles/) | 使用 OpenAI Whisper 从视频/音频文件中提取带时间戳的 SRT 字幕 |
| [daftai-url-to-markdown](skills/daftai-url-to-markdown/) | 通过 Chrome CDP 抓取网页并转换为 Markdown，自动下载图片 |
| [daftai-chinese-copywriting](skills/daftai-chinese-copywriting/) | 基于 autocorrect 检查和修正中文排版（标点、空格、全角/半角） |

## 安装

### Amp 用户

```bash
# 克隆仓库
git clone https://github.com/daftAI2026/daftAI-skills.git

# 软链接各个 skill
ln -s /path/to/daftAI-skills/skills/daftai-video-subtitler ~/.agents/skills/daftai-video-subtitler
ln -s /path/to/daftAI-skills/skills/daftai-subtitle-translator ~/.agents/skills/daftai-subtitle-translator
ln -s /path/to/daftAI-skills/skills/daftai-extracting-video-subtitles ~/.agents/skills/daftai-extracting-video-subtitles
ln -s /path/to/daftAI-skills/skills/daftai-url-to-markdown ~/.agents/skills/daftai-url-to-markdown
ln -s /path/to/daftAI-skills/skills/daftai-chinese-copywriting ~/.agents/skills/daftai-chinese-copywriting
```

### Claude Code 用户

```bash
# 软链接各个 skill
ln -s /path/to/daftAI-skills/skills/daftai-video-subtitler ~/.claude/skills/daftai-video-subtitler
ln -s /path/to/daftAI-skills/skills/daftai-subtitle-translator ~/.claude/skills/daftai-subtitle-translator
ln -s /path/to/daftAI-skills/skills/daftai-extracting-video-subtitles ~/.claude/skills/daftai-extracting-video-subtitles
ln -s /path/to/daftAI-skills/skills/daftai-url-to-markdown ~/.claude/skills/daftai-url-to-markdown
ln -s /path/to/daftAI-skills/skills/daftai-chinese-copywriting ~/.claude/skills/daftai-chinese-copywriting
```

## 环境要求

- **Node.js** + **npx tsx**（运行 TypeScript 脚本）
- **FFmpeg**（需要 libass 支持，用于视频处理）
- **OpenAI Whisper**（用于字幕提取）
- **autocorrect**（用于中文排版检查，自动安装）

### macOS

```bash
brew install ffmpeg openai-whisper
```

### Ubuntu/Debian

```bash
sudo apt install ffmpeg libass-dev
pip install openai-whisper
```

## 使用方式

每个 skill 都有独立的 `SKILL.md` 文件，包含详细的使用说明。AI 助手会在加载 skill 后自动按照指令执行。

### 示例：提取字幕

```
用户：帮我提取这个视频的字幕
→ AI 加载 daftai-extracting-video-subtitles skill
→ npx tsx scripts/extract_subtitles.ts video.mp4 en
→ 输出：video.srt
```

### 示例：烧录字幕

```
用户：把这个视频加上中文字幕
→ AI 加载 daftai-video-subtitler skill
→ 检测环境 → 扫描字幕 → 烧录到视频
→ 输出：video_zh.mp4
```

## 项目结构

```
daftAI-skills/
├── README.md             # 英文说明
├── README.zh.md          # 中文说明
├── CHANGELOG.md          # 英文变更日志
├── CHANGELOG.zh.md       # 中文变更日志
├── AGENTS.md             # AI 助手指南
├── .gitignore
└── skills/
    ├── daftai-video-subtitler/
    │   ├── SKILL.md
    │   ├── scripts/          # TypeScript 工具脚本
    │   └── references/       # 配置文档
    ├── daftai-subtitle-translator/
    │   ├── SKILL.md
    │   └── references/       # 术语表
    ├── daftai-extracting-video-subtitles/
    │   ├── SKILL.md
    │   └── scripts/          # TypeScript 工具脚本
    ├── daftai-url-to-markdown/
    │   ├── SKILL.md
    │   └── scripts/          # TypeScript 工具脚本
    └── daftai-chinese-copywriting/
        ├── SKILL.md
        ├── scripts/          # TypeScript 工具脚本
        └── references/       # 配置文档
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License
