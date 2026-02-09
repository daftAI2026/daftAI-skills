# daftAI Skills - AI Assistant Guidelines

This repository contains AI agent skills for Amp and Claude Code.

## Project Structure

```
skills/
└── <skill-name>/
    ├── SKILL.md        # Main skill definition (required)
    └── scripts/        # Helper scripts (optional)
```

## Skills Overview

### local-video-subtitler
- **Purpose**: Burn subtitles into local videos
- **Formats**: SRT, VTT, ASS, SSA
- **Features**: Bilingual subtitles, translation, font detection
- **Scripts**: Python utilities in `scripts/` directory

## Running Scripts

All Python scripts should be run from the skill's scripts directory:

```bash
python3 ~/.agents/skills/local-video-subtitler/scripts/burn_subtitles.py <video> <subtitle> <output>
```

## Adding New Skills

1. Create directory under `skills/`
2. Add `SKILL.md` with:
   - YAML frontmatter (name, description)
   - Workflow documentation
   - Usage examples
3. Add helper scripts in `scripts/` if needed

## Naming Convention

- Skill names: `lowercase-with-dashes`
- No prefix required (unlike baoyu-skills)
- Clear, descriptive names
