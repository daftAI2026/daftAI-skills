# Audit report schema

Every completed audit produces a paired human-readable and machine-readable report in the run's audit workspace:

- `agent-report.md`: concise findings, coverage, and next steps.
- `agent-report.json`: the same scope and agent-reviewed conclusions in the schema below, plus any actual scanner candidates preserved as raw JSON.

The helper's own `inventory.json` and `inventory.md` remain separate. Never turn scanner candidates into agent conclusions without checking them against allowed source/config evidence. Keep the files together under this skill's default `audit-results/` workspace or a user-requested output location outside the target tree.

## Report language

Follow the response-language rule in `SKILL.md`. Localize Markdown headings, summaries, findings, dispositions' explanations, and follow-up prose, plus agent-authored explanatory JSON values such as `riskStatement`, `triggerAndCondition`, `scalingOrDuration`, `consequence`, `recommendation`, `uncertainty`, `scope.limitations`, and top-level `unknowns`. Technical names and exact evidence identifiers may remain in their original form within that prose.

Keep JSON keys and machine-valued fields unchanged, including enum/sentinel values such as `confirmed`, `conditional`, `unknown`, `unresolved`, `not established`, and `offline-read-only`, evidence roles such as `trigger`, and product names and source types. Preserve IDs, paths, commands, URLs, fingerprints, and copied scanner metadata exactly, including English prose inside `scanner.unknowns` and `scanner.candidates[].raw`. Do not translate or rewrite `inventory.json` or `inventory.md`. In Markdown, label preserved raw candidate fields separately from any localized explanation; a translated paraphrase never replaces the raw record. No language metadata field or schema change is required.

Required final-writing review follows [report-writing.md](report-writing.md) after evidence and conclusions are frozen. Only explanatory strings and Markdown expression may change; compare protected JSON fields and cross-format conclusions before delivery. Preferences are output choices, never evidence or authorization.

## Markdown report sections

The section labels below describe required content, not fixed English headings; render headings and human-readable status labels in the selected language while preserving JSON status tokens.

1. **Scope and result**: audit date, safely shortened project label, output path, actual offline or offline-plus-connected-evidence mode and its limitations, and a summary of confirmed / conditional / unknown results.
2. **Coverage and limits**: workspaces, configuration files and configured environments found; entry points and triggers actually reviewed; narrow auxiliary files reviewed; skipped or unresolved paths, language/framework constraints, actual `runtimePlatform` and `secureReadMode`, stable-tree assumptions, and limits. Configuration does not prove what is currently deployed.
3. **Scanner candidates**: each raw candidate with a report-local reference, rule/product, path and line, condition, possible consequence, recommendation, and source references. Show disposition separately (traced to finding, not substantiated, duplicate, or unresolved). Preserve the raw fields and do not describe candidates as findings.
4. **Agent-reviewed findings**: findings with report-local IDs and a count by `confirmed`, `conditional`, and `unknown`. Do not elevate ordinary request handling or a binding declaration into a finding without a concrete source-supported amplification, duration, retention, or abuse mechanism and review of relevant guards.
5. **Unknowns and follow-up**: missing evidence, why it matters, and the next low-risk verification step. In default offline mode, account checks remain unperformed. Optional authorized connected evidence must report its distinct scope, side effects, and gaps.
6. **Sources and estimate assumptions**: direct source links and source IDs, including a product-guide/rule ID or public case ID when present. Include pricing sources and full assumptions only when the user requested an estimate.

## Agent finding fields

| Field | Required meaning |
|---|---|
| `findingId` | Unique within this report, such as `F-01`; not a universal product rule. |
| `candidateRefs` | Report-local references to scanner leads checked for this finding, or an empty array. |
| `ruleId` | Use a matching stable `CF-*` rule ID from the product guide; otherwise `unknown`. Keep the scanner's distinct `CFBA-*` candidate rule ID only in its raw candidate record. Never invent a product rule. |
| `product` | Relevant Cloudflare product/service, or `unknown`. |
| `status` | `confirmed`, `conditional`, or `unknown` per `workflow.md`. |
| `riskStatement` | Specific possible cost mechanism, phrased as exposure potential rather than a guaranteed bill. |
| `evidence` | Config/source path plus line range or key, with role such as trigger, call site, guard, or config. Summarize; do not copy source. |
| `triggerAndCondition` | What executes the path, when it runs, and any traffic/config assumption. |
| `billableOperationAndUnit` | Documented operation and unit plus source IDs, or `unknown`. Separate operation evidence from unknown rate, allowance, and volume. |
| `scalingOrDuration` | Relevant frequency, fan-out, retries, concurrency, runtime, retention, amplifier, and existing controls with their scope/persistence. For bounded recurring work, include whether root-task attempts/work/deadline and progress survive rescheduling when established; otherwise say `unknown` or `not established`. |
| `consequence` | Plausible billing impact and how the mechanism scales; no invented dollars, likelihood scores, or loss claims. |
| `recommendation` | Evidence-linked review or mitigation suggestion. May include an observable acceptance check for the owner to run later, clearly labeled as proposed and not executed. The skill does not apply changes or run target tests/runtime validation. |
| `sourceIds` | References to `sources` records using the source registry's exact ID. Preserve public `caseId`, `guideId`, and official `sourceId` values. Use an empty array if no source is established and explain the gap. |
| `uncertainty` | Key caveat, unverified production condition, or trace stopping point. |

## JSON shape

### Default progressive report (schema 3)

