# daftAI Skills

为 Amp、Claude Code 等 AI 编程助手打造的 Skills 合集。

## 可用 Skills

| Skill | 描述 |
|-------|------|
| [local-video-subtitler](skills/local-video-subtitler/) | 本地视频字幕烧录工具，支持 SRT/VTT/ASS 格式、双语字幕合并和翻译 |

## 安装

### Amp 用户

```bash
# 克隆仓库
git clone https://github.com/daftAI2026/daftAI-skills.git ~/.agents/skills/daftAI-skills

# 或者只链接需要的 skill
ln -s /path/to/daftAI-skills/skills/local-video-subtitler ~/.agents/skills/local-video-subtitler
```

### Claude Code 用户

```bash
git clone https://github.com/daftAI2026/daftAI-skills.git ~/.claude/skills/daftAI-skills
```

## 环境要求

- **FFmpeg**（需要 libass 支持，用于视频处理）
- **Python 3.8+**（用于字幕处理脚本）

### macOS

```bash
brew install ffmpeg
```

### Ubuntu/Debian

```bash
sudo apt install ffmpeg libass-dev
```

## 使用方式

每个 skill 都有独立的 `SKILL.md` 文件，包含详细的使用说明。AI 助手会在加载 skill 后自动按照指令执行。

### 示例：烧录字幕

```
用户：把这个视频加上中文字幕
→ AI 加载 local-video-subtitler skill
→ 检测环境 → 扫描字幕 → 烧录到视频
→ 输出：video_zh.mp4
```

## 项目结构

```
daftAI-skills/
├── README.md             # 英文说明
├── README.zh.md          # 中文说明
├── AGENTS.md             # AI 助手指南
├── .gitignore
└── skills/
    └── local-video-subtitler/
        ├── SKILL.md      # Skill 定义
        └── scripts/      # Python 工具脚本
```

## 贡献

欢迎提交 Issue 和 Pull Request。

## 许可证

MIT License
