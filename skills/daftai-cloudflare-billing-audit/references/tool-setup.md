# Required writer and optional MCP setup

Use the host's actual tool/skill registry and supported configuration interface. Do not inspect credential stores or search the audited project for tool installations. If the host cannot list configured tools, say discovery is unavailable, not that the user has none.

## Technical-writing dependency

`daftai-chinese-technical-writing` is the required Chinese report-writing dependency. The user does not need to name it or supply its path. This is internal dependency resolution within an audit, not a standalone installation deliverable. Keep successful setup and future-activation notices out of the audit response.

1. Look it up in the host's available skill registry. Read the resolved `SKILL.md`, not a guessed path.
2. If absent, obtain only that skill from [daftAI2026/daftAI-skills](https://github.com/daftAI2026/daftAI-skills/tree/main/skills/daftai-chinese-technical-writing). Use a supported host skill installer, or the public Skills CLI from a trusted directory outside the target. Do not substitute similarly named repositories or execute target hooks.
3. Install to the host's user-level skill scope, not the audited project. Preserve an existing installation; do not overwrite or upgrade it merely to write this report. Record the installed source/revision when available.
4. In this same audit, read the entry at the installer-confirmed path and the relevant references, then apply [report-writing.md](report-writing.md) to the frozen draft. A client may discover newly installed skills on its next turn; that menu/registry timing does not defer this required local-instruction step. Do not restart the audit or stop after installation. If current-host access prevents execution, report the writing stage as blocked, not finished.

Where the host supports the public Skills CLI, the installation form is:

```sh
npx skills add daftAI2026/daftAI-skills --skill daftai-chinese-technical-writing --agent <actual-supported-agent> --global --yes
```

`<actual-supported-agent>` is an Agent-selected, verified host identifier, not a question for the user. Prefer the host's installer when one exists. Use a trusted runtime/CLI and safe working directory; package installation is separate from executing target code. Follow the host's approval policy. Explicit permission to auto-install this named dependency need not be requested again; if installation/network access is not authorized, obtain that permission once. A user's no-network/no-install instruction takes precedence.

If installation fails or is prohibited, retain the evidence and draft report, state that the required writing stage is blocked, and provide the exact recovery action. Do not claim the dependency ran or the final delivery passed. Do not loop indefinitely, choose another writer, or silently downgrade to optional polish. The audit's structured report contract remains [report-schema.md](report-schema.md); the writer does not choose a new schema.

## Optional official Cloudflare MCP

MCP is not required for source review. Offer a single scoped online check only when it would resolve a material unknown; do not interrupt every audit with a setup dialog.

After user consent, first discover and reuse an existing official Cloudflare connection. A configured server may be remote; there need not be a locally installed server process. Check its actual availability, provenance and schema without reading tokens. Its name alone is not proof that it is official.

If none is usable and setup is authorized, follow the current [Cloudflare MCP catalog](https://developers.cloudflare.com/agents/model-context-protocol/cloudflare/servers-for-cloudflare/) and [official repository](https://github.com/cloudflare/mcp). The managed API server uses `https://mcp.cloudflare.com/mcp` with Streamable HTTP and user-completed OAuth. Do not clone or deploy its source, install every Cloudflare plugin, or assume installing Cloudflare skills also registered MCP in this host.

Register only that URL through the host's supported MCP connection flow, outside the audited target. Show the intended configuration change and least permissions needed. Preserve unrelated settings and never store tokens in this skill, a report or project files. Open the official authorization flow for the user to approve; do not collect passwords, mint API tokens, or silently grant extra scopes. If the user already approved connection setup and the bounded read scope, do not ask the same question again. If consent covered reads only, obtain the missing setup permission before changing the client configuration.

Client-specific syntax varies. Do not invent a universal config path, edit a whole user config blindly, or guess an unsupported CLI flag. If the host cannot register or reload the server, provide the official URL and its actual settings entry, preserve the offline result and report setup as incomplete.

Connecting is not permission to call every available operation. After setup, discover the real tools and apply [connected-evidence.md](connected-evidence.md): named account/project/environment, approved time window and bounded read operations. Do not create monitoring, subscriptions, saved queries or production changes. Authentication refusal keeps online evidence unknown; do not turn it into a billing-risk finding.
