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
| [daftai-cloudflare-billing-audit](skills/daftai-cloudflare-billing-audit/) | Read-only, progressive Cloudflare billing-risk review with structured reports in the user’s language and optional explicitly scoped online evidence. Requires Bun; see the skill for platform boundaries. |
| [daftai-video-compositor](skills/daftai-video-compositor/) | Embed a local video into an exact rectangular or rounded screenshot region, preserving layout and original audio. Requires Bun, FFmpeg, and FFprobe. |
| [daftai-video-subtitler](skills/daftai-video-subtitler/) | Burn subtitles into local videos. Supports SRT/VTT/ASS formats, bilingual subtitle merging and translation |
| [daftai-subtitle-translator](skills/daftai-subtitle-translator/) | Translate subtitle files (SRT/VTT) between languages with terminology consistency |
| [daftai-extracting-video-subtitles](skills/daftai-extracting-video-subtitles/) | Extract timed SRT subtitles from video/audio files using OpenAI Whisper |
| [daftai-url-to-markdown](skills/daftai-url-to-markdown/) | Fetch any URL and convert to markdown using Chrome CDP, with automatic image downloading |
| [daftai-chinese-copywriting](skills/daftai-chinese-copywriting/) | Check and fix Chinese copywriting (punctuation, spacing, full-width/half-width) using autocorrect |
| [daftai-chinese-technical-writing](skills/daftai-chinese-technical-writing/) | Write and review Chinese technical docs, product copy, and UI microcopy with ruanyf references and STE-inspired Chinese methods; delegate formatting checks to the copywriting skill |
| [daftai-image-to-svg](skills/daftai-image-to-svg/) | Convert transparent or solid-background single-color PNG/SVG artwork into measured, path-only SVG output |
| [daftai-gpt-image-2-5-prompt-optimizer](skills/daftai-gpt-image-2-5-prompt-optimizer/) | Optimize natural-language requests into GPT Image 2.5 prompts using live official guidance; returns text, not images |

## Usage

Each skill has its own `SKILL.md` with detailed instructions. The AI assistant will automatically follow these instructions when the skill is loaded.

### Example: Extract Subtitles

```
User: Extract subtitles from this video
→ AI loads daftai-extracting-video-subtitles skill
→ bun scripts/extract_subtitles.ts video.mp4 en
→ Output: video.srt
```

### Example: Burn Subtitles

```
User: Burn Chinese subtitles into this video
→ AI loads daftai-video-subtitler skill
→ Detects environment, scans subtitles, burns to video
→ Output: video_zh.mp4
```

### Example: Optimize an Image Prompt

```text
User: Use daftai-gpt-image-2-5-prompt-optimizer: a watercolor postcard of an orange cat in a rainy alley, no text.
→ If `references/gpt-image-2-5/` already matches the published layout, AI reads the local index; otherwise it fetches once
→ Later runs reuse that local official reference, with no image API key
```

### Example: Write Chinese Technical or UI Copy

```text
User: Rewrite this Chinese README so the setup steps are clear, then check its formatting.
→ AI loads daftai-chinese-technical-writing and the relevant bundled references
→ Preserves commands, facts, and constraints; improves structure and wording
→ Delegates the requested format check to daftai-chinese-copywriting in review mode
```

The writing skill needs no runtime or preference setup. Optional automated formatting checks require the separate `daftai-chinese-copywriting` skill, Bun, and autocorrect.

Procedural passages, tool descriptions, Agent instructions, and status messages use STE-inspired Chinese methods on demand. They preserve conditions, permissions, and failure branches without claiming ASD-STE100 compliance.

The copywriting skill prefers `EXTEND.json` and saves new settings as JSON. Existing `EXTEND.md` settings remain readable without automatic migration.

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
    ├── daftai-video-compositor/
    │   ├── SKILL.md
    │   ├── agents/           # Codex metadata
    │   └── scripts/          # TypeScript compositor, masks, and tests
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
    ├── daftai-chinese-copywriting/
    │   ├── SKILL.md
    │   ├── scripts/          # TypeScript utilities
    │   └── references/       # Config docs
    ├── daftai-chinese-technical-writing/
    │   ├── SKILL.md
    │   └── references/       # Six original sections, controlled Chinese methods, and product/UI extensions
    ├── daftai-image-to-svg/
    │   ├── SKILL.md
    │   ├── agents/           # Codex metadata
    │   └── scripts/          # TypeScript converter and tests
    └── daftai-gpt-image-2-5-prompt-optimizer/
        ├── SKILL.md
        ├── agents/           # Codex metadata
        ├── scripts/          # Lightweight TypeScript fetcher and tests
        └── references/       # Source rules, local official reference layout, and acceptance cases
```

## Contributing

Feel free to submit issues and pull requests.

## License

MIT License
