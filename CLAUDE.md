# daftAI Skills — Project Guidelines

This file provides guidance to AI agents (Amp, Claude Code) when working with code in this repository.

## Project Overview

AI agent skills for video/subtitle processing and content utilities. All skills use `daftai-` prefix to avoid conflicts when users import this plugin.

## Architecture

Skills are organized into plugin categories in `marketplace.json`:

```
skills/
├── [video-skills]                      # Video and subtitle processing
│   ├── daftai-video-subtitler/             # Burn subtitles into videos (FFmpeg)
│   ├── daftai-subtitle-translator/         # Translate subtitle files between languages
│   └── daftai-extracting-video-subtitles/  # Extract subtitles from video via Whisper
│
└── [utility-skills]                    # Content utilities
    └── daftai-url-to-markdown/             # Fetch URL and convert to markdown with images
```

**Plugin Categories**:

| Category | Description |
|----------|-------------|
| `video-skills` | Skills that process video or subtitle files (burning, translating, extracting) |
| `utility-skills` | Helper tools for content processing (URL conversion, etc.) |

Each skill contains:
- `SKILL.md` — YAML front matter (name, description) + workflow documentation
- `scripts/` — TypeScript implementations
- `references/` — Glossaries, config schemas, workflow details (optional)

## Running Scripts

All scripts are TypeScript, executed via `bun` (no build step).

### Runtime Detection

Before running any script, the agent MUST detect the runtime **once per session**:

```bash
# Detect runtime (run once, reuse result)
if command -v bun &>/dev/null; then
  RUNTIME="bun"
else
  echo "Error: bun not found. Install Bun: https://bun.sh/"
  exit 1
fi
```

| Priority | Condition | Runtime | Notes |
|----------|-----------|---------|-------|
| 1 | `bun` available | `bun` | Standard execution via Bun |
| 2 | Not found | Error + install guide | Suggest installing Bun |

### Script Execution

```bash
bun skills/<skill>/scripts/<script>.ts [options]
```

Scripts use only Node.js built-in modules (`fs`, `path`, `child_process`, `os`). No npm packages required.

**CRITICAL**: When running scripts from a skill, set the working directory (`cwd`) to the skill's base directory (where SKILL.md is located). Do NOT run from the user's project directory.

## Key Dependencies

- **Bun**: TypeScript runtime for all scripts
- **FFmpeg**: Required by `daftai-video-subtitler` for subtitle burning
- **Whisper**: Required by `daftai-extracting-video-subtitles` for speech-to-text
- **Chrome**: Required by `daftai-url-to-markdown` for CDP page rendering
- **No npm packages**: Self-contained TypeScript, no external dependencies

## Authentication

`daftai-url-to-markdown` uses Chrome CDP for browser automation:
- First run opens Chrome for page rendering
- Some pages may require user login before capture
- Supports "wait for user signal" mode for login-required pages

## Plugin Configuration

`.claude-plugin/marketplace.json` defines plugin metadata and skill paths. Version follows semver.

## Skill Loading Rules

**IMPORTANT**: When working in this project, follow these rules:

| Rule | Description |
|------|-------------|
| **Load project skills first** | MUST load all skills from `skills/` directory in current project. Project skills take priority over system/user-level skills with same name. |

**Loading Priority** (highest → lowest):
1. Current project `skills/` directory
2. User-level skills (`$HOME/.daftAI-skills/`)
3. System-level skills

## Release Process

**IMPORTANT**: When user requests release/发布/push, ALWAYS follow this checklist.

**Never skip**:
- `CHANGELOG.md` + `CHANGELOG.zh.md` — Both must be updated
- `.claude-plugin/marketplace.json` version bump
- `README.md` + `README.zh.md` if applicable
- All files committed together before tag

## Adding New Skills

**IMPORTANT**: All skills MUST use `daftai-` prefix to avoid conflicts when users import this plugin.

### Key Requirements

