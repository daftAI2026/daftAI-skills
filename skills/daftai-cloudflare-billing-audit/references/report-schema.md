# Audit report schema

Every completed audit produces a paired human-readable and machine-readable report in the run's audit workspace:

- `agent-report.md`: concise findings, coverage, and next steps.
- `agent-report.json`: the same scope and agent-reviewed conclusions in the schema below, plus the scanner's candidate records preserved as raw JSON.

The helper's own `inventory.json` and `inventory.md` remain separate. Never turn scanner candidates into agent conclusions without checking them against allowed source/config evidence. Keep the files together under this skill's default `audit-results/` workspace or a user-requested output location outside the target tree.

## Report language

Follow the response-language rule in `SKILL.md`. Localize Markdown headings, summaries, findings, dispositions' explanations, and follow-up prose, plus agent-authored explanatory JSON values such as `riskStatement`, `triggerAndCondition`, `scalingOrDuration`, `consequence`, `recommendation`, `uncertainty`, `scope.limitations`, and top-level `unknowns`. Technical names and exact evidence identifiers may remain in their original form within that prose.

Keep JSON keys and machine-valued fields unchanged, including enum/sentinel values such as `confirmed`, `conditional`, `unknown`, `unresolved`, `not established`, and `offline-read-only`, evidence roles such as `trigger`, and product names and source types. Preserve IDs, paths, commands, URLs, fingerprints, and copied scanner metadata exactly, including English prose inside `scanner.unknowns` and `scanner.candidates[].raw`. Do not translate or rewrite `inventory.json` or `inventory.md`. In Markdown, label preserved raw candidate fields separately from any localized explanation; a translated paraphrase never replaces the raw record. No language metadata field or schema change is required.

Optional technical-writing review follows [report-writing.md](report-writing.md) after evidence and conclusions are frozen. Only explanatory strings and Markdown expression may change; compare protected JSON fields and cross-format conclusions before delivery. Preferences are output choices, never evidence or authorization.

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

`scanner` in the agent report carries the helper's coverage metadata and exact safe inventory fields. `readSourceFiles` is the bounded JS/TS path list; `readAuxiliaryFiles` is the narrow SQL/YAML path list. Neither path list authorizes reopening a raw target path. The matching `reviewEvidenceFiles` entries carry each allowed content path's `kind`, `bytes`, `sha256`, and `statFingerprint`; `projectRootFingerprint` fingerprints the scanned root, not its full contents. Source or auxiliary text may be retrieved only with the helper's platform-selected `--read-file` mode, the exact relative path, and its `inventory.json`. The helper rechecks root/path identity and content/stat fingerprints before and after the bounded read. If the checks detect changed root, path, or content evidence, it emits no text, rejects the read, and the affected path remains unknown until a fresh inventory is made. The helper is not an atomic filesystem snapshot and does not promise absolute isolation from every same-permission concurrent writer. Preserve the actual `secureReadMode`: `descriptor-anchored` on Linux or `portable-stable-tree` on macOS/Windows. Portable pre/post checks require stable target, ancestor, and output trees and cannot prove that no outside-tree enumeration or read occurred during a hostile ABA replacement; report that limitation rather than implying Linux-equivalent protection. `scannedSourceFiles` is the subset whose lexical scan completed. Security-excluded, symlink, unreadable, oversize, or limit-skipped paths remain out of scope. SQL/YAML are safe-read and fingerprinted only, not parsed or executed, and the lists do not promise full coverage of either format. `scanner.candidates[].raw` must preserve the helper's exact candidate object (including its `CFBA-*` rule, suggested `matchesRuleId`, product, file, line, unknown trigger chain, condition, possible consequence, recommendation, and source links when present). `matchesRuleId` is only a suggested product-rule mapping; confirm it against the source and matched guide before using it in an agent finding. `candidateRef` is only a report-local cross-reference added beside that raw object. The helper's output is not authoritative evidence of reachability or billing.

