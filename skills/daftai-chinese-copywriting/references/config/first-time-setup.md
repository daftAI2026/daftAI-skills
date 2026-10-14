---
name: first-time-setup
description: First-time setup flow for daftai-chinese-copywriting preferences
---

# First-Time Setup

Before a fix workflow, look for project EXTEND.json, project EXTEND.md, user EXTEND.json, then user EXTEND.md. If none exists, ask all setup questions together.

This is a blocking step. Do not start `quick` or `stable` first. Do not auto-fill defaults before asking. Do not silently create configuration.

**Exception**: `review` mode inferred from user intent (e.g., "检查", "check") skips this setup entirely — review is read-only and does not require preferences.

## Questions

1. Default mode: `stable` or `quick` (default: `stable`)
2. Save location: `project` or `user` (default: `project`)

## Save Paths

| Scope | Path |
|------|------|
| User | `$HOME/.daftAI-skills/daftai-chinese-copywriting/EXTEND.json` |
| Project | `.daftAI-skills/daftai-chinese-copywriting/EXTEND.json` |

Resolve project scope from the CLI working directory. Before writing, tell the user the resolved absolute destination. New configuration is JSON; existing Markdown remains unchanged.

After the user answers, run from the skill directory:

```bash
bun ${SKILL_DIR}/scripts/main.ts init --mode <stable|quick> --scope <project|user>
```

Confirm the printed JSON path. Do not initialize or migrate preferences during `review`.

## Defaults

- `default_mode: stable`
- `language: zh`

If the user answers "use your recommended settings", "use defaults", or equivalent after the setup questions are asked, treat that as explicit consent to use the recommended/default answers for all setup items, then save EXTEND.json explicitly. The JSON content is documented in `preferences-schema.md`.
