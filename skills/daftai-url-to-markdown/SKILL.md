---
name: daftai-url-to-markdown
description: >
  Fetch any URL and convert to markdown using Chrome CDP, with automatic image downloading.
  Supports auto-capture and wait-for-user modes. Downloads article images to local directory
  and rewrites image references to relative paths. Use when user wants to save a webpage
  as markdown with images. Keywords: url to markdown, save webpage, download article, 网页转markdown
---

# URL to Markdown

Fetches any URL via Chrome CDP and converts HTML to clean markdown, with automatic image downloading.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.ts`
3. Replace all `${SKILL_DIR}` in this document with the actual path

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/main.ts` | CLI entry point for URL fetching |
| `scripts/download-images.ts` | Image download and path rewriting |

## Preferences (EXTEND.md)

Use Bash to check EXTEND.md existence (priority order):

```bash
# Check project-level first
test -f .daftai-skills/daftAI-url-to-markdown/EXTEND.md && echo "project"

# Then user-level
test -f "$HOME/.daftai-skills/daftAI-url-to-markdown/EXTEND.md" && echo "user"
```

| Path | Location |
|------|----------|
| `.daftai-skills/daftAI-url-to-markdown/EXTEND.md` | Project directory |
| `$HOME/.daftai-skills/daftAI-url-to-markdown/EXTEND.md` | User home |

| Result | Action |
|--------|--------|
| Found | Read, parse, apply settings |
| Not found | Use defaults |

**EXTEND.md Supports**: Default output directory | Default capture mode | Timeout settings | Image download toggle

## Features

- Chrome CDP for full JavaScript rendering
- Two capture modes: auto or wait-for-user
- **Automatic image downloading** with local path rewriting
- `<picture>` / `<source>` tag support for complete image extraction
- Clean markdown output with metadata
- Handles login-required pages via wait mode

## Usage

```bash
# Auto mode (default) - capture and download images
npx -y bun ${SKILL_DIR}/scripts/main.ts <url>

# Wait mode - wait for user signal before capture
npx -y bun ${SKILL_DIR}/scripts/main.ts <url> --wait

# Skip image downloading
npx -y bun ${SKILL_DIR}/scripts/main.ts <url> --no-images

# Save to specific file
npx -y bun ${SKILL_DIR}/scripts/main.ts <url> -o output.md
```

## Options

| Option | Description |
|--------|-------------|
| `<url>` | URL to fetch |
| `-o <path>` | Output file path (default: auto-generated) |
| `--wait` | Wait for user signal before capturing |
| `--no-images` | Skip downloading images (keep remote URLs) |
| `--timeout <ms>` | Page load timeout (default: 30000) |

## Capture Modes

| Mode | Behavior | Use When |
|------|----------|----------|
| Auto (default) | Capture on network idle | Public pages, static content |
| Wait (`--wait`) | User signals when ready | Login-required, lazy loading, paywalls |

**Wait mode workflow**:
1. Run with `--wait` → script outputs "Press Enter when ready"
2. Ask user to confirm page is ready
3. Send newline to stdin to trigger capture

## Output Format

YAML front matter with `url`, `title`, `description`, `author`, `published`, `captured_at` fields, followed by converted markdown content.

## Output Directory

```
url-to-markdown/<domain>/
├── <slug>.md
└── images/
    ├── image1.png
    ├── image2.svg
    └── ...
```

- `<slug>`: From page title or URL path (kebab-case, 2-6 words)
- Images are saved to `images/` subdirectory next to the markdown file
- Image references in markdown use relative paths: `images/<filename>`
- Conflict resolution: Append timestamp `<slug>-YYYYMMDD-HHMMSS.md`

## Environment Variables

| Variable | Description |
|----------|-------------|
| `URL_CHROME_PATH` | Custom Chrome executable path |
| `URL_DATA_DIR` | Custom data directory |
| `URL_CHROME_PROFILE_DIR` | Custom Chrome profile directory |

**Troubleshooting**: Chrome not found → set `URL_CHROME_PATH`. Timeout → increase `--timeout`. Complex pages → try `--wait` mode.

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** section for paths and supported options.
