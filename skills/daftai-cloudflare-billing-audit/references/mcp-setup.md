# Official Cloudflare MCP connection

Load only after the user chooses to query Cloudflare, or to restore that requested connection. This is client setup outside the audited project, not execution of project code. Account evidence still follows [connected-evidence.md](connected-evidence.md).

## Official source and connection form

Use the current [Cloudflare MCP catalog](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/) and [cloudflare/mcp repository](https://github.com/cloudflare/mcp). The managed API endpoint is `https://mcp.cloudflare.com/mcp`, using Streamable HTTP and user-completed OAuth. This form registers a remote connection; it does not require downloading, cloning, building or deploying the server. Installing a collection of Cloudflare skills is not proof that this client registered MCP.

Use the actual host's supported connector or MCP configuration interface. Do not install every Cloudflare plugin, deploy a local proxy, add a bearer token, or use another provider as a fallback. Do not read credential stores or dump configuration headers, environment values or tokens.

## 1. Discover before adding

Check the current tool registry and supported client connection metadata for an existing official connection. Empty MCP resources, resource templates or plugin search results do not establish that an MCP server is absent; they are not the tool/configuration registry. Continue to the host's MCP settings or verified CLI capability discovery. Distinguish not configured, configured but unauthenticated, configured but not loaded in this session, and registry unavailable.

Verify the URL, actual tool availability and connection status without reading secrets. A configured name alone does not prove provenance. Reuse a working official connection without prompting to reinstall or sign in. Preserve a registered connection that only needs authentication. Never overwrite a same-name connection with another URL or remove unrelated connections.

## 2. Register the missing connection

When no official connection is configured, explain the exact change: add one user-level Cloudflare API MCP connection at `https://mcp.cloudflare.com/mcp`, outside the audited project, then open Cloudflare login/authorization if needed. If the user already authorized this setup, proceed under host permissions. If they authorized queries only, ask once to add this connection and open authorization. Do not silently stop because setup consent is missing; request that specific consent and wait.

For Codex, consult [official MCP documentation](https://developers.openai.com/codex/mcp/) and verify the installed CLI's `mcp`, `mcp add` and `mcp login` help from a trusted directory outside the target. The supported registration form is:

```sh
codex mcp add cloudflare-api --url https://mcp.cloudflare.com/mcp
```

Use this name only when it is free, or reuse the independently verified existing official name. Do not guess flags or edit the whole client configuration. `codex mcp list` is the documented configuration inventory; use a safe metadata view and do not print secrets or persist its full output. A successful add establishes registration, not an authenticated tool connection. If add already starts OAuth, continue that flow instead of starting another login.

Other MCP clients must use their verified remote Streamable HTTP setup interface, with the same official URL. Do not run Codex commands on another client merely because a Codex binary is installed. If no supported registration interface is available, show the official URL and the actual client setup entry when known, explain the precise limitation and wait for the user to connect manually or skip. Do not invent a universal config path.

## 3. Open authorization and wait

If the connection needs login, start its supported OAuth flow. In Codex, for a registered server that is not already authorizing, the verified command is:

```sh
codex mcp login cloudflare-api
```

Use the verified existing name if different. Let the client open its authorization page. If it only returns a URL, open that exact client-issued official authorization URL through the supported browser flow, or present it when opening is unavailable. Do not construct an OAuth URL, store its state/callback in reports, collect passwords, extract tokens, approve Cloudflare permission grants on the user's behalf, or add scopes to make a failure disappear. The user completes login and chooses the minimum permissions needed for the intended evidence. Explain any operation-specific permission or metering effects before account collection.

Tell the user what to do and that this audit is waiting for connection. Keep an in-progress OAuth operation available where the host supports it; do not launch duplicate login processes. While waiting, continue safe project-only analysis and retain its draft. Do not declare the requested combined audit complete, silently downgrade it to project-only, or treat a response delay as cancellation. No background monitor, automatic infinite retries or persistent event subscription is needed.

If the user reports completion, inspect the client's actual result and tool availability. A “connected” message is not enough if this session cannot discover the tools. If reload is required, use the supported refresh operation; otherwise explain the exact session/client step and preserve the draft for continuation. Do not restart or close the user's session without consent, invent hot reload, or use a separate CLI account query to bypass missing MCP tools.

On login timeout, refusal, network failure or unsupported setup, state the precise stage and recovery action. Ask the user whether to retry/finish connecting or skip Cloudflare for this audit; wait for their answer. Retry only when requested and supported. An explicit skip/cancel permits project-only final delivery with the gap recorded. If the host cannot keep waiting, return a truthful awaiting-connection handoff with draft paths, not a completed combined audit. Missing access is not a billing-risk finding.

## 4. Verify before querying

Distinguish these stages: connection requested, registration complete, OAuth pending/complete, tools available, scoped query authorized, query succeeded. Never combine them into one success claim. Discover only the tools needed for the intended evidence and validate their official schemas. Then follow [connected-evidence.md](connected-evidence.md) for account/project/environment, interval, operations, permissions, side effects and bounded collection.

A successful connection does not authorize every API endpoint, broader account scope, configuration changes, saved queries or monitoring. Preserve project evidence and record unavailable categories without inventing live observations. Keep connection/authentication state in the client's supported store; `EXTEND.json` stores only the audit mode preference.
