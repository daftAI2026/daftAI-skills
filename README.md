# daftAI-skills

English | [中文](./README.zh.md)

Skills shared by daftAI for improving daily work efficiency with AI Agent.

## Prerequisites

- Node.js environment installed
- Ability to run `npx bun` commands

## Installation

### Quick Install (Recommended)

```bash
npx skills add daftAI2026/daftAI-skills
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [daftai-video-subtitler](skills/daftai-video-subtitler/) | Burn subtitles into local videos. Supports SRT/VTT/ASS formats, bilingual subtitle merging and translation |
| [daftai-subtitle-translator](skills/daftai-subtitle-translator/) | Translate subtitle files (SRT/VTT) between languages with terminology consistency |
| [daftai-extracting-video-subtitles](skills/daftai-extracting-video-subtitles/) | Extract timed SRT subtitles from video/audio files using OpenAI Whisper |
| [daftai-url-to-markdown](skills/daftai-url-to-markdown/) | Fetch any URL and convert to markdown using Chrome CDP, with automatic image downloading |
| [daftai-chinese-copywriting](skills/daftai-chinese-copywriting/) | Check and fix Chinese copywriting (punctuation, spacing, full-width/half-width) using autocorrect |

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
