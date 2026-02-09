# Changelog

English | [中文](./CHANGELOG.zh.md)

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
