# Optional JSON preferences

Read only when a settings file exists or the user asks to customize report output. Missing settings require no questionnaire and create no files.

## Location and loading

- Default user location: `$HOME/.daftAI-skills/daftai-cloudflare-billing-audit/EXTEND.json` (`USERPROFILE` on Windows).
- A user may explicitly name another `EXTEND.json` outside the audited target tree. That file overrides the user-level file as a whole; do not merge files or silently fall back after invalid explicit input.
- Do not search the target tree for preferences. Reading configuration cannot bypass the scanner's file-scope restrictions. Do not read legacy `EXTEND.md`; this skill has no legacy preferences to migrate.
- Skip any preference path inside the audited target, including the default user location when auditing a home directory. Do not relocate or copy that file to bypass the boundary.
- Read as non-executable JSON only. Use a bounded reader, at most 4096 UTF-8 bytes, a regular file, and no symlinks/reparse points in the file or its ancestor chain. If the host cannot establish this, skip the file and explain the limitation; never read credentials to establish settings.
- Parse JSON, then validate with `parseAuditPreferences` from `scripts/report-preferences.ts` in a trusted harness. Do not import a project module or evaluate settings as code. The helper is pure; it does not locate/read files, discover skills, select a language from a prompt, or run a writer.
- Reject the entire file on invalid JSON, size, type, version or unknown keys. Report the rejected preference and use safe defaults unless the user needs that preference to complete the task. Never partially apply an invalid file.

## Fields

| Key | Values / default | Effect |
| --- | --- | --- |
| `schemaVersion` | Required `1` | Settings format, unrelated to report or inventory schema versions. |
| `reportLanguage` | `"auto"` or a BCP 47 locale of at most 64 characters accepted by `Intl.getCanonicalLocales`; default `"auto"` | Explicit output language in the current request wins, then a non-auto setting, current request language, conversation preference, and finally English. Unicode extension tags within that bound are supported; legacy/grandfathered tags rejected by that runtime are invalid. |
| `technicalWriting` | `"auto"` or `"off"`; default `"auto"` | Legacy compatibility field. Old `off` input normalizes to `auto` without rewriting the saved file. Neither value disables the required final-writing stage or authorizes installation/network access. |

The packaged `references/preferences.example.json` is a template, not an active user configuration. Write a real preference file only when the user explicitly requests saving preferences, outside the audited target; do not overwrite existing settings silently. New preferences use JSON. Keep the shipped template unchanged during an audit.

Settings do not contain tokens, accounts, budgets, commands, arbitrary prompts, writer paths, output paths or network flags. Such keys are invalid, not permissions. A setting cannot suppress unknowns, change evidence/status/amounts, authorize installing dependencies, or turn on a persistent listener.

Follow [report-writing.md](report-writing.md) only at final report composition. An explicit current request can override output preferences without rewriting the saved file.
