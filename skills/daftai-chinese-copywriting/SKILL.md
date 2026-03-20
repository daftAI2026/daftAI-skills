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

- Upstream guideline: [sparanoid/chinese-copywriting-guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.zh-Hans.md)
- Local reference: [references/rules/copywriting-guidelines.md](references/rules/copywriting-guidelines.md) — full rules with correct/incorrect examples (空格 through 争议)
- Execution engine: [huacnlee/autocorrect](https://github.com/huacnlee/autocorrect)

## Workflow

### Modes

| Mode | Behavior | Output |
|------|----------|--------|
| `review` | Check only. Output lint summary and suggested corrections. | No file written. |
| `quick` | Pure `autocorrect --fix`. Fast, tool-only. | `{filename}-corrected.{ext}` |
| `stable` | `autocorrect --fix` + AI post-processing. Catches issues autocorrect misses. | `{filename}-corrected.{ext}` |

### `review` workflow

```
- [ ] Step 0: Load preferences (EXTEND.md) or run first-time setup
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Run: npx tsx ${SKILL_DIR}/scripts/main.ts review <input>
- [ ] Step 3: Report lint results to user
```

### `quick` workflow

```
- [ ] Step 0: Load preferences (EXTEND.md) or run first-time setup
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Run: npx tsx ${SKILL_DIR}/scripts/main.ts quick <input>
- [ ] Step 3: Report output file path to user
```

### `stable` workflow

```
- [ ] Step 0: Load preferences (EXTEND.md) or run first-time setup
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Run: npx tsx ${SKILL_DIR}/scripts/main.ts stable <input>
- [ ] Step 3: Read the output file ({filename}-corrected.{ext})
- [ ] Step 4: Read references/rules/copywriting-guidelines.md for the full rule set
- [ ] Step 5: AI post-processing — review the corrected content against the guidelines and fix remaining issues that autocorrect missed, including:
  - Half-width punctuation (. , : ;) after English words in Chinese context → convert to full-width（。，：；）
  - Half-width parentheses () in Chinese context → convert to full-width（）
  - Repeated punctuation (！！、？？) → deduplicate
  - Full-width punctuation followed by extra space → remove space
  - Other violations listed in the guidelines
- [ ] Step 6: Write the final result back to the same output file
- [ ] Step 7: Report output file path to user
```

## Preferences (EXTEND.md)

Search order:

```bash
test -f .daftAI-skills/daftai-chinese-copywriting/EXTEND.md && echo "project"
test -f "$HOME/.daftAI-skills/daftai-chinese-copywriting/EXTEND.md" && echo "user"
```

Priority: user explicit input > project EXTEND.md > user EXTEND.md > built-in defaults

### First-time setup (BLOCKING)

When neither EXTEND.md exists, the agent **MUST** complete first-time setup before any correction workflow step:

1. Ask the user (in one message) their preferences:
   - Default mode: `stable` / `quick` / `review` (default: `stable`)
   - Report style: `brief` / `detailed` (default: `brief`) — **only ask when default mode is `review`**
   - Save location: `user` (~/.daftAI-skills/...) or `project` (.daftAI-skills/...) (default: `user`)
2. Write the EXTEND.md file via the script: `npx tsx ${SKILL_DIR}/scripts/main.ts init --mode <mode> --report-style <style> --scope <user|project>`
3. Confirm to the user: "Preferences saved to [path]"
4. Continue with the requested workflow

Do not auto-fill defaults before asking. Do not silently create a user-level or project-level EXTEND.md.

After the setup questions have been asked, the user may answer with "use your recommended settings", "use defaults", or equivalent. In that case, apply the recommended/default answers to the four setup items, save EXTEND.md, confirm the saved path, and continue.

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
npx tsx ${SKILL_DIR}/scripts/main.ts stable "/path/to/a.md" "/path/to/b.md" "/path/to/c.txt"
npx tsx ${SKILL_DIR}/scripts/main.ts quick "/path/to/file.txt"
```

## Extension Support

Custom configurations via EXTEND.md. See **Preferences** for lookup order and the config references.