| Requirement | Details |
|-------------|---------|
| **Concise is key** | The agent is smart — only add context it doesn't have. Challenge each token. |
| **name field** | Max 64 chars, lowercase letters/numbers/hyphens only |
| **description field** | Max 1024 chars, non-empty, MUST be third person, include what + when to use |
| **SKILL.md body** | Keep under 500 lines; use separate files for additional content |
| **Naming convention** | `daftai-<name>` prefix required |
| **References** | Keep one level deep from SKILL.md; avoid nested references |
| **No time-sensitive info** | Avoid dates/versions that become outdated |

### Steps

1. Create `skills/daftai-<name>/SKILL.md` with YAML front matter
   - Directory name: `daftai-<name>`
   - SKILL.md `name` field: `daftai-<name>`
2. Add TypeScript scripts in `skills/daftai-<name>/scripts/`
3. Add reference files in `skills/daftai-<name>/references/` if needed
4. **Choose the appropriate category** and register in `marketplace.json`:
   - `video-skills`: For video/subtitle processing
   - `utility-skills`: For helper tools (conversion, etc.)
   - If none fit, create a new category with descriptive name
5. **Add Script Directory section** to SKILL.md (see template below)

### Choosing a Category

| If your skill... | Use category |
|------------------|--------------|
| Processes video or subtitle files | `video-skills` |
| Converts or processes content | `utility-skills` |
| Doesn't fit existing categories | Create a new category with descriptive name |

**Creating a new category**: Add a new plugin object to `marketplace.json` with:
- `name`: Descriptive kebab-case name (e.g., `audio-skills`)
- `description`: Brief description of the category
- `skills`: Array with the skill path

### Writing Effective Descriptions

**MUST write in third person** (not "I can help you" or "You can use this"):

```
# Good
description: Translates subtitle files between languages with auto-detection. Use when user asks to "translate subtitles", "翻译字幕", or needs subtitles converted.

# Bad
description: I can help you translate subtitles
description: You can use this to translate subtitle files
```

Include both **what** the skill does and **when** to use it (triggers/keywords).

### Script Directory Template

Every SKILL.md with scripts MUST include this section:

```
## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.ts`
3. Execute via `bun ${SKILL_DIR}/scripts/<script-name>.ts`
4. Replace all `${SKILL_DIR}` in this document with actual values

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/main.ts` | Main entry point |
| `scripts/other.ts` | Other functionality |
```

When referencing scripts in workflow sections, use `bun ${SKILL_DIR}/scripts/<name>.ts` so agents can resolve the correct path.

### Progressive Disclosure

For skills with extensive content, use separate reference files:

```
skills/daftai-example/
├── SKILL.md              # Main instructions (<500 lines)
├── references/
│   ├── glossary-en-zh.md # Term mappings
│   ├── config/
│   │   ├── preferences-schema.md
│   │   └── first-time-setup.md
│   └── workflow-details.md
└── scripts/
    └── main.ts
```

In SKILL.md, link to reference files (one level deep only):

```
**Glossary**: See [references/glossary-en-zh.md](references/glossary-en-zh.md)
```

## Extension Support (EXTEND.md)

Skills that need user preferences SHOULD support EXTEND.md configuration. This provides persistent settings (target language, glossary, style, etc.) without asking every time.

### How It Works

Check EXTEND.md existence (priority order):

```bash
# macOS, Linux, WSL, Git Bash
test -f .daftAI-skills/daftai-<skill-name>/EXTEND.md && echo "project"
test -f "$HOME/.daftAI-skills/daftai-<skill-name>/EXTEND.md" && echo "user"
```

| Path | Location |
|------|----------|
| `.daftAI-skills/daftai-<skill-name>/EXTEND.md` | Project directory |
| `$HOME/.daftAI-skills/daftai-<skill-name>/EXTEND.md` | User home |

| Result | Action |
|--------|--------|
| Found | Read, parse, apply settings. On first use in session, briefly remind: "Using preferences from [path]. You can edit EXTEND.md to customize." |
| Not found | **MUST** run first-time setup (see below) — do NOT silently use defaults |

