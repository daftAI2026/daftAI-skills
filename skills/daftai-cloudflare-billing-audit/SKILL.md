---
name: daftai-cloudflare-billing-audit
description: >
  Audits a Cloudflare application repository for code paths and configuration that may create
  usage-based billing exposure. Use when asked to inspect Cloudflare Worker, D1, Durable Objects,
  storage, queue, or compute usage for unexpected bills, billing risks, or cost drivers. Reports
  evidence and uncertainty. Runs offline by default; optionally correlates user-authorized, bounded
  evidence from existing official tools. Does not guarantee a spending cap.
---

# Cloudflare Billing Risk Audit

Inspect a user-designated local project for plausible Cloudflare usage-based billing risks and deliver an evidence-linked report. The default mode is read-only, offline, and uses no Cloudflare token or account access.

## Response language

Use the user's explicitly requested output language first, then a valid saved report-language preference; otherwise use the dominant natural language of the current request. If the request has no natural-language clues (for example, only a path or command), use an established conversation language preference; if none exists, default to English. Apply the same rule to Chinese, English, and other languages; do not add a bilingual version unless requested. The language of skill documentation, UI metadata, code, or scanner output does not override the user's language.

Apply the selected language to replies, the human-readable report, and agent-authored explanatory JSON string values. Preserve JSON keys, enums, source/rule IDs, file paths, commands, and raw scanner objects unchanged; do not translate the scanner inventory. See [references/report-schema.md](references/report-schema.md) for the boundary between localized explanations and preserved evidence.

## Ordinary requests and findings

A short request such as “check this project for Cloudflare billing risks” is sufficient. If the runtime supplies one unambiguous current project directory, resolve and state that target once; do not ask the user to paste its path or choose a budget. Never infer the target from this skill’s directory or an unrelated shell cwd. Ask one focused question only when the target is missing/ambiguous or safe execution requires a user decision. Default to offline review; do not interrupt to upsell online access.

Use the chat reply for the short audit conclusion, recommended first actions, material unknowns and links to the report pair. Summarize the priority findings with their conditions and file-and-line evidence; retain every supported finding in the report. The chat reply is not a third report file. Follow the reader-first layout in [references/report-schema.md](references/report-schema.md), not a fixed word-for-word script. Do not show a confirmation dialog for every finding or apply fixes. Use a real question tool only for a blocking ambiguity or additional permission; otherwise use a concise message. If no supported finding exists, say so with the important coverage gaps, not “safe”.

## Report language preferences and required writing

Missing preferences require no setup. If user-level `EXTEND.json` exists or the user names an external preference file, follow [references/preferences.md](references/preferences.md). Preferences cannot choose the target, authorize access, suppress uncertainty or change evidence.

Every completed audit delivers the report pair in [references/report-schema.md](references/report-schema.md) and passes [references/report-writing.md](references/report-writing.md). For Chinese output, internally resolve `daftai-chinese-technical-writing`; if missing, obtain the named skill from our public repository through [references/tool-setup.md](references/tool-setup.md). The user need not supply its path or mention it. Do not preload it: establish and freeze facts first, then review expression without changing conclusions. Installing the dependency is not completing the writing stage: read and apply it in this same audit, without waiting for a new turn. If the host cannot do that, keep the draft and report the delivery blocker; do not call the audit delivery complete. Keep successful writing/dependency setup internal; the final reply presents audit results and report links, not installation or next-turn availability messages. Explain dependency setup only if it blocks delivery or the user asks.

## Boundaries