Reuse the finding fields, sources, conclusion boundaries and Markdown sections above. Schema `3` uses `scanner.mode = "on-demand"`, not a fabricated quick-scan inventory. Its `indexes` reference actual index files with schema version, file SHA-256, directory, adapter and truncation. Its `reads` preserve successful receipt metadata exactly, without `text` or `contentBase64`. Preserve actual candidateScan findings as raw candidates only when produced. Evidence references the applicable index and read receipt. scope.reviewedPaths contains only content examined; scope.unreadRanges and scope.unvisitedDirectories name concrete remaining work. Indexed is not reviewed; read is not automatically traced.

```json
{
  "schemaVersion": 3,
  "audit": {"targetLabel": "", "auditDate": "YYYY-MM-DD", "outputDirectory": "", "mode": "offline-read-only"},
  "scope": {"workspaceRoots": [], "configurationFiles": [], "reviewedPaths": [], "skippedPaths": [], "unreadRanges": [], "unvisitedDirectories": [], "limitations": []},
  "scanner": {"mode": "on-demand", "indexes": [], "reads": [], "candidates": []},
  "agentFindings": [], "unknowns": [], "sources": [], "estimate": null
}
```

Keep one report pair. An authorized connectedEvidence block may be appended under the existing independent connected contract; schema selection grants no access. Legacy quick-scan schemas 1/2 remain valid. Do not relabel an old report as progressive without acquiring its evidence.

### Compatibility and source records

Legacy quick-scan schemas 1/2 remain supported under [legacy-report-schema.md](legacy-report-schema.md); they are not the default acquisition workflow.

Each `sources` record keeps sourceId, title, public URL, sourceType, verifiedDate and applicable caseId/guideId. Official pages use the registry's source ID; public cases/guides use their stable content ID. A guide citing Cloudflare is still a guide, not an official Cloudflare source. Estimates stay null unless requested; then include current price sources, currency/period/plan, usage assumptions and unknown terms.

## Optional connected extension and compatibility

Old reports remain `schemaVersion: 1` with `audit.mode: "offline-read-only"` and no `connectedEvidence`. Do not relabel them, translate raw scanner evidence, or require new fields. The legacy quick-scan inventory schema and CLI remain supported.

If bounded online collection is authorized, including when every planned call is blocked, keep `schemaVersion: 3` for an on-demand report; legacy quick-scan reports use `schemaVersion: 2`. Set `audit.mode: "offline-plus-connected-evidence"`, preserving all existing fields and adding `connectedEvidence`. Consumers supporting only version 1 must reject or explicitly ignore an unsupported version rather than treat online data as offline. An empty or failed online pass never invalidates the offline conclusions or hides unknowns.

`connectedEvidence` is a separate section in the existing report, not a third output file. Its minimal machine structure is defined by `ConnectedEvidence` and `Observation` in `scripts/connected-contract.ts`: version/mode, overall observed/partial/unknown status, request count, approved budget, per-operation observations, and gaps. The helper only checks its narrow envelope, not the full report or provenance. It does not establish authorization from a boolean or authenticate the source.

`Observation.source` is `connector`, `isolated-cli`, or `unknown`. Use `unknown` when no actual channel is established (including missing capability/tool); never infer `connector` from a missing value. Known channels remain unchanged even if their operation is refused. This enum extension corrects provenance in connected report schema version 2; offline version 1 is unaffected. Consumers must accept `unknown` rather than coerce it to a known channel.

One operation/scope observation represents its bounded page aggregate, not just the latest successful page. Its counts include all attempts and received rows; incomplete cursors, failures and exceeded limits remain coverage gaps. The extension builder cross-checks the aggregate requests/pages/rows across observations against its approved budget; an over-budget collection cannot be reported as `observed` without a gap. The reserved gap reference `collection-budget` identifies a collection-level budget overrun, not an observation; it uses reason `budget-exhausted`. Invalid or unsafe-integer accounting is rejected instead of serialized. If no observation is complete, overall status may remain `unknown`; describe attempted-but-incomplete pagination coverage as partial, never as no attempt or complete coverage.

For each observation, preserve enum values, evidence IDs and numeric metrics unchanged. Document approved resource/environment labels, operation, source/schema reference, observation time, requested window, deployment correlation, actual request/page/row counts, status/reason, and data-delay/sampling/retention gaps. Use unknown when a fact is not established. Never invent a local-to-production version match. The Agent may add a sanitized natural-language explanation beside the structured summary, following the response-language policy; never persist raw response/log text or credentials. Record a per-category unavailable reason even when no network request ran.

In Markdown, include a distinct online-evidence subsection under coverage, mapping observations to agent finding IDs and the documented billable operation/unit where warranted. Add optional `runtimeEvidenceRefs` (CE-* IDs) to agent findings only in connected versions 2/3; do not replace source/config evidence or scanner candidates. Signals not linked to a billing mechanism belong under observations or unknowns, not confirmed billing findings. Configuration, invocation, metered usage, rated cost and invoice are different evidence levels.

User-authorized already-received events may be described in a sanitized `receivedEvents` array within `connectedEvidence`, with report-local event reference, safe resource label, occurrence/receipt time, known delivery identity or `unknown`, duplicate/provenance state, and billing-path references. No raw payload, callback URL, signature/key, or original account ID is required. Do not claim verified signatures unless the client actually verified them. Reuse a known delivery identity to recognize duplicates, never to authorize queries or subscriptions. An event-only review uses report version 3 for on-demand evidence or version 2 for legacy quick-scan evidence and marks online requests zero. Its coverage is received events only, not complete history.

For an event-only review, author the extension directly with `requests: 0`, zero request/page/row/time budget, empty `observations`, and `receivedEvents` plus its unknowns; do not fabricate an account-call observation to satisfy the helper. `buildConnectedEvidence` intentionally requires at least one planned operation and is not used for event-only input. Set status from actually established event coverage, not a presumed complete issue history. The envelope checker is not a validator of event provenance.
