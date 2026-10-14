---
name: daftai-chinese-copywriting
description: >
  Checks and fixes Chinese copywriting with autocorrect-backed workflows for text
  and single-file Markdown/TXT inputs. Use when user asks to normalize Chinese
  punctuation, spacing, or full-width/half-width usage.
  Also triggers for "校对", "检查排版", "中英文空格", "全角半角".
  Does not rewrite document structure, product claims, or UI messaging.
metadata:
  openclaw:
    requires:
      anyBins:
        - bun
---

# Chinese Copywriting

Checks and fixes Chinese copywriting with `autocorrect`, using the upstream guideline as the rule source.

## Script Directory

**Important**: All scripts are located in the `scripts/` subdirectory of this skill.

**Agent Execution Instructions**:
1. Determine this SKILL.md file's directory path as `SKILL_DIR`
2. Script path = `${SKILL_DIR}/scripts/<script-name>.ts`
3. Execute via `bun ${SKILL_DIR}/scripts/<script-name>.ts`
4. Set the working directory to `${SKILL_DIR}` and use absolute input paths
5. Replace all `${SKILL_DIR}` in this document with actual values

**Script Reference**:
| Script | Purpose |
|--------|---------|
| `scripts/main.ts` | CLI entry for review/stable/quick workflows |
| `scripts/autocorrect.ts` | Detect, install, and run `autocorrect` |
| `scripts/shared.ts` | Preferences, input handling, and syntax protection (code/math/links) |
| `scripts/chunk.ts` | Markdown-aware chunking for long texts |
| `scripts/main.test.ts` | Preferences and syntax-protection regression checks |
| `scripts/cli.test.ts` | Isolated CLI mode/setup checks without installing autocorrect |

All scripts are executed via `bun`. `scripts/chunk.ts` depends on `markdown-it` which is installed under `scripts/node_modules/`. Before AI post-processing, `protectSyntax` replaces fenced code blocks, inline code, block/inline math (`$$`/`$`), and link/image URLs with placeholders; `restoreSyntax` reverses this after processing.

## Defaults

| Setting | Default | Preference key | Description |
|---------|---------|---------------|-------------|
| Mode | `stable` | `default_mode` | Workflow mode (`stable` or `quick`; `review` is inferred from user intent) |
| Chunk threshold | `4000` | `chunk_threshold` | Word count to trigger chunked processing |
| Chunk max words | `5000` | `chunk_max_words` | Max words per chunk |

## Rules Source

