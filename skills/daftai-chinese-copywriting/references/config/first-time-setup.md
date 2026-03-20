---
name: first-time-setup
description: First-time setup flow for daftai-chinese-copywriting preferences
---

# First-Time Setup

When no EXTEND.md is found, ask all setup questions before running copywriting checks.

This is a blocking step. Do not start `review`, `quick`, or `stable` first. Do not auto-fill defaults before asking. Do not silently create `EXTEND.md`.

## Questions

1. Default mode: `stable`, `quick`, or `review`
2. Report style: `brief` or `detailed` — **only ask when default mode is `review`**
3. Save location: `user` or `project`

## Save Paths

| Scope | Path |
|------|------|
| User | `~/.daftAI-skills/daftai-chinese-copywriting/EXTEND.md` |
| Project | `.daftAI-skills/daftai-chinese-copywriting/EXTEND.md` |

## Defaults

- `default_mode: stable`
- `report_style: brief`
- `language: zh`

If the user answers "use your recommended settings", "use defaults", or equivalent after the setup questions are asked, treat that as explicit consent to use the recommended/default answers for all setup items, then save them explicitly.
