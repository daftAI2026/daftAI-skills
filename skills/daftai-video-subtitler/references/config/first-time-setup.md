---
name: first-time-setup
description: First-time setup flow for daftAI-video-subtitler preferences
---

# First-Time Setup

## Overview

When no EXTEND.md is found, guide user through preference setup.

**⛔ BLOCKING OPERATION**: This setup MUST complete before ANY other workflow steps. Do NOT:
- Ask about video file path
- Ask about subtitle files
- Start environment detection
- Execute burn operations

ONLY ask the questions in this setup flow, save EXTEND.md, then continue.

## Setup Flow

```
No EXTEND.md found
        │
        ▼
┌─────────────────────┐
│ AskUserQuestion     │
│ (all questions)     │
└─────────────────────┘
        │
        ▼
┌─────────────────────┐
│ Create EXTEND.md    │
└─────────────────────┘
        │
        ▼
    Continue to Step 1
```

## Check EXTEND.md

Search order:

1. **Project**: `.daftAI-skills/daftAI-video-subtitler/EXTEND.md`
2. **User**: `~/.daftAI-skills/daftAI-video-subtitler/EXTEND.md`

Found → Read config, skip setup, continue workflow.
Neither found → Trigger first-time setup.

## Questions

**Language**: Use user's input language or preferred language for all questions. Do not always use English.

Use single AskUserQuestion with multiple questions (AskUserQuestion auto-adds "Other" option):

### Question 1: Watermark

```
header: "Watermark"
question: "Add watermark text to videos? Type your watermark content (e.g., @username, brand name), or choose no watermark"
options:
  - label: "No watermark (Recommended)"
    description: "Clean video, can enable later in EXTEND.md"
```

Position defaults to top-right. Opacity defaults to 0.7.

### Question 2: Source Label

```
header: "Source"
question: "Add source attribution to videos? When enabled, will ask source name each time and display as '素材来自于 XXX'"
options:
  - label: "No source label (Recommended)"
    description: "No source attribution on video"
  - label: "Enable source label"
    description: "Ask source each time, format: 素材来自于 {source}"
```

Position defaults to top-left. Opacity defaults to 0.7.

### Question 3: Font

```
header: "Font"
question: "Which font for subtitle rendering?"
options:
  - label: "Alibaba PuHuiTi 3.0 (Recommended)"
    description: "Free for commercial use, excellent CJK support"
  - label: "Noto Sans CJK"
    description: "Google's open-source CJK font"
  - label: "System default"
    description: "Use system built-in font"
```

### Question 4: Bilingual

```
header: "Bilingual"
question: "Default bilingual subtitle behavior?"
options:
  - label: "Mono only (Recommended)"
    description: "Burn single language only, no auto-merge"
  - label: "Auto-merge (Chinese top, English bottom)"
    description: "Auto-merge when second subtitle detected"
  - label: "Auto-merge (English top, Chinese bottom)"
    description: "Auto-merge with reversed order"
```

### Question 5: Output

```
header: "Output"
question: "Where to save burned videos?"
options:
  - label: "Same directory (Recommended)"
    description: "Output to video's directory"
  - label: "output/ subdirectory"
    description: "Output to output/ under video's directory"
```

### Question 6: Quick Mode

```
header: "Quick Mode"
question: "Skip confirmation and burn directly in future runs?"
options:
  - label: "No (Recommended)"
    description: "Confirm settings before each burn"
  - label: "Yes"
    description: "Skip confirmation, use saved preferences"
```

### Question 7: Save Location

```
header: "Save"
question: "Where to save preferences?"
options:
  - label: "User (Recommended)"
    description: "~/.daftAI-skills/ (all projects)"
  - label: "Project"
    description: ".daftAI-skills/ (this project only)"
```

### Skipped (use defaults)

These parameters are NOT asked, use recommended defaults directly:
- **Font size**: 21
- **Outline**: 0.75
- **Margin**: 15
- **CRF**: 18
- **Keep intermediate subtitles**: true
- **Keep screenshots**: false
- **Keep probe logs**: false

## Save Locations

| Choice | Path | Scope |
|--------|------|-------|
| User | `~/.daftAI-skills/daftAI-video-subtitler/EXTEND.md` | All projects |
| Project | `.daftAI-skills/daftAI-video-subtitler/EXTEND.md` | Current project |

## After Setup

1. Create directory if needed
2. Write EXTEND.md with YAML frontmatter
3. Confirm: "Preferences saved to [path]"
4. Continue to Step 1 (Environment Check)

## EXTEND.md Template

```yaml
---
version: 1

watermark:
  enabled: false
  text: ""
  position: "top-right"
  opacity: 0.7

source_label:
  enabled: false
  prefix: "素材来自于"
  position: "top-left"
  opacity: 0.7

font: "Alibaba PuHuiTi 3.0"
font_size: 21
outline: 0.75
margin_v: 15
crf: 18

output_dir: "same-dir"

bilingual:
  auto_merge: false
  order: "zh-top"

artifacts:
  keep_intermediate_subtitles: true
  keep_screenshots: false
  keep_probe_logs: false

quick_mode: false
language: null
---
```

## Modifying Preferences Later

- Delete EXTEND.md to trigger setup again
- Edit YAML frontmatter for quick changes
- Full schema: [preferences-schema.md](preferences-schema.md)
