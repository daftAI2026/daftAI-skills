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
---
```

## Fields

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `version` | int | `1` | Schema version |
| `default_mode` | string | `stable` | Default mode when CLI mode is omitted |
| `report_style` | string | `brief` | `brief` or `detailed` summary output (only relevant in `review` mode) |
| `language` | string | `zh` | Preferred interaction language |