- Require a user-designated target, including an unambiguous runtime current project requested as “this project”. By default, keep generated reports and indexes in this skill's `audit-results/`; when the skill is installed inside the target, the helper chooses an external temporary workspace, or user-home workspace if needed, instead and reports that location. If the user chooses another output directory, use it only when it is outside the target tree and tell them where it will be written. This version does not modify the target tree; if the requested output is inside it, explain the conflict and ask for a separate output location.
- Do not run target code, build steps, package scripts, tests, hooks, migrations, `.env` files, or other project commands. Do not read credential or secret-value files, extract tokens, sign in, or change account/project configuration. The default source-review mode never calls account APIs. Named dependency setup is separate and follows tool-setup.md and host permissions. Only the explicitly authorized optional mode below may use an existing connection for its verified, bounded evidence operations; it never expands access.
- Inspect only configuration and files relevant to the designated project. Use [references/progressive-review.md](references/progressive-review.md): first index directory metadata and parsed ancestor configs, then read necessary source/auxiliary files through the platform-selected indexed range reader. Metadata is not reviewed content. Do not reopen target files with `cat`, editors, raw filesystem tools or imports. The helper revalidates current path/type/config authorization and metadata for every read. Secret paths, excluded dependency/generated trees, links and nonregular files remain forbidden. A changed file invalidates its earlier chunks; report the gap and re-index rather than combining versions.
- The default is progressive evidence review, not a bulk whole-repository scan. Per-operation caps limit resource use, not the cumulative audit scope. Continue relevant directories/files/ranges within the designated project until the chargeable paths and guards are established or explicit gaps remain. Do not repeatedly read unchanged chunks or exhaustively traverse unrelated tools/examples. Runtime/tool/context limits may stop the task; save coverage and next steps rather than claiming completion. The legacy bounded quick scanner remains optional under [references/scanner.md](references/scanner.md); its byte cap is not a gate for the progressive reader. If secure access or stable-tree conditions fail, stop instead of bypassing the boundary.
- A configured Cloudflare binding or ordinary billable operation by itself is not a billing-risk finding. Trace a plausible trigger to a source-confirmed amplification, duration, retention, or abuse mechanism; inspect its guards before reporting exposure.
- Report confirmed, conditional, and unknown conclusions separately. “No findings” means no supported issue was found in the reviewed scope, not that the application is safe or the account cannot incur a large bill. Do not promise a bill cap or prevention of overages.

## Optional online evidence

Remain offline unless the user explicitly requests or consents to a particular account/project/environment and bounded interval. An installed CLI/MCP or available Write permission is not authorization. Discover existing official tools first. If none is usable, follow [references/tool-setup.md](references/tool-setup.md) for separately authorized official connection setup. Then load [references/connected-evidence.md](references/connected-evidence.md): it governs tool discovery, scoped existing connections, budgets, side effects, failure gaps, privacy, and optional report fields. Preserve the offline result if online evidence is unavailable. Do not create subscriptions/Webhooks, enable Issues/logging, run target code/SQL, or make billable business requests. Existing user-authorized events may be reviewed as evidence; do not start a listener.

## Audit flow

Use [references/workflow.md](references/workflow.md) for the detailed, bounded review method and [references/report-schema.md](references/report-schema.md) for the required report structure.

