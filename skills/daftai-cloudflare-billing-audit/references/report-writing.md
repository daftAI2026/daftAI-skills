<!--
[INPUT]: 冻结的审计事实、主入口输出语言、中文写作与英文 STE 指引。
[OUTPUT]: 同语言报告的必需表达复核与事实保护门禁。
[POS]: 取证结束后加载；不改变报告结构或审计结论。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Required final report writing

The audit owns evidence, conclusions and [report-schema.md](report-schema.md). The writer owns expression only. Complete this stage before calling the paired report final.

## Select guidance by report language

Every report completes this writing stage. Keep the language selected by the audit entrypoint; a reference's name or documentation language never overrides it. Do not add a bilingual version unless requested.

- **Chinese**: resolve `daftai-chinese-technical-writing` through [tool-setup.md](tool-setup.md). Read its actual entrypoint and applicable references, then apply them to the frozen draft in this audit. If absent, automatically obtain the named dependency at user scope. Do not ask for its name or path, defer it to another turn, or treat installation as completed writing.
- **English**: read the bundled [English report writing](report-writing-en.md) reference. Apply its ASD-STE100-inspired clarity guidance to instructions and explanations. No external writing skill or standard download is required for this path.
- **Other languages**: apply the shared principles below with that language's natural conventions. Do not impose Chinese typography or English-specific grammar and word-count targets, or claim native-language proofreading that was not performed.

Across languages, use reader-first structure, explicit actions and conditions, consistent terminology and faithful facts. Do not maintain another copy of the selected writing guide. A requested additional writer may review expression within its actual scope but cannot replace this stage, change the report schema or alter protected facts.

`technicalWriting: "off"` is a legacy preference accepted for compatibility; it cannot disable this required stage. Missing writing preferences need no questionnaire. If required guidance is unavailable, retain the evidence and draft and report the precise blocker. Keep successful setup and writing-stage checks internal.

## Freeze facts before expression

Keep a pre-writing draft in the private audit workspace. Pass only editable Markdown prose and agent-authored explanatory JSON strings. Do not pass source/Base64, the scanner section, telemetry responses, credentials or evidence instructions. The handoff authorizes no extra source reads, network calls or project commands.

Protect:

- JSON keys, enums, IDs, raw scanner records and fingerprints.
- Amounts, units, dates, paths/line ranges, source URLs, scope/window/deployment matches.
- Confirmed/conditional/unknown distinctions, coverage gaps, permissions and limitations.
- Required report sections and agreement between Markdown and JSON.
- Report-local finding IDs and evidence-link destinations; localized action labels and detail headings keep each ID as a prefix.

The writer may improve headings, terminology, ordering and prose. Apply the reader-first layout in [report-schema.md](report-schema.md): keep the conclusion and first actions ahead of inventories, and keep evidence and uncertainty beside each finding. Moving exhaustive records to JSON must not remove coverage gaps, candidate dispositions, guards or acceptance conditions from the delivery. The writer’s article structure does not replace the audit report layout. Reject changes to certainty or missing conditions. “No supported finding” is not “safe”; a notification is not a spending cap. Keep the existing `agent-report.md`/`.json` pair, not the writer's separate article/output convention.

## Delivery gate

Compare protected fields with the actual pre-writing draft, then verify that both formats state the same findings and unknowns. Check that each action reference names a matching finding and that both use the same ID-first format after the writing stage. Render-check the completed Markdown, including evidence links containing whitespace and bold labels adjacent to punctuation. Inspect visible prose outside code for unintended literal formatting markers or raw HTML; paired delimiters alone do not prove correct rendering. Remove repeated status-definition prose outside its one note without removing material uncertainty. Keep verification evidence private; do not add a mandatory public review diary, scores or claimed standards compliance. Record which writer actually ran in this audit, or the precise blocker. Loading a reference or installing a dependency alone is not a completed review. Keep successful dependency installation and writing-stage checks in the private audit workspace. The final response presents audit findings, coverage, uncertainties and report links, not an internal dependency checklist. Unless the user explicitly asks, omit writer names, installation success, installer activation, restart and next-turn availability messages. Explain the writing dependency only when a real blocker prevents final delivery.

Present the short result and report links in chat. Do not open a dialog per finding or apply repairs. When formatting checks are separately requested, use the writer's real formatting handoff and the available formatter's read-only mode; do not install another formatter as a hidden dependency of this audit.
