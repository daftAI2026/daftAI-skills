# Audit report schema

Every completed audit produces a paired human-readable and machine-readable report in the run's audit workspace:

- `agent-report.md`: concise findings, coverage, and next steps.
- `agent-report.json`: the same scope and agent-reviewed conclusions in the schema below, plus any actual scanner candidates preserved as raw JSON.

The helper's own `inventory.json` and `inventory.md` remain separate. Never turn scanner candidates into agent conclusions without checking them against allowed source/config evidence. Keep the files together under this skill's default `audit-results/` workspace or a user-requested output location outside the target tree.

## Report language

Follow the response-language rule in `SKILL.md`. Localize Markdown headings, summaries, findings, dispositions' explanations, and follow-up prose, plus agent-authored explanatory JSON values such as `riskStatement`, `triggerAndCondition`, `scalingOrDuration`, `consequence`, `recommendation`, `uncertainty`, `scope.limitations`, and top-level `unknowns`. Technical names and exact evidence identifiers may remain in their original form within that prose.

Keep JSON keys and machine-valued fields unchanged, including enum/sentinel values such as `confirmed`, `conditional`, `unknown`, `unresolved`, `not established`, and `offline-read-only`, evidence roles such as `trigger`, and product names and source types. Preserve IDs, paths, commands, URLs, fingerprints, and copied scanner metadata exactly, including English prose inside `scanner.unknowns` and `scanner.candidates[].raw`. Do not translate or rewrite `inventory.json` or `inventory.md`. In Markdown, label preserved raw candidate fields separately from any localized explanation; a translated paraphrase never replaces the raw record. No language metadata field or schema change is required.

Required final-writing review follows [report-writing.md](report-writing.md) after evidence and conclusions are frozen. Only explanatory strings and Markdown expression may change; compare protected JSON fields and cross-format conclusions before delivery. Preferences are output choices, never evidence or authorization.

## Reader-first Markdown layout

Use a stable information structure, not a fill-in-the-blanks script. Localize headings and human-readable statuses; keep machine tokens unchanged. Put the conclusion before configuration inventories, file lists, scanner details or methodology. Vary the length with actual findings and gaps; never invent content to fill a section.

1. **Conclusion and action order**: state what the reviewed scope supports and count findings by confirmed / conditional / unknown. Count missing-evidence follow-ups separately; they are not additional unknown findings. Give recommended actions in priority order with a reason; call them sequential steps only when an actual dependency requires that order. Use the status note below when confirmed findings are present. Do not introduce severity scores, invented likelihoods or dollar estimates to justify ordering.
2. **Findings**: one block per supported finding, identified by its report-local ID. Present the claim and status, triggering conditions, documented billable unit and amplification mechanism, existing guards, file-and-line evidence, mitigation and any proposed owner-run acceptance check. Keep material uncertainty beside the affected claim. Link the applicable sources near that claim. An acceptance check is a recommendation, not something this audit executed. Do not elevate ordinary request handling or a binding declaration into a finding without a concrete source-supported amplification, duration, retention or abuse mechanism and review of relevant guards. Retain the complete finding fields below in JSON.
3. **Unknowns and follow-up**: identify missing evidence, why it affects the conclusion, and the next low-risk verification step. Distinguish unread bytes, content read but not traced, and unvisited paths. Surface incomplete coverage here rather than burying it in an appendix. Default offline account checks remain unperformed; online follow-up still requires the existing authorization gate.
4. **Coverage and sources**: record the audit date, project label, output location, actual mode, reviewed workspaces/configurations/environments and entry paths, exclusions, unresolved paths, actual `runtimePlatform`/`secureReadMode`, language/framework constraints, stable-tree assumptions, reading limitations and any narrowly reviewed auxiliary files. Configuration does not prove the currently deployed version. State these concisely; keep the exhaustive file roster, index hashes and receipt details in JSON. Summarize actual coverage without claiming a complete repository or deployment audit. Include direct source links and stable source IDs. Add price sources and estimate assumptions only when the user requested an estimate; otherwise leave JSON `estimate` null and omit an empty estimate section.

The conclusion and coverage remain necessary when no supported finding exists. Say “no supported billing risk found in the reviewed scope” with material gaps; do not say “safe”. Omit empty findings or follow-up blocks rather than fabricating issues or placeholder tables. Do not pad a short report with a fixed number of findings, recommendations or pages.

### Finding labels and status note

Use the same ID-first format in the action list and detail headings: `F-01: ...` in English or `F-01：...` in Chinese. Keep the report-local ID unchanged in JSON and across reordering. Put the ID before the action or finding title, not in trailing parentheses. Order actions by their stated priority; do not renumber findings merely to match that order. For example:

```markdown
- **F-01: Proposed action.** Give its evidence-linked reason and any prerequisite.

### F-01: Finding title
```

Use plain text finding references. Do not generate HTML anchor tags or fragment-based report navigation. A shared ID is sufficient to connect an action with its detail without reader-specific scrolling support. No findings means no finding list or empty detail blocks.

