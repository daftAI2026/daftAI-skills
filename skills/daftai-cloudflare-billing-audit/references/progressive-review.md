# Progressive source review

Default acquisition uses metadata first, then necessary content. A short request is sufficient. Resolve “this project” only from one unambiguous runtime-supplied project directory; state it and start. Ask only for an actual ambiguity or blocker, not a byte quota or setup questionnaire.

## Index, select, read

From the trusted installed skill directory:

```sh
bun scripts/audit.ts --index --project /absolute/project --output-dir /external/audit-workspace
bun scripts/audit.ts --index --project /absolute/project --directory src/server --output-dir /external/audit-workspace
```

Each summary names a run directory containing inventory.json. Scope-index schema `2.0` contains immediate child metadata and normalized ancestor Wrangler configuration, not source bodies. Select relevant entry/route/handler/framework configuration directories, then follow the source-supported call chain. Tool skills, samples, fixtures and tests are secondary unless an actual entry/import points to them. A package-like main remains unresolved, not a broken deployment. Do not import it or read dependencies to resolve it.

Read an exact file from its matching directory index:

```sh
bun scripts/audit.ts --index --project /absolute/project \
  --inventory /external/audit-workspace/run/inventory.json \
  --read-file src/server/worker.ts
```

For another range, add `--offset 262144 --length 262144`. These are byte offsets, not lines. Each range is at most 256 KiB. Follow nextOffset when more relevant content is needed; null means EOF for that file, not whole-project completion. Large ordinary files can continue without allocating the full file. No cumulative 2 MiB source allowance applies to progressive review.

JSON output includes text and receipt metadata: exact path/kind, byte offset/count, full size, range SHA-256, stat/root fingerprints, time, adapter, nextOffset and completeFile. A range SHA covers only returned bytes. completeFile requires one read of the entire file; only then can the lexical matcher run. Partial/auxiliary reads report candidateScan as not-scanned, not zero risk.

contentBase64 preserves exact bytes. text is UTF-8 convenience output and is null when a range splits a code point or contains invalid UTF-8. Join necessary adjacent raw ranges in memory and decode strictly; never replace corrupt characters or persist project source. Exact global line numbers require a verified continuous prefix from byte zero or an independently established line baseline; mid-file offsets alone provide no line baseline.

## Operation bounds and stopping

Each index enumerates at most 4,000 immediate entries and parses at most 2 MiB of ancestor configuration, at most 256 KiB per config. Each source read returns at most 256 KiB. These protect one operation; they do not end the audit after a fixed amount of source. Index only relevant directories, read needed ranges, and avoid repeated unchanged reads or exhaustive unrelated traversal.

The index records directory identity, observed entry count/digest, truncation, file metadata and config fingerprints. Truncated directories stay partial. Known safe child directories can be indexed separately; unobserved siblings remain unknown. This version does not page beyond 4,000 immediate siblings. Report that gap instead of repeating the same batch or claiming complete coverage.

Stop when relevant chargeable paths and guards are established, or when safe access, necessary evidence, actual host time/context/tool capacity or user instructions prevent further review. Record the next path/range and reason. An interruption or unread range is not successful completion. Never ask users to choose arbitrary byte limits or enable account access for an offline audit.

## Safety and freshness

- Every read independently rebuilds the selected directory and configuration authorization, then uses the existing native adapter. An editable inventory is not a capability. Raw cat/editor/import access does not replace this reader.
- Keep target, ancestors and external output stable. Root fingerprints identify paths, not complete content snapshots. macOS/Windows stable-tree checks are not hostile-concurrency isolation.
- Configuration changes, directory additions/deletions/renames and changed target metadata invalidate reads. A stale chunk invalidates that file's earlier chunk group; re-index and restart, never assemble versions.
- Stat fingerprints are metadata identity, not content hashes. Range hashes and pre/post checks do not defeat arbitrary same-privilege concurrent mutation. Stop if stability fails.
- Existing allowed JS/TS extensions are source evidence. D1 SQL requires a valid readable ancestor config selecting its directory, and only direct children qualify. Root .github/workflows YAML requires a valid ancestor Workers config with a nonempty main or assets.directory declaration; an empty object or unrelated JSON does not qualify. Multiple D1 binding scopes remain unattributed to a single database. Extensions alone do not authorize auxiliary content. Multiple Wrangler config candidates in one workspace make its auxiliary authorization ambiguous; keep SQL/YAML unread and report unknown, while source review can continue.
- Sibling/descendant monorepo config cannot authorize auxiliary reads in this first progressive version. Record the gap; do not broaden SQL/YAML access or claim no relevant evidence exists. Source directories can still be indexed.
- Never execute target code/config/hooks/tests/builds/SQL, read credentials/.env/excluded trees/links/nonregular files, upload source, enable logging or create subscriptions. Indexing grants no account/network permissions.

## Reports, writing and interaction

Keep one final agent-report.md/agent-report.json pair. Use report schema 3 under report-schema.md; scope-index schema 2.0 and connectedEvidence schema 1 are independent versions. Distinguish indexed, read, reviewed and lexically scanned scope. Record actual index references and successful receipt metadata without source text/Base64. Unvisited directories and unread ranges are not reviewed.

After facts are frozen, complete the required writing stage under report-writing.md; resolve or obtain its Chinese dependency internally. Pass only editable expression, not indexes/source/Base64/telemetry. Preserve evidence IDs, ranges/hashes, amounts, statuses and unknowns. A missing dependency does not discard audit evidence; preserve the draft and report the writing delivery blocker.

Show the highest-signal supported findings directly in chat with conditions, evidence and next actions; link both reports. Do not open a dialog for each finding or apply repairs. Only unresolved target/safe-output/required-access decisions need a concise question. With no supported finding, state that result and significant gaps, never “safe”.