- Upstream guideline: [sparanoid/chinese-copywriting-guidelines](https://github.com/sparanoid/chinese-copywriting-guidelines/blob/master/README.zh-Hans.md)
- Local reference: [references/rules/copywriting-guidelines.md](references/rules/copywriting-guidelines.md) — full rules with correct/incorrect examples (空格 through 争议)
- Execution engine: [huacnlee/autocorrect](https://github.com/huacnlee/autocorrect)

## Workflow

### Mode Selection

Infer mode from the user's wording:

| Trigger words | Mode | Rationale |
|---------------|------|-----------|
| 检查、check、看看有没有问题、lint、有什么问题 | `review` | Read-only, just report issues |
| 校对、修正、排版、格式化、fix、纠正、规范化 | `stable` | Check + fix with AI post-processing |
| 快速修正、quick fix、autocorrect | `quick` | Pure autocorrect, no AI |

If the user's wording matches `review`, skip first-time setup (review is read-only). For `stable` / `quick`, load JSON-first preferences or complete first-time setup. If no keyword matches, fall back to the user's configured `default_mode` (default: `stable`).

### Modes

| Mode | Behavior | Output |
|------|----------|--------|
| `review` | Check only. autocorrect lint + AI review, output report. | `{filename}-review.md` |
| `quick` | Pure `autocorrect --fix`. Fast, tool-only. | `{filename}-corrected.{ext}` |
| `stable` | `autocorrect --fix` + AI post-processing. Catches issues autocorrect misses. | `{filename}-corrected.{ext}` |

### `review` workflow

```
- [ ] Step 0: Skip first-time setup (review is read-only, no preference file required)
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Run: bun ${SKILL_DIR}/scripts/main.ts review <input>
- [ ] Step 3: Read references/rules/copywriting-guidelines.md for the full rule set
- [ ] Step 4: AI review — review the original content against the guidelines, combine with autocorrect lint findings
- [ ] Step 5: Format report using references/review-report-template.md; save to {filename}-review.md unless the user or calling skill requests an inline report
- [ ] Step 6: Report results to user
```

### `quick` workflow

```
- [ ] Step 0: Load EXTEND.json or legacy EXTEND.md, or run first-time setup
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Run: bun ${SKILL_DIR}/scripts/main.ts quick <input>
- [ ] Step 3: Report output file path to user
```

### `stable` workflow

```
- [ ] Step 0: Load EXTEND.json or legacy EXTEND.md, or run first-time setup
- [ ] Step 1: Detect autocorrect and auto-install if missing
- [ ] Step 2: Run: bun ${SKILL_DIR}/scripts/main.ts stable <input>
- [ ] Step 3: Read the output file ({filename}-corrected.{ext})
- [ ] Step 4: Assess content length — estimate word count of the corrected file
      If word count < chunk_threshold (default 4000): proceed to Step 5 (single-pass)
      If word count >= chunk_threshold: proceed to Step 4.1 (chunked processing)
- [ ] Step 4.1 (chunked only): Split the corrected file into chunks:
      Run: bun ${SKILL_DIR}/scripts/chunk.ts "{corrected-file}" --max-words 5000 --output-dir "{corrected-file-dir}"
      This outputs chunk-01.md, chunk-02.md, ... in a chunks/ subdirectory.
      Note the absolute path of the chunks/ directory for use in Step 6.
- [ ] Step 5: Read references/rules/copywriting-guidelines.md for the full rule set
- [ ] Step 6: AI post-processing — review the corrected content against the guidelines and fix remaining issues that autocorrect missed, including:
  - Half-width punctuation (. , : ;) after English words in Chinese context → convert to full-width（。，：；）
  - Half-width parentheses () in Chinese context → convert to full-width（）
  - Repeated punctuation (！！、？？) → deduplicate
  - Full-width punctuation followed by extra space → remove space
  - Other violations listed in the guidelines
  **Single-pass** (word count < chunk_threshold): Read entire file, apply all fixes, save corrected content to the same output file.
  **Chunked** (word count >= chunk_threshold): Use subagents in parallel via [references/subagent-prompt-template.md](references/subagent-prompt-template.md).
    - Spawn one subagent **per chunk**, all in parallel
    - Each subagent spawn prompt MUST use **absolute paths** for all file references
    - Replace `{SKILL_DIR}`, `{chunks_dir}`, `{NN}` placeholders in the template with actual absolute paths before spawning
    - Each subagent reads the rules file, reads its assigned chunk, applies fixes, saves to `chunk-{NN}-corrected.md`
    - If Task tool is unavailable, process chunks sequentially inline
    After all chunks are processed, merge:
    Read all `chunk-*-corrected.md` files from the chunks/ directory in sorted order, concatenate with \n\n, write to {corrected-file}. If chunks/frontmatter.md exists, prepend it.
- [ ] Step 7: Report output file path to user
```

## Preferences (JSON-first)

Search order:

```bash
test -f .daftAI-skills/daftai-chinese-copywriting/EXTEND.json && echo "project JSON"
test -f .daftAI-skills/daftai-chinese-copywriting/EXTEND.md && echo "project"
test -f "$HOME/.daftAI-skills/daftai-chinese-copywriting/EXTEND.json" && echo "user JSON"
test -f "$HOME/.daftAI-skills/daftai-chinese-copywriting/EXTEND.md" && echo "user"
```

Priority: explicit input > project EXTEND.json > project EXTEND.md > user EXTEND.json > user EXTEND.md > built-in defaults.

Read the first existing file only; do not merge formats or scopes. New settings created by `init` are pretty-printed JSON. Keep existing Markdown files readable and unchanged; reading does not migrate or create configuration. Invalid JSON or invalid fields are errors, not reasons to silently fall back to Markdown. See [preferences-schema.md](references/config/preferences-schema.md) for the schema.

### First-time setup (BLOCKING)

When none of the four preference paths exists, the agent **MUST** complete first-time setup before `quick` or `stable` workflows.

**Exception**: `review` mode (inferred from user intent) skips this setup entirely — it is read-only.

1. Ask the user (in one message) their preferences:
   - Default mode: `stable` / `quick` (default: `stable`)
   - Save location: `project` (.daftAI-skills/...) or `user` (~/.daftAI-skills/...) (default: `project`)
2. Write EXTEND.json via the script: `bun ${SKILL_DIR}/scripts/main.ts init --mode <mode> --scope <user|project>`
3. Confirm to the user: "Preferences saved to [path]"
4. Continue with the requested workflow

Do not auto-fill defaults before asking. Do not silently create user-level or project-level configuration.

After the setup questions have been asked, the user may answer with "use your recommended settings", "use defaults", or equivalent. In that case, apply the recommended/default answers, save EXTEND.json, confirm the saved path, and continue. The full setup flow is in [first-time-setup.md](references/config/first-time-setup.md).

## Dependencies

### autocorrect

The skill requires `autocorrect` for the core copywriting engine.

When `autocorrect` is missing, the script will:
1. Try `brew install autocorrect`
2. Fall back to `cargo install autocorrect`
3. Continue the current command if installation succeeds

### Node modules (chunking)

`scripts/chunk.ts` depends on `markdown-it`. The `scripts/` directory contains `package.json` and `bun.lock`. Before running `chunk.ts`, the agent **MUST** check if `${SKILL_DIR}/scripts/node_modules` exists. If not, run:

```bash
cd "${SKILL_DIR}/scripts" && bun install
```

## Usage

```bash
bun ${SKILL_DIR}/scripts/main.ts review "你好world"
bun ${SKILL_DIR}/scripts/main.ts stable "/path/to/file.md"
bun ${SKILL_DIR}/scripts/main.ts stable "/path/to/a.md" "/path/to/b.md" "/path/to/c.txt"
bun ${SKILL_DIR}/scripts/main.ts quick "/path/to/file.txt"
```

## Extension Support

Custom configurations use EXTEND.json by default, with legacy EXTEND.md read compatibility. See **Preferences** for lookup order and the config references.

## Combining with Writing Skills

`daftai-chinese-technical-writing` settles document structure, meaning, and wording before delegating formatting here. Keep this pass limited to punctuation, spacing, and character-width rules; do not change facts or rewrite the settled copy.

Use explicit `review` for a check-only handoff. The CLI accepts it without a preference file, prints findings to stdout, and does not write a corrected file or a report. The agent writes a report only when the caller's delivery requirements call for one. `stable` and `quick` still require the documented preference setup.

The CLI resolves project preferences from its working directory, not the input file's directory. Do not invent a `--cwd` flag or silently copy preferences into an installed skill. Report a mismatched preference location before running a fix workflow.

## Maintenance validation

Run from `${SKILL_DIR}`:

```bash
bun ${SKILL_DIR}/scripts/main.test.ts
bun ${SKILL_DIR}/scripts/cli.test.ts
```

The CLI tests replace the external engine inside isolated Bun subprocesses. They cover no-preference review, source preservation, setup refusal for fix modes, configured defaults, explicit mode precedence, JSON initialization, and legacy Markdown compatibility. They do not prove the installed autocorrect binary's behavior.
