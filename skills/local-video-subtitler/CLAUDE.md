# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Amp agent skill for burning (hardcoding) subtitles into local videos. Supports SRT/VTT/ASS formats, automatic subtitle and language detection, bilingual subtitle merging, and translation. Depends on FFmpeg + libass; Python scripts use only standard library.

## Architecture

```
local-video-subtitler/
├── SKILL.md                          # Skill definition (workflow + YAML frontmatter)
├── CLAUDE.md                         # Project guidance (this file)
├── CHANGELOG.md                      # English changelog
├── CHANGELOG.zh.md                   # Chinese changelog
├── references/
│   └── config/
│       ├── first-time-setup.md       # First-time preference setup flow
│       └── preferences-schema.md     # EXTEND.md YAML schema
└── scripts/
    ├── burn_subtitles.py             # Core subtitle burning engine
    ├── convert_vtt_to_srt.py         # VTT → SRT format conversion
    ├── detect_language.py            # Language detection
    ├── merge_bilingual_subtitles.py  # Bilingual subtitle merging
    └── utils.py                      # Shared utilities
```

## Running Scripts

All scripts run via Python 3 (no external packages):

```bash
python3 scripts/burn_subtitles.py <video> <subtitle> <output> [font_size] [outline] [margin_v]
python3 scripts/convert_vtt_to_srt.py <vtt_path> <srt_output>
python3 scripts/merge_bilingual_subtitles.py <top_subtitle> <bottom_subtitle> <output>
```

## Key Dependencies

| Dependency | Purpose |
|-----------|---------|
| **FFmpeg** | Video encoding with libass subtitle filter |
| **Python 3** | Script runtime (standard library only) |
| **libass** | Advanced subtitle rendering |

**No external Python packages required.** All scripts use only standard library modules.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.py`
3. Replace all `${SKILL_DIR}` in documents with the actual path

| Script | Purpose |
|--------|---------|
| `scripts/burn_subtitles.py` | Core subtitle burning with FFmpeg |
| `scripts/convert_vtt_to_srt.py` | VTT to SRT format conversion |
| `scripts/detect_language.py` | Subtitle language detection |
| `scripts/merge_bilingual_subtitles.py` | Merge two subtitle files for bilingual output |
| `scripts/utils.py` | Shared utility functions |

## Release Process

**IMPORTANT**: When updating this skill, ALWAYS update both changelog files.

**Never skip**:
1. `CHANGELOG.md` + `CHANGELOG.zh.md` — Both must be updated with same entries
2. Version bump in changelog header
3. `SKILL.md` if workflow changes

## Version Convention

Version follows semver (Major.Minor.Patch):

| Change Type | Version Bump |
|-------------|-------------|
| Breaking workflow changes | Major |
| New features, new config options | Minor |
| Bug fixes, documentation updates | Patch |

Current version: **1.0.0**

## Code Style

- Python 3, no comments unless complex logic
- Standard library only — no pip dependencies
- Use `pathlib.Path` for file operations
- Handle paths with spaces via temp directory
- UTF-8 encoding throughout

## Parameter Priority

**IMPORTANT**: When resolving parameter values, follow this priority chain:

```
User explicit input > Project EXTEND.md > User EXTEND.md > Built-in defaults
```

Built-in defaults (used when no EXTEND.md exists):

| Parameter | Default |
|-----------|---------|
| Font | Alibaba PuHuiTi 3.0 |
| Font size | 21 |
| Outline | 0.75 |
| Margin V | 15 |
| CRF | 18 |
| Output dir | same-dir |
| Bilingual order | zh-top |

## Extension Support

Every workflow run MUST check for EXTEND.md preferences before proceeding.

### Load Preferences

Use Bash to check EXTEND.md existence (priority order):

```bash
# Check project-level first
test -f .baoyu-skills/local-video-subtitler/EXTEND.md && echo "project"

# Then user-level
test -f "$HOME/.baoyu-skills/local-video-subtitler/EXTEND.md" && echo "user"
```

| Path | Location |
|------|----------|
| `.baoyu-skills/local-video-subtitler/EXTEND.md` | Project directory |
| `$HOME/.baoyu-skills/local-video-subtitler/EXTEND.md` | User home |

| Result | Action |
|--------|--------|
| Found | Read, parse, display summary |
| Not found | ⛔ Run first-time setup (references/config/first-time-setup.md) — BLOCKING |

**EXTEND.md Supports**: Font | Font size | Outline | Margin | CRF | Output directory | Bilingual behavior | Language

Schema: `references/config/preferences-schema.md`

## Development Guidelines

| Rule | Description |
|------|-------------|
| **Keep SKILL.md in sync** | Progress checklist and flow diagram must match actual steps |
| **Update schema on default changes** | Any default parameter change requires `preferences-schema.md` update |
| **Scripts in scripts/** | All executable code lives in `scripts/` directory |
| **References in references/** | All documentation files live in `references/` directory |
| **Test after changes** | Verify with short video + test subtitle after modifying scripts |

## Testing

- After modifying `scripts/`, test with a short video + test subtitle file
- Verify FFmpeg command executes correctly (check exit code and stderr)
- Test edge cases: paths with spaces, special characters, missing fonts
