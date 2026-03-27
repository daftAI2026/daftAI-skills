# Changelog

English | [中文](./CHANGELOG.zh.md)

## 1.5.6 - 2026-03-27

### Improved (daftai-chinese-copywriting, daftai-video-subtitler, daftai-subtitle-translator, daftai-extracting-video-subtitles, daftai-url-to-markdown)
- Consolidated runtime execution: all skills now use `bun` exclusively (removed `npx` references)
- Updated `SKILL.md` Script Directory sections to reflect `bun` execution model
- Enhanced documentation in AGENTS.md, CLAUDE.md, README.md to align with Bun runtime

### Improved (daftai-chinese-copywriting)
- Enhanced `scripts/shared.ts` with `protectSyntax` and `restoreSyntax` functions for more robust syntax preservation (code blocks, inline code, math, links)
- Improved test coverage in `main.test.ts` with comprehensive workflow testing

## 1.5.5 - 2026-03-26

### Improved (daftai-chinese-copywriting)
- Added explicit trigger word mapping for mode selection: "校对/修正/排版" → stable, "检查/看看有没有问题" → review, "快速修正/autocorrect" → quick. Prevents "校对" from being incorrectly inferred as review mode.
- Chunked post-processing now outputs to new files `chunk-{NN}-corrected.md` (following baoyu-translate pattern), merge reads `chunk-*-corrected.md`. Avoids overwriting source chunks which caused `edit_file` match failures.

## 1.5.4 - 2026-03-25

### Improved (daftai-chinese-copywriting)
- Review mode inference: when user says "检查", "check", or "看看有没有问题", auto-enter review mode and skip first-time setup.
- Review now outputs a report file `{filename}-review.md` combining autocorrect lint + AI review findings, using a fixed template (`references/review-report-template.md`).
- Removed `report_style` preference (`brief` / `detailed`) — review always outputs a structured report.
- First-time setup simplified to 2 questions (default mode, save location), only triggered for `quick` / `stable` modes.

## 1.5.3 - 2026-03-25

### Improved (daftai-chinese-copywriting)
- Trimmed `description` to remove implementation details (auto-install, mode list, rule source) — keep only trigger signals.
- Added Chinese trigger keywords: "校对", "检查排版", "中英文空格", "全角半角".

## 1.5.2 - 2026-03-24

### Improved (daftai-chinese-copywriting)
- Added explicit Defaults table with `chunk_threshold` (4000) and `chunk_max_words` (5000) — agents no longer guess chunk sizes.
- Added `references/subagent-prompt-template.md` — precise subagent instructions with absolute paths for chunked AI post-processing.
- Rewrote Step 6 chunked workflow to mandate subagent usage with the prompt template instead of vague "can use subagents in parallel".
- `renderSummary` now warns "AI post-processing still required" in stable mode, preventing agents from reporting completion after autocorrect alone.
- `writePreferences` no longer writes `report_style` when default mode is not `review`, so users get asked when they first use review mode.
- Save location default changed from `user` to `project`.

### Improved (README)
- Restructured README.md and README.zh.md opening to match baoyu-skills pattern (title → language switch → description → prerequisites).
- Simplified Quick Install to a single command.

## 1.5.1 - 2026-03-21

### Improved (daftai-chinese-copywriting)
- Batch file support: pass multiple file paths in a single command instead of running once per file.
- Removed `autoInstallAutocorrect` preference — autocorrect is now always auto-installed when missing, no need to ask.
- `reportStyle` setup question is now conditional — only asked when default mode is `review` (the only mode where it matters).
- Simplified first-time setup from 4 questions to 2–3.

## 1.5.0 - 2026-03-18

### Added (daftai-chinese-copywriting)
- New skill: checks and fixes Chinese copywriting using [autocorrect](https://github.com/huacnlee/autocorrect) with the [sparanoid/chinese-copywriting-guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines) as rule source.
- Three modes: `review` (check only), `stable` (fix with summary), `quick` (fix optimized for speed).
- Auto-detects and installs `autocorrect` via Homebrew or Cargo.
- Markdown fence protection — preserves code blocks during correction.
- EXTEND.md preference support for project/user-level configuration.

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
