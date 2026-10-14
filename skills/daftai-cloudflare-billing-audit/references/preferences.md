# Optional JSON preferences

Resolve these preferences at audit entry, after identifying the target. Report language needs no setup. A first-use Cloudflare-check card makes the optional account check discoverable; missing settings alone never create a file or block project-only review.

## Location and loading

- Default user location: `$HOME/.daftAI-skills/daftai-cloudflare-billing-audit/EXTEND.json` (`USERPROFILE` on Windows).
- A user may explicitly name another `EXTEND.json` outside the audited target tree. That file overrides the user-level file as a whole; do not merge files or silently fall back after invalid explicit input.
- Do not search the target tree for preferences. Reading configuration cannot bypass the scanner's file-scope restrictions. Do not read legacy `EXTEND.md`; this skill has no legacy preferences to migrate.
- Skip any preference path inside the audited target, including the default user location when auditing a home directory. Do not relocate or copy that file to bypass the boundary.
- Read as non-executable JSON only. Use a bounded reader, at most 4096 UTF-8 bytes, a regular file, and no symlinks/reparse points in the file or its ancestor chain. If the host cannot establish this, skip the file and explain the limitation; never read credentials to establish settings.
- Parse JSON, then validate with `parseAuditPreferences` from `scripts/report-preferences.ts` in a trusted harness. Do not import a project module or evaluate settings as code. The helper is pure; it validates settings, resolves the mode and plans a choice/save. It does not locate/read/write files, discover connections, grant account access, select a language from a prompt, or run a writer.
- Reject the entire file on invalid JSON, size, type, version or unknown keys. Report the rejected preference and use safe defaults unless the user needs that preference to complete the task. Never partially apply an invalid file.

## Fields

| Key | Values / default | Effect |
| --- | --- | --- |
| `schemaVersion` | Required `1` | Settings format, unrelated to report or inventory schema versions. |
| `reportLanguage` | `"auto"` or a BCP 47 locale of at most 64 characters accepted by `Intl.getCanonicalLocales`; default `"auto"` | Explicit output language in the current request wins, then a non-auto setting, current request language, conversation preference, and finally English. Unicode extension tags within that bound are supported; legacy/grandfathered tags rejected by that runtime are invalid. |
| `onlineEvidence` | `"ask"`, `"online"`, or `"offline"`; default `"ask"` | Controls the mode question and whether to enter Cloudflare connection discovery. It stores a workflow preference, not account authorization. Existing language-only settings default to `"ask"`. |
| `technicalWriting` | `"auto"` or `"off"`; default `"auto"` | Legacy compatibility field. Old `off` input normalizes to `auto` without rewriting the saved file. Neither value disables the required final-writing stage or authorizes installation/network access. |

The packaged `references/preferences.example.json` is a template, not an active user configuration. Write a real preference file only when the user explicitly requests saving preferences, outside the audited target; do not overwrite existing settings silently. New preferences use JSON. Keep the shipped template unchanged during an audit.

Apart from the validated `onlineEvidence` mode, settings do not contain tokens, accounts, budgets, commands, arbitrary prompts, writer paths, output paths or authorization flags. Such keys are invalid, not permissions. A setting cannot suppress unknowns, change evidence/status/amounts, authorize installing dependencies, or turn on a persistent listener.

Follow [report-writing.md](report-writing.md) only at final report composition. An explicit current request can override preferences without rewriting the saved file.

## First-use choice card

Use `resolveOnlineEvidenceEntry` with validated settings and any explicit current mode. A current request to check only project files, avoid account access, or avoid network access selects project-only review and skips the card. A current request to include Cloudflare account information selects the connected path and skips the card. Otherwise use the saved `onlineEvidence`; `ask` or an absent field requires the card once per audit. Do not infer a mode from installed tools or from the word “check”.

Use the host's actual interactive question/choice tool, not a custom UI. In Chinese:

**要只检查项目，还是同时查询 Cloudflare 信息？**

检查项目包含代码和配置。查询 Cloudflare 信息会通过 MCP 连接，补充实际用量和运行情况；首次连接或登录失效时，可能需要你登录并授权。不会修改项目或 Cloudflare 设置。

| Option | Internal choice | This audit | Save |
| --- | --- | --- | --- |
| 本次只检查项目 | `project-once` | Project only | None |
| 本次检查项目并查询 Cloudflare | `online-once` | Project and scoped Cloudflare evidence | None |
| 以后都只检查项目 | `project-always` | Project only | `onlineEvidence: "offline"` |
| 以后都检查项目并查询 Cloudflare | `online-always` | Project and scoped Cloudflare evidence | `onlineEvidence: "online"` |

Localize the same meaning for other languages. English: “Check the project only, or also query Cloudflare?” Explain that MCP can add actual usage and runtime information; first connection or expired authentication may require login and authorization. Options: “Project only for this audit”, “Project and Cloudflare for this audit”, “Project only for future audits”, and “Project and Cloudflare for future audits”. Do not substitute “prefer”, hide MCP/login requirements, or ask four separate questions.

If a tool allows only three choices per question, ask project-only versus project-and-Cloudflare, then current audit versus future audits together in one supported grouped call. Preserve the four combinations; never drop a remembered option or silently remember the default. With no interactive tool, ask the same question in plain text. While awaiting an asynchronous answer, continue only project review. If no answer is available before delivery or the user cancels, finish project-only review, say Cloudflare was not queried, and save nothing. Do not ask the mode question again within that audit.

A connected choice is not proof that a connection is available. Reuse an existing official MCP when available; otherwise follow [tool-setup.md](tool-setup.md). Missing client setup authorization or OAuth stays a separate real requirement. Before account calls, apply [connected-evidence.md](connected-evidence.md), resolve missing account/project/environment, interval and operation scope, and preserve valid prior consent without asking it again. A saved connected choice does not authorize new accounts, broader collections, persistent monitoring or configuration changes. On missing connection or login failure, follow [mcp-setup.md](mcp-setup.md): explain the recovery step, start supported setup after consent, and wait for connection or explicit skip/cancel while preserving the project draft. Do not treat a missing tool or response delay as permission to finalize project-only. Query failures preserve their specific gaps under connected-evidence.md; never silently change tools or permissions.

## Save remembered choices

`applyOnlineEvidenceChoice` returns the current mode and `preferencesToSave`. A null save means no file creation or update. A remembered choice returns validated JSON with only `onlineEvidence` changed; preserve existing language and legacy writing values. Do not save credentials, account identities or authorization in this object.

Save only after the user's explicit remembered choice, to the active external preference file or the default user-level `EXTEND.json` when none exists. Show the resolved absolute destination. Recheck that the file and ancestor chain satisfy the loading rules and lie outside the audited target. For a new file, do not replace a concurrently created file. For an existing file, refuse a changed, invalid or unreadable input instead of replacing it with defaults. Use the host's safe file-write facility; if it cannot establish those conditions, keep the choice for this audit and explain that it was not saved. Do not relocate preferences to bypass a refused path.

Serialize `preferencesToSave` as pretty-printed JSON with a final newline. Read it back through the bounded preference reader, validate it and verify the intended mode and unchanged fields before confirming the saved absolute path in the user's language. A save failure does not block the current audit or permit claiming a remembered choice was saved. Reading preferences never rewrites them. An explicit later request to change or forget the mode can update `onlineEvidence` to `offline`, `online` or `ask` with the same checks.
