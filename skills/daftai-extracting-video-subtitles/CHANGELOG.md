# Changelog

## [1.1.0] - 2026-02-24

### Refactored — Instruction-only → TypeScript Script

- Added `scripts/extract_subtitles.ts` — wraps the full Whisper subtitle extraction workflow
- Updated `SKILL.md` — references script, simplified instructions
- Renamed from `extracting-video-subtitles` to `daftai-extracting-video-subtitles`
- Migrated from standalone `~/.agents/skills/` to `daftAI-skills` repo with symlink

#### Script Features

- Auto-detects Whisper and FFmpeg environment
- Validates audio stream presence
- Auto-selects Whisper model by video duration (medium / turbo / base)
- Handles complex filenames (copies to temp dir)
- Auto-cleans temp files
- Reports subtitle count and processing time

#### Technical Notes

- Uses only Node.js built-in modules (`fs`, `path`, `child_process`, `os`) — no npm dependencies
- Runs TypeScript directly via `npx tsx` — no compilation needed
- Whisper and FFmpeg remain external dependencies

## [1.0.0] - 2026-02-17

### Initial Release

Instruction-only SKILL.md using bash command templates to invoke Whisper CLI.
