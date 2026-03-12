# Changelog

English | [中文](./CHANGELOG.zh.md)

## 1.4.0 - 2026-03-06

### Added (daftai-subtitle-translator)
- Step 4 Terminology Scan — scan full subtitle file before translating to extract proper nouns and technical terms, build session glossary, ensure terminology consistency across all batches.
- Step 6 Review (optional) — post-translation quality check for terminology consistency, missing translations, subtitle length, meaning spot-check. Auto-triggers for files with 100+ entries.
- Standalone glossary file `references/glossary-en-zh.md` — extracted from SKILL.md and expanded to 20 common AI/tech terms.

### Improved (daftai-subtitle-translator)
- Translation principles expanded from 5 to 8: added "meaning over words", "figurative language interpretation", and "emotional fidelity".

### Fixed (daftai-subtitle-translator)
- (2026-02-26) Bilingual subtitle default merge order changed from translated-on-top to original-on-top (English top, Chinese bottom), matching typical viewing preference.

## 1.3.1 - 2026-02-24

### Improved (daftai-video-subtitler)
- Clarified process-artifact policy: keep translated and bilingual merged subtitle outputs by default for reuse/review.
- Default cleanup now targets detection-only artifacts (screenshots/probe logs/temp checks), unless debugging is explicitly requested.
- Updated documentation and setup defaults in:
  - `skills/daftai-video-subtitler/SKILL.md`
  - `skills/daftai-video-subtitler/references/config/preferences-schema.md`
  - `skills/daftai-video-subtitler/references/config/first-time-setup.md`

## 1.3.0 - 2026-02-24

### Added (daftai-extracting-video-subtitles)
- New skill: extract timed SRT subtitles from video/audio files using OpenAI Whisper.
- `scripts/extract_subtitles.ts` — TypeScript wrapper for the full Whisper extraction workflow:
  - Auto-detects Whisper and FFmpeg environment
  - Validates audio stream presence
  - Auto-selects Whisper model by video duration (medium / turbo / base)
  - Handles complex filenames (copies to temp dir)
  - Auto-cleans temp files
  - Reports subtitle count and processing time
- Migrated from standalone `~/.agents/skills/extracting-video-subtitles` into this repo with symlink.
- Refactored from instruction-only SKILL.md to TypeScript script, consistent with other daftai- skills.

## 1.2.0 - 2026-02-18

### Added (daftai-url-to-markdown)
- Post-Capture Validation workflow in SKILL.md — agent now MUST validate output before reporting completion:
  1. **Completeness Check** — compare generated Markdown against original page, ensure no missing sections
  2. **Video & Embedded Media Detection** — scan page source for Vimeo/YouTube/iframe embeds, insert video links at correct positions
  3. **Image Placement Verification** — confirm images appear after correct paragraphs, verify local files exist
  4. **Irrelevant Content Cleanup** — remove nav menus, tag lists, newsletter forms, related articles, footer boilerplate
  5. **Formatting & Style Verification** — check bold/italic, heading hierarchy, lists, blockquotes, code blocks, `<hr>` → `---`
  6. **Link Verification** — fix broken multi-line links, convert relative URLs to absolute, validate link format

## 1.1.0 - 2026-02-17

### Improved
- Watermark/source label font size now calculated from video height (`height × 0.025`) instead of subtitle font size ratio. Fixes tiny text on high-res videos (e.g., 16px on 1080p → 27px).
- Watermark/source label default opacity changed from 0.5 to 0.7 for better visibility.
- SKILL.md and first-time-setup.md rewritten to structured English (following baoyu-skills pattern).
- Added `Language: Use user's input language` and `AskUserQuestion` rules for multilingual support.
- Added `get_video_height()` function using ffprobe for resolution-aware sizing.

## 1.0.1 - 2026-02-14

### Improved
- Translation rule: remove trailing period (。) from Chinese subtitle lines when translating from English.

## 1.0.0 - 2026-02-10

### Features
- First-time preference setup mechanism (EXTEND.md) with blocking setup flow before any workflow steps.
- Preferences schema documentation (`references/config/preferences-schema.md`).
- First-time setup flow documentation (`references/config/first-time-setup.md`).
- Project guidance file (`CLAUDE.md`).
- Bilingual changelog (`CHANGELOG.md` + `CHANGELOG.zh.md`).
- Structured 7-step workflow with progress checklist and flow diagram.
- Parameter priority chain: user input > project EXTEND.md > user EXTEND.md > built-in defaults.

### Refactor
- SKILL.md restructured from 6 phases to 7-step workflow (Step 0-6).
- Burn parameters changed from hardcoded values to "preference field → built-in default" pattern.

## 0.1.0 - 2026-02-04

### Features
- Core subtitle burning engine (`scripts/burn_subtitles.py`).
- VTT to SRT format conversion (`scripts/convert_vtt_to_srt.py`).
- Automatic language detection (`scripts/detect_language.py`).
- Bilingual subtitle merging (`scripts/merge_bilingual_subtitles.py`).
- Shared utility functions (`scripts/utils.py`).
- Support for SRT/VTT/ASS/SSA subtitle formats.
- Timeline offset auto-detection and correction.
- Font auto-detection with fallback chain.
- Subtitle translation with batch processing and count verification.