If the report uses confirmed status, explain its meaning once near the conclusion in a short plain Markdown blockquote with a localized label. Omit this note when no finding is confirmed. For example:

```markdown
> Note: Confirmed means the source establishes the mechanism, not that an extra production charge has been observed.
```

The examples show structure, not findings or reusable audit wording. Replace their labels with this audit's actual content. Keep the status definition in that one note, not repeated in the lead, finding blocks or delivery chat. Use clear status labels there and retain each finding's actual trigger conditions and material uncertainty. Do not hide the definition in an HTML comment or require a plugin-specific callout.

### Evidence link syntax

Use valid Markdown destinations for source-file links, including paths containing spaces. Wrap an absolute path and its fragment in angle brackets inside the link parentheses, or URL-encode whitespace. Unescaped spaces in a bare destination can turn a link into plain text. Do not change the evidence path, line reference or source URL while escaping it.

After rendering, verify that source-file links remain actual links. An HTML-only check does not prove a destination works in the user's reader; do not claim click-through verification without testing that surface.

### Portable Markdown formatting

Keep label punctuation outside bold text when prose follows immediately. Closing emphasis beside punctuation can remain literal under CommonMark delimiter rules. Use forms such as:

```markdown
**下一步**：核对证据缺口。

**日期**：保留本次审计日期。

**Next step**: Review the missing evidence.
```

Write the report as Markdown, not a backslash-escaped copy or one fenced code block. Use code spans and fences only for literal commands, paths or code. Render the completed report with an already available Markdown renderer and check that intended emphasis, lists, headings and source links are actual formatted nodes. Inspect visible prose outside code for unintended literal formatting markers and raw HTML. If rendering cannot be checked, simplify optional styling instead of claiming a pass or adding a hidden formatter dependency. This check does not prove reader-specific navigation support.

### Candidate reconciliation and optional detail

Keep scanner candidates separate from agent conclusions. When actual candidates exist, include a compact reconciliation note or appendix: candidate reference, disposition (traced to a finding, not substantiated, duplicate, or unresolved), finding reference or evidence-linked reason. Unresolved candidates that affect the result also belong in unknowns. Preserve all raw candidate fields in JSON; do not repeat their full records in the main narrative or promote a candidate without tracing it.

When no candidates were produced, omit the empty scanner-candidates section. Metadata indexes, read receipts, platform diagnostics and the complete reviewed-file list remain available in JSON. Add a detailed Markdown appendix only when it helps explain an otherwise unclear conclusion or the user requests it. Do not move necessary trigger conditions, guards or coverage gaps out of the main report.

### Chat reply versus report files

The chat reply is the delivery message, not another artifact: concise conclusion, first actions, material unknowns, then links to `agent-report.md` and `agent-report.json`. Do not paste the entire report, filesystem inventory, raw candidates or internal verification diary into chat. Both files describe the same findings and scope; their detail differs from the chat reply, not their conclusions. Successful dependency installation and writing checks stay internal under [report-writing.md](report-writing.md).

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

Reuse the finding fields, sources and conclusion boundaries above. The reader-first Markdown layout does not change JSON fields, schema versions or legacy report compatibility. Schema `3` uses `scanner.mode = "on-demand"`, not a fabricated quick-scan inventory. Its `indexes` reference actual index files with schema version, file SHA-256, directory, adapter and truncation. Its `reads` preserve successful receipt metadata exactly, without `text` or `contentBase64`. Preserve actual candidateScan findings as raw candidates only when produced. Evidence references the applicable index and read receipt. scope.reviewedPaths contains only content examined; scope.unreadRanges and scope.unvisitedDirectories name concrete remaining work. Indexed is not reviewed; read is not automatically traced.

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

In Markdown, include a distinct online-evidence subsection under coverage and sources, mapping observations to agent finding IDs and the documented billable operation/unit where warranted. Add optional `runtimeEvidenceRefs` (CE-* IDs) to agent findings only in connected versions 2/3; do not replace source/config evidence or scanner candidates. Signals not linked to a billing mechanism belong under observations or unknowns, not confirmed billing findings. Configuration, invocation, metered usage, rated cost and invoice are different evidence levels.

User-authorized already-received events may be described in a sanitized `receivedEvents` array within `connectedEvidence`, with report-local event reference, safe resource label, occurrence/receipt time, known delivery identity or `unknown`, duplicate/provenance state, and billing-path references. No raw payload, callback URL, signature/key, or original account ID is required. Do not claim verified signatures unless the client actually verified them. Reuse a known delivery identity to recognize duplicates, never to authorize queries or subscriptions. An event-only review uses report version 3 for on-demand evidence or version 2 for legacy quick-scan evidence and marks online requests zero. Its coverage is received events only, not complete history.

For an event-only review, author the extension directly with `requests: 0`, zero request/page/row/time budget, empty `observations`, and `receivedEvents` plus its unknowns; do not fabricate an account-call observation to satisfy the helper. `buildConnectedEvidence` intentionally requires at least one planned operation and is not used for event-only input. Set status from actually established event coverage, not a presumed complete issue history. The envelope checker is not a validator of event provenance.
