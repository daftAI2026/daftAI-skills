# daftAI Skills

A collection of AI Agent skills for Amp, Claude Code, and other AI coding assistants.

## Available Skills

| Skill | Description |
|-------|-------------|
| [daftai-video-subtitler](skills/daftai-video-subtitler/) | Burn subtitles into local videos. Supports SRT/VTT/ASS formats, bilingual subtitle merging and translation |
| [daftai-subtitle-translator](skills/daftai-subtitle-translator/) | Translate subtitle files (SRT/VTT) between languages with terminology consistency |
| [daftai-extracting-video-subtitles](skills/daftai-extracting-video-subtitles/) | Extract timed SRT subtitles from video/audio files using OpenAI Whisper |
| [daftai-url-to-markdown](skills/daftai-url-to-markdown/) | Fetch any URL and convert to markdown using Chrome CDP, with automatic image downloading |
| [daftai-chinese-copywriting](skills/daftai-chinese-copywriting/) | Check and fix Chinese copywriting (punctuation, spacing, full-width/half-width) using autocorrect |

## Installation

### For Amp

```bash
# Clone the repository
git clone https://github.com/daftAI2026/daftAI-skills.git

# Symlink individual skills
ln -s /path/to/daftAI-skills/skills/daftai-video-subtitler ~/.agents/skills/daftai-video-subtitler
ln -s /path/to/daftAI-skills/skills/daftai-subtitle-translator ~/.agents/skills/daftai-subtitle-translator
ln -s /path/to/daftAI-skills/skills/daftai-extracting-video-subtitles ~/.agents/skills/daftai-extracting-video-subtitles
ln -s /path/to/daftAI-skills/skills/daftai-url-to-markdown ~/.agents/skills/daftai-url-to-markdown
ln -s /path/to/daftAI-skills/skills/daftai-chinese-copywriting ~/.agents/skills/daftai-chinese-copywriting
```

### For Claude Code

```bash
# Symlink individual skills
ln -s /path/to/daftAI-skills/skills/daftai-video-subtitler ~/.claude/skills/daftai-video-subtitler
ln -s /path/to/daftAI-skills/skills/daftai-subtitle-translator ~/.claude/skills/daftai-subtitle-translator
ln -s /path/to/daftAI-skills/skills/daftai-extracting-video-subtitles ~/.claude/skills/daftai-extracting-video-subtitles
ln -s /path/to/daftAI-skills/skills/daftai-url-to-markdown ~/.claude/skills/daftai-url-to-markdown
ln -s /path/to/daftAI-skills/skills/daftai-chinese-copywriting ~/.claude/skills/daftai-chinese-copywriting
```

## Requirements

- **Node.js** + **npx tsx** (for TypeScript scripts)
- **FFmpeg** with libass support (for video processing)
- **OpenAI Whisper** (for subtitle extraction)
- **autocorrect** (for Chinese copywriting, auto-installed)

### macOS

```bash
brew install ffmpeg openai-whisper
```

### Ubuntu/Debian

```bash
sudo apt install ffmpeg libass-dev
pip install openai-whisper
```

## Usage

Each skill has its own `SKILL.md` with detailed instructions. The AI assistant will automatically follow these instructions when the skill is loaded.

### Example: Extract Subtitles

```
User: Extract subtitles from this video
→ AI loads daftai-extracting-video-subtitles skill
→ npx tsx scripts/extract_subtitles.ts video.mp4 en
→ Output: video.srt
```

### Example: Burn Subtitles

```
User: Burn Chinese subtitles into this video
→ AI loads daftai-video-subtitler skill
→ Detects environment, scans subtitles, burns to video
→ Output: video_zh.mp4
```

## Project Structure

```
daftAI-skills/
├── README.md
├── README.zh.md
├── CHANGELOG.md
├── CHANGELOG.zh.md
├── AGENTS.md
├── .gitignore
└── skills/
    ├── daftai-video-subtitler/
    │   ├── SKILL.md
    │   ├── scripts/          # TypeScript utilities
    │   └── references/       # Config docs
    ├── daftai-subtitle-translator/
    │   ├── SKILL.md
    │   └── references/       # Glossary
    ├── daftai-extracting-video-subtitles/
    │   ├── SKILL.md
    │   └── scripts/          # TypeScript utilities
    ├── daftai-url-to-markdown/
    │   ├── SKILL.md
    │   └── scripts/          # TypeScript utilities
    └── daftai-chinese-copywriting/
        ├── SKILL.md
        ├── scripts/          # TypeScript utilities
        └── references/       # Config docs
```

## Contributing

Feel free to submit issues and pull requests.

## License

MIT License
