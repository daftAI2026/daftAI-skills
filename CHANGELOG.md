# Changelog

English | [中文](./CHANGELOG.zh.md)

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
