---
name: preferences-schema
description: JSON-first preference schema with legacy Markdown compatibility for daftai-chinese-copywriting
---

# Preferences Schema

## EXTEND.json (preferred)

```json
{
  "version": 1,
  "default_mode": "stable",
  "language": "zh",
  "chunk_threshold": 4000,
  "chunk_max_words": 5000
}
```

Use standard JSON, not JSONC: no comments or trailing commas. `init` writes two-space indentation and a final newline. Missing fields use the defaults below. Unknown fields, wrong types, unsupported values, and invalid JSON are errors; do not fall back to another file.

## Fields

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `version` | int | `1` | Only `1` is supported |
| `default_mode` | string | `stable` | `stable`, `quick`, or `review`; used when CLI mode is omitted |
| `language` | string | `zh` | Non-empty interaction language |
| `chunk_threshold` | positive int | `4000` | Word count to trigger chunked AI post-processing in `stable` mode |
| `chunk_max_words` | positive int | `5000` | Max words per chunk when chunking |

## Resolution order

Explicit input > project JSON > project Markdown > user JSON > user Markdown > defaults.

The CLI reads the first existing file without merging. Project scope wins over user scope, even when the project uses legacy Markdown. At the same scope, JSON wins. Reading never creates JSON, removes Markdown, or rewrites configuration.

## EXTEND.md (legacy)

Existing files remain readable with the same keys in YAML frontmatter:

```yaml
---
version: 1
default_mode: stable
language: zh
chunk_threshold: 4000
chunk_max_words: 5000
---
```
