---
name: daftai-chinese-copywriting
description: >
  Checks and fixes Chinese copywriting with autocorrect-backed workflows for text
  and single-file Markdown/TXT inputs. Auto-installs autocorrect when needed,
  supports review/stable/quick modes, and uses the upstream Chinese copywriting
  guidelines as the rule source. Use when user asks to normalize Chinese
  punctuation, spacing, full-width/half-width usage, or copywriting style.
---

# Chinese Copywriting

Checks and fixes Chinese copywriting with `autocorrect`, using the upstream guideline as the rule source.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.ts`
3. Execute via `npx tsx ${SKILL_DIR}/scripts/<script-name>.ts`
4. Replace all `${SKILL_DIR}` in this document with actual values

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/main.ts` | CLI entry for review/stable/quick workflows |
| `scripts/autocorrect.ts` | Detect, install, and run `autocorrect` |
| `scripts/shared.ts` | Preferences, input handling, and Markdown fence protection |

## Rules Source

- Upstream guideline: [sparanoid/chinese-copywriting-guidelines README.zh-Hans.md](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.zh-Hans.md)
- Execution engine: [huacnlee/autocorrect](https://github.com/huacnlee/autocorrect)

This skill does not copy or redefine the upstream guideline. It uses the guideline as source-of-truth and applies `autocorrect` as the execution engine.

## Workflow

```
- [ ] Step 0: Load preferences (EXTEND.md) or run first-time setup
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Resolve input as direct text or single Markdown/TXT file
- [ ] Step 3: Protect fenced code blocks in Markdown content
- [ ] Step 4: Run review/stable/quick
- [ ] Step 5: Report the result and write back file changes when applicable
```

### Modes

| Mode | Behavior |
|------|----------|
| `review` | Check only. Output lint summary and suggested corrected content. |
| `stable` | Fix content and output a normal summary. |
| `quick` | Fix content immediately with the same engine, optimized for speed. |

## Preferences (EXTEND.md)

Search order:

```bash
test -f .daftAI-skills/daftai-chinese-copywriting/EXTEND.md && echo "project"
test -f "$HOME/.daftAI-skills/daftai-chinese-copywriting/EXTEND.md" && echo "user"
```

Priority: user explicit input > project EXTEND.md > user EXTEND.md > built-in defaults

If neither file exists, run first-time setup using:
- [references/config/first-time-setup.md](references/config/first-time-setup.md)
- [references/config/preferences-schema.md](references/config/preferences-schema.md)

## Dependency

The skill requires `autocorrect`.

When `autocorrect` is missing, the script will:
1. Try `brew install autocorrect`
2. Fall back to `cargo install autocorrect`
3. Continue the current command if installation succeeds

## Usage

```bash
npx tsx ${SKILL_DIR}/scripts/main.ts review "你好world"
npx tsx ${SKILL_DIR}/scripts/main.ts stable "/path/to/file.md"
npx tsx ${SKILL_DIR}/scripts/main.ts quick "/path/to/file.txt"
```

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** for lookup order and the config references.