```json
{
  "schemaVersion": 1,
  "audit": {
    "targetLabel": "",
    "auditDate": "YYYY-MM-DD",
    "outputDirectory": "",
    "mode": "offline-read-only"
  },
  "scope": {
    "workspaceRoots": [],
    "configurationFiles": [],
    "reviewedPaths": [],
    "skippedPaths": [],
    "limitations": []
  },
  "scanner": {
    "status": "scanned",
    "schemaVersion": "1.1",
    "generatedAt": "YYYY-MM-DDTHH:mm:ss.sssZ",
    "runtimePlatform": "",
    "secureReadMode": "descriptor-anchored",
    "projectRootFingerprint": "",
    "projectLabel": "",
    "coverage": [],
    "inventoryFile": "inventory.json",
    "limits": {
      "maxDepth": 8,
      "maxFiles": 500,
      "maxEntries": 4000,
      "maxTotalBytes": 2097152,
      "maxFileBytes": 262144,
      "maxCandidates": 200
    },
    "workspaces": [],
    "readSourceFiles": [],
    "readAuxiliaryFiles": [],
    "reviewEvidenceFiles": [
      {"path": "src/worker.ts", "kind": "source-js-ts", "bytes": 0, "sha256": "", "statFingerprint": ""}
    ],
    "sourceFilesScanned": 0,
    "scannedSourceFiles": [],
    "packageWorkspaces": [
      {"manifest": "package.json", "patternCount": 0, "patterns": []}
    ],
    "configs": [
      {
        "path": "wrangler.jsonc",
        "workspace": ".",
        "format": "jsonc",
        "parserStatus": "",
        "environments": [
          {
            "name": "base",
            "declarations": "local-only",
            "main": {"configured": true, "source": "", "status": "", "path": ""},
            "varsCount": 0,
            "bindings": [{"product": "", "type": "", "binding": "", "role": ""}],
            "triggers": {"cronCount": 0},
            "routeCount": 0,
            "limits": {}
          }
        ]
      }
    ],
    "unknowns": [{"code": "", "detail": "", "count": 0}],
    "skipped": {"symlinks": 0, "excludedPaths": 0, "unreadableOrOversize": 0, "nonRegularFiles": 0},
    "candidates": [
      {"candidateRef": "SC-01", "disposition": "unresolved", "raw": {}}
    ]
  },
  "agentFindings": [
    {
      "findingId": "F-01",
      "candidateRefs": ["SC-01"],
      "ruleId": "unknown",
      "product": "unknown",
      "status": "conditional",
      "riskStatement": "",
      "evidence": [
        {"path": "", "lines": "", "role": "trigger"}
      ],
      "triggerAndCondition": "",
      "billableOperationAndUnit": {"operation": "unknown", "unit": "unknown", "sourceIds": []},
      "scalingOrDuration": "",
      "consequence": "",
      "recommendation": "",
      "sourceIds": [],
      "uncertainty": ""
    }
  ],
  "unknowns": [],
  "sources": [
    {
      "sourceId": "",
      "title": "",
      "url": "",
      "sourceType": "cloudflare-official-doc",
      "guideId": null,
      "caseId": null,
      "verifiedDate": "YYYY-MM-DD"
    }
  ],
  "estimate": null
}
```

For an executed helper, `scanner.status` is one of `partial`, `inventory-only`, or `scanned`; use `not_run` only to record a blocked attempt, including unsupported adapters or unmet filesystem/stable-tree requirements. The example mode is illustrative; copy the executed helper's mode unchanged. The exact default limits are depth 8, 500 eligible files, 4,000 directory entries, 2 MiB total bytes, 256 KiB per file, and 200 candidates. `scope.reviewedPaths` must be a subset of `scanner.reviewEvidenceFiles[].path`; list parsed configuration files separately under `scope.configurationFiles`, since the helper parses those paths and the controlled content reader does not expose them. Preserve unsupported-syntax and auxiliary-scope unknowns even if manual review of a safe-read path supplies additional evidence. The target tree, its ancestors, and output location must remain stable during the scan and review; the helper is not an atomic filesystem snapshot or an absolute defense against every concurrent writer. If the scanner reports a content/identity mismatch, do not use that path as evidence and record the discrepancy as unknown. The controlled reader requires `--inventory <inventory.json> --read-file <exact-relative-path>`; exit 2 means safety/argument/platform refusal and exit 3 means the inventory, root, or file fingerprint is stale or changed. This includes legacy schema 1.0 inventories, which must be regenerated before reading. Refusals produce empty stdout. On exit 3, discard old path/candidate conclusions, regenerate inventory once against a stable tree, and only then consider a fresh controlled read; otherwise leave it unknown. Retrieved content stays in local audit context and must not be included in reports. Use empty arrays when the corresponding section is empty; never omit scope limitations merely because no finding was confirmed. In `estimate`, use `null` unless the user requested one. A requested estimate must capture access date, currency, plan, billing period, allowance and marginal rate sources, modeled units/volume, assumptions, and unresolved terms. Do not use cached prices as current evidence.

Top-level `unknowns` are agent-review unknowns and follow-up items; parser and coverage gaps from the helper stay under `scanner.unknowns`. Preserve both rather than collapsing a syntax-unsupported path into a clean result after manual review.

