---
name: preferences-schema
description: EXTEND.md schema for daftai-chinese-copywriting
---

# Preferences Schema

```yaml
---
version: 1
default_mode: stable
auto_install_autocorrect: true
report_style: brief
language: zh
---
```

## Fields

| Field | Type | Default | Description |
|------|------|---------|-------------|
| `version` | int | `1` | Schema version |
| `default_mode` | string | `stable` | Default mode when CLI mode is omitted |
| `auto_install_autocorrect` | bool | `true` | Whether to auto-install `autocorrect` |
| `report_style` | string | `brief` | `brief` or `detailed` summary output |
| `language` | string | `zh` | Preferred interaction language |
