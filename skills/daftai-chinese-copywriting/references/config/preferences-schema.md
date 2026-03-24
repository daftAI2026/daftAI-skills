---
name: preferences-schema
description: EXTEND.md schema for daftai-chinese-copywriting
---

# Preferences Schema

```yaml
---
version: 1
default_mode: stable
report_style: brief
language: zh
chunk_threshold: 4000
chunk_max_words: 5000
---
```

## Fields

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `version` | int | `1` | Schema version |
| `default_mode` | string | `stable` | Default mode when CLI mode is omitted |
| `report_style` | string | `brief` | `brief` or `detailed` summary output (only relevant in `review` mode) |
| `language` | string | `zh` | Preferred interaction language |
| `chunk_threshold` | int | `4000` | Word count to trigger chunked AI post-processing in `stable` mode |
| `chunk_max_words` | int | `5000` | Max words per chunk when chunking |