The helper inventory shape is defined by [scanner.md](scanner.md). Product evidence and source IDs are listed by the matched guide; use [sources.json](sources.json) during maintenance or when looking up a source ID. Keep `agentFindings` independent of helper `findings`; do not relabel them. Do not write reports or artifacts into the target tree or copy target source into the report workspace.

Map source references as follows: use the exact `source_id` for a Cloudflare official document; for a public Billflare case or guide, use its stable `id` as `sourceId` and also fill `caseId` or `guideId` as applicable. A Billflare guide may summarize official material but remains a Billflare guide; do not label its URL as a Cloudflare-owned source. Preserve source type so an author-reported case cannot be mistaken for official confirmation.

## Optional connected extension and compatibility

Old reports remain `schemaVersion: 1` with `audit.mode: "offline-read-only"` and no `connectedEvidence`. Do not relabel them, translate raw scanner evidence, or require new fields. The scanner inventory schema and CLI are unchanged.

If bounded online collection is authorized, including when every planned call is blocked, use `schemaVersion: 2` and `audit.mode: "offline-plus-connected-evidence"`, preserving all existing fields and adding `connectedEvidence`. Consumers supporting only version 1 must reject or explicitly ignore an unsupported version rather than treat online data as offline. An empty or failed online pass never invalidates the offline conclusions or hides unknowns.

`connectedEvidence` is a separate section in the existing report, not a third output file. Its minimal machine structure is defined by `ConnectedEvidence` and `Observation` in `scripts/connected-contract.ts`: version/mode, overall observed/partial/unknown status, request count, approved budget, per-operation observations, and gaps. The helper only checks its narrow envelope, not the full report or provenance. It does not establish authorization from a boolean or authenticate the source.

`Observation.source` is `connector`, `isolated-cli`, or `unknown`. Use `unknown` when no actual channel is established (including missing capability/tool); never infer `connector` from a missing value. Known channels remain unchanged even if their operation is refused. This enum extension corrects provenance in connected report schema version 2; offline version 1 is unaffected. Consumers must accept `unknown` rather than coerce it to a known channel.

One operation/scope observation represents its bounded page aggregate, not just the latest successful page. Its counts include all attempts and received rows; incomplete cursors, failures and exceeded limits remain coverage gaps. The extension builder cross-checks the aggregate requests/pages/rows across observations against its approved budget; an over-budget collection cannot be reported as `observed` without a gap. The reserved gap reference `collection-budget` identifies a collection-level budget overrun, not an observation; it uses reason `budget-exhausted`. Invalid or unsafe-integer accounting is rejected instead of serialized. If no observation is complete, overall status may remain `unknown`; describe attempted-but-incomplete pagination coverage as partial, never as no attempt or complete coverage.

For each observation, preserve enum values, evidence IDs and numeric metrics unchanged. Document approved resource/environment labels, operation, source/schema reference, observation time, requested window, deployment correlation, actual request/page/row counts, status/reason, and data-delay/sampling/retention gaps. Use unknown when a fact is not established. Never invent a local-to-production version match. The Agent may add a sanitized natural-language explanation beside the structured summary, following the response-language policy; never persist raw response/log text or credentials. Record a per-category unavailable reason even when no network request ran.

In Markdown, include a distinct online-evidence subsection under coverage, mapping observations to agent finding IDs and the documented billable operation/unit where warranted. Add optional `runtimeEvidenceRefs` (CE-* IDs) to agent findings only in version 2; do not replace source/config evidence or scanner candidates. Signals not linked to a billing mechanism belong under observations or unknowns, not confirmed billing findings. Configuration, invocation, metered usage, rated cost and invoice are different evidence levels.

User-authorized already-received events may be described in a sanitized `receivedEvents` array within `connectedEvidence`, with report-local event reference, safe resource label, occurrence/receipt time, known delivery identity or `unknown`, duplicate/provenance state, and billing-path references. No raw payload, callback URL, signature/key, or original account ID is required. Do not claim verified signatures unless the client actually verified them. Reuse a known delivery identity to recognize duplicates, never to authorize queries or subscriptions. An event-only review still uses version 2 and marks online requests zero. Its coverage is received events only, not complete history.

For an event-only review, author the extension directly with `requests: 0`, zero request/page/row/time budget, empty `observations`, and `receivedEvents` plus its unknowns; do not fabricate an account-call observation to satisfy the helper. `buildConnectedEvidence` intentionally requires at least one planned operation and is not used for event-only input. Set status from actually established event coverage, not a presumed complete issue history. The envelope checker is not a validator of event provenance.
