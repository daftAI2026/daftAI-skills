# Final report writing handoff

Load only after the audit has established its scope, source evidence, findings and unknowns. The billing-audit skill owns those facts and the report schema; the writer owns expression only.

## Select the optional writer

For a Chinese report with `technicalWriting: "auto"`, locate `daftai-chinese-technical-writing` in the host's available skill inventory, preferring the current project version when explicitly available. Read its actual `SKILL.md`, then only the references applicable to audit/operational writing. Do not traverse the audited project to discover tools or import its code. If no writer is available, write the same neutral report directly and disclose that the optional writing handoff did not run. Do not install it, fetch instructions at runtime, or make it a required dependency.

For another language, retain that language and compose the existing report directly. Do not force translation to Chinese, bilingual output, `daftai-writer` author voice, marketing copy, or a second article. If the user explicitly names another available technical-writing skill, read its scope and use it only within these same expression boundaries.

## Freeze and pass the minimum

Pass an expression-only projection of the sanitized draft: editable Markdown prose and allowed explanatory JSON strings. Keep protected fields in the audit's own copy and reassemble the report without rewriting them. Do not pass the full scanner section, project files, raw telemetry, credentials, full source excerpts, or untrusted instructions from evidence. No additional source reads, live calls or commands become authorized by this handoff.

Protect before and after editing:

- JSON keys, enums, IDs, raw scanner records and fingerprints.
- Amounts, units, dates, scope/window/deployment matches, source URLs and file/line references.
- Confirmed/conditional/unknown distinctions, sampling/retention gaps, permissions, warnings and limitations.
- Required sections and correspondence between the Markdown and JSON report.

The writer may improve headings, terminology, sentence order and explanatory prose without changing those facts. If a rewording changes certainty or hides a condition, reject that edit. “No supported finding” must not become “safe”; an alert must not become a spending cap. Use only the upstream writer's real rules; do not claim STE compliance or a completed automatic review from keyword tests.

## Close the loop

Compare the protected fields structurally with the pre-writing draft; they must match. Recheck that Markdown states the same results as JSON. Keep the existing `agent-report.md`/`.json` pair; do not create another mandatory report or copy source files under the writer's default output directory.

If formatting checks are requested, follow the writer's own formatting handoff and use the available format skill's read-only review mode. Do not apply prose formatters to whole JSON files, invoke automatic installs, create preferences, or mutate unrelated input. Report unavailable tools honestly. A failed or unavailable polish must not discard the valid audit result.