### First-Time Setup (BLOCKING)

**CRITICAL**: When EXTEND.md is not found, you **MUST** run the first-time setup before ANY workflow steps. This is a **BLOCKING** operation.

Full reference: `references/config/first-time-setup.md`

Ask user all preference questions in **ONE** call (not sequentially). After user answers, create EXTEND.md at the chosen location, confirm "Preferences saved to [path]", then continue.

### Parameter Priority Chain

User input (explicit flags/instructions) > Project EXTEND.md > User EXTEND.md > Built-in defaults

### Adding EXTEND.md to a Skill

Every skill with preferences MUST include:

1. **Preferences section** in SKILL.md (or Step 1.1 in workflow):
   - EXTEND.md paths and lookup logic
   - Supported configuration options
   - Link to `references/config/preferences-schema.md`

2. **First-time setup** (`references/config/first-time-setup.md`):
   - Questions to ask user (all in ONE call, not sequentially)
   - EXTEND.md template to generate
   - Save location choice (project vs user home)

3. **Extension Support section** at the end of SKILL.md:
   ```
   ## Extension Support
   Custom configurations via EXTEND.md. See **Preferences** section for paths and supported options.
   ```

**Notes**:
- Replace `<skill-name>` with actual skill name (e.g., `daftai-video-subtitler`)
- Use `$HOME` instead of `~` for cross-platform compatibility (macOS/Linux/WSL)
- Use `test -f` for explicit file existence check

## Output Path Convention

Skills that produce output files should follow consistent naming.

### Output Directory

Each session creates an independent directory. Even the same source file generates a new directory per session.

```
<output-dir>/<topic-slug>/
```

- `<topic-slug>`: Generated from content topic (2-4 words, kebab-case)

### Slug Generation

- Extract main topic from content (2-4 words, kebab-case)
- Example: "Introduction to Machine Learning" → `intro-machine-learning`

### Conflict Resolution

If the output directory already exists:
- Append timestamp: `<topic-slug>-YYYYMMDD-HHMMSS/`
- Example: `ai-future` exists → `ai-future-20260118-143052`
- Never overwrite existing results

### File Naming Convention

Output filenames MUST be descriptive and include meaningful context:

- **Format**: `[NN-]<type>-[slug].<ext>`
  - `NN`: Two-digit sequence number if ordered (01, 02, ...)
  - `<type>`: File type (translated, bilingual, extracted, etc.)
  - `[slug]`: Descriptive kebab-case slug

- **Examples**:
  ```
  video_zh.srt
  video_bilingual.srt
  01-translated-intro.srt
  02-translated-chapter1.srt
  ```

- **Slug Rules**:
  - Derived from file purpose or content (kebab-case)
  - Must be unique within the output directory
  - 2-5 words, concise but descriptive
  - Include language code if applicable: `_zh`, `_en`, `_ja`

### Source Files

- Copy all sources to output directory with naming: `source-{slug}.{ext}`
- Original source files remain unchanged

## Inter-Skill Delegation

Skills that need functionality from other skills MUST delegate rather than re-implementing.

### Delegation Flow Template

Use this template when a skill needs to call another skill:

```
### Step N: Delegate to <skill-name>

**Skill Selection**:
1. Check available skills in `skills/` directory
2. Read selected skill's SKILL.md for parameter reference
3. If multiple skills available, ask user to choose

**Execution Flow**:
1. Call selected skill with required parameters
2. Handle failures gracefully with retry logic
3. Provide clear progress feedback to user
```

### Best Practices

- Always read the target skill's SKILL.md before calling
- Pass parameters exactly as documented in the skill
- Handle failures gracefully with retry logic
- Provide clear progress feedback to user

## Code Style

- TypeScript throughout, no comments unless complex logic
- Only Node.js built-in modules — no npm dependencies
- Async/await patterns
- Type-safe interfaces
