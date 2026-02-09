# daftAI Skills

A collection of AI Agent skills for Amp, Claude Code, and other AI coding assistants.

## Available Skills

| Skill | Description |
|-------|-------------|
| [local-video-subtitler](skills/local-video-subtitler/) | 将字幕烧录到本地视频中，支持 SRT/VTT/ASS 格式、双语字幕合并和翻译 |

## Installation

### For Amp

```bash
# Clone the repository
git clone https://github.com/daftAI2026/daftAI-skills.git ~/.agents/skills/daftAI-skills

# Or symlink individual skills
ln -s /path/to/daftAI-skills/skills/local-video-subtitler ~/.agents/skills/local-video-subtitler
```

### For Claude Code

```bash
# Add to your Claude Code skills directory
git clone https://github.com/daftAI2026/daftAI-skills.git ~/.claude/skills/daftAI-skills
```

## Requirements

- **FFmpeg** with libass support (for video processing)
- **Python 3.8+** (for subtitle scripts)

### macOS

```bash
brew install ffmpeg
```

### Ubuntu/Debian

```bash
sudo apt install ffmpeg libass-dev
```

## Usage

Each skill has its own `SKILL.md` with detailed instructions. The AI assistant will automatically follow these instructions when the skill is loaded.

### Example: Burn Subtitles

```
User: 把这个视频加上中文字幕
→ AI loads local-video-subtitler skill
→ Detects environment, scans subtitles, burns to video
→ Output: video_zh.mp4
```

## Project Structure

```
daftAI-skills/
├── README.md
├── README.zh.md          # 中文说明
├── AGENTS.md             # AI assistant guidelines
├── .gitignore
└── skills/
    └── local-video-subtitler/
        ├── SKILL.md      # Skill definition
        └── scripts/      # Python utilities
```

## Contributing

Feel free to submit issues and pull requests.

## License

MIT License