1. Resolve the designated target and report the output location. Run `--index` for the project root, then only relevant directories. Indexes list metadata and normalized configuration; they do not pre-read source bodies or establish deployment state. Package/framework entry points not resolved locally remain explicit unknowns, not broken deployments.
2. Follow [references/progressive-review.md](references/progressive-review.md) to select entry/configuration/route directories, then use `--index --inventory ... --read-file ...` for needed files and bounded ranges. Follow imports/dispatch and inspect guards only through this reader. Keep directory indexes, successful range receipts and reviewed conclusions distinct. The target and output ancestry must remain stable; portable macOS/Windows checks are not a hostile-concurrency sandbox.
3. Load only product references relevant to observed usage. Read the matching product guide(s), which contain the relevant evidence links; use [references/sources.json](references/sources.json) for maintenance or when tracing a source ID. Do not load every product guide or the full source index by default. If a relevant guide is missing or evidence is stale/unclear, classify the point as unknown and say what must be verified.
4. Explain exposure through the mechanism: billable operation and unit × invocation volume or fan-out × duration, retention, or other applicable multiplier. Identify the triggering condition, relevant path and line numbers, expected consequence, and a practical mitigation. A binding or configuration declaration alone is not proof that it is exercised.
5. Separate confirmed exposure from conditional scenarios and unknowns. State audited paths, exclusions, unresolved paths, and limitations. Keep script candidates distinct from agent-verified findings. For every completed audit, produce the paired human-readable `agent-report.md` and machine-readable `agent-report.json`. Generate Markdown using the reader-first layout and [ID-first finding labels and status-note pattern](references/report-schema.md); do not leave these as manual post-delivery fixes. Use report schema 3 for progressive evidence, while old quick-scan reports remain valid.
6. Complete the required writing stage in [references/report-writing.md](references/report-writing.md). Discover or obtain the Chinese dependency internally; compare protected fields with the frozen draft. Preserve results and report a delivery blocker if the required stage cannot run.
7. Do not estimate dollars by default. If the user requests an estimate, retrieve current official Cloudflare pricing for only the relevant product and clearly state the retrieval date, currency, plan, billing period, usage assumptions, and uncertainties. Pricing and quotas change; local cached knowledge is not current pricing evidence.
8. Present budget alerts as notifications unless current official evidence explicitly documents a stronger behavior. Recommend hard limits only when the current product supports them and the specific limit applies; do not imply a budget or alert is a global spend stop.

## Script Directory

The helper is in this skill's `scripts/` directory. Resolve the absolute path of this `SKILL.md` as `SKILL_DIR` and set the command working directory to `${SKILL_DIR}`. Before running it, detect Bun once per session with `command -v bun` in a POSIX shell or `Get-Command bun` in PowerShell. If Bun is unavailable or the platform cannot meet the scanner's documented filesystem contract, stop the project-source audit and report the blocker; do not fall back to opening the raw project path.

Linux uses descriptor-anchored access; macOS/Windows use a weaker portable stable-tree adapter with identity checks. Neither is an atomic snapshot. Read the platform boundary in [references/scanner.md](references/scanner.md) before scanning; stop if a stable tree cannot be established. No raw-path manual-read fallback is allowed.

Start the metadata-only root index with the resolved user target:

```bash
bun ${SKILL_DIR}/scripts/audit.ts --index --project "/absolute/path/to/project"
```

The summary names the output directory. The default is `${SKILL_DIR}/audit-results/`, or an external temporary/user-home workspace when the installed skill lies inside the target. Do not ask the user to configure the safe default. An explicit `--output-dir` must remain outside the target. Keep the paired agent reports in the root run directory; subsequent directory indexes are evidence for the same audit, not new audits.

Then index a relevant directory with `--directory "src/server"`. Read a necessary exact file using that directory's returned inventory path:

```bash
bun ${SKILL_DIR}/scripts/audit.ts --index --project "/absolute/path/to/project" --inventory "/external/run/inventory.json" --read-file "src/server/worker.ts"
```

The result is local JSON content plus range metadata. Continue with returned `nextOffset` and bounded `--length` when needed. Do not save source/Base64 in reports or hand it to the writer. Store receipt metadata without content, and follow [references/progressive-review.md](references/progressive-review.md) for UTF-8, line references, freshness, authorization and stopping. Missing/truncated evidence stays unknown. The older CLI without `--index` remains a bounded quick-scan option under [references/scanner.md](references/scanner.md), not the default or a gate for subsequent content reads.

## Product references

Use only guides that match the code path under review:

- [Workers and request triggers](references/workers.md)
- [D1](references/d1.md)
- [Durable Objects](references/durable-objects.md)
- [Storage services](references/storage.md)
- [Queues and fan-out](references/queues.md)
- [Compute and AI](references/compute-ai.md)
- [Operations, limits, and guardrails](references/operations.md)

These references are maintained evidence notes, not account-specific conclusions. An audit of a project and maintenance of the product evidence are separate tasks; see [references/maintenance.md](references/maintenance.md).
