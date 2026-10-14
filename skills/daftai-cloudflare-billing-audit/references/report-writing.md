# Required final report writing

The audit owns evidence, conclusions and [report-schema.md](report-schema.md). The writer owns expression only. Complete this stage before calling the paired report final.

## Resolve the writer internally

For Chinese output, resolve `daftai-chinese-technical-writing` through [tool-setup.md](tool-setup.md). Use an existing installation; if missing, obtain the named dependency from our public repository under the host's installation permissions. Do not ask the user for its name/path or require them to mention it in the audit request.

Read its actual `SKILL.md` and applicable technical-document references at this final stage, not during source discovery. Do not copy its rules into a second maintained writing guide. For other languages, retain the requested language and apply this audit's report structure and factual checks; do not force Chinese wording or add a bilingual article. Another requested writer can add a review within its actual scope, but cannot replace the required Chinese dependency or change protected facts.

`technicalWriting: "off"` is a legacy preference accepted for compatibility; it cannot disable this required report stage. Missing preferences require no questionnaire. If the required Chinese writer cannot be obtained, retain the draft and evidence, identify the writing blocker and recovery action, and do not claim completed writer review.

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
