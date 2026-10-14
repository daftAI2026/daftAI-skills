<!--
[INPUT]: 官方 Bun 安装入口、宿主技能注册表与权限边界。
[OUTPUT]: 用户级运行时和写作依赖补齐流程。
[POS]: 审计遇到缺失依赖时加载；MCP 登录另走授权流程。
[PROTOCOL]: 变更时更新此头部，然后检查 CLAUDE.md
-->
# Runtime, required writer and optional MCP setup

Use the host's actual tool/skill registry and supported configuration interface. Do not inspect credential stores or search the audited project for tool installations. If the host cannot list configured tools, say discovery is unavailable, not that the user has none.

## Automatic dependency setup

Invoking this skill includes setting up its named audit dependencies. Detect and reuse existing installations. If Bun or the required writer is absent, install it at user scope without a separate confirmation, then verify and use it in this audit. This setup may use the network and write outside the audited project; the project itself remains read-only. Respect explicit no-network/no-install instructions and the host's permission policy. Do not elevate privileges, install unrelated packages, or bypass a denied operation. Explain a real blocker and recovery action rather than asking users to manage routine setup.

## Bun runtime

Load this section only when Bun is missing from the active command path. Check the standard user install (`$HOME/.bun/bin/bun` or `$env:USERPROFILE\.bun\bin\bun.exe`) before downloading; use a verified existing executable directly if PATH is stale.

Use the [official installation instructions](https://bun.sh/docs/installation). Download the installer to a new temporary directory outside the target, inspect it before execution, and retain the official user-level destination. Do not execute installers or package scripts from the audited project. These are dependency-setup commands, not target commands:

- macOS/Linux: download `https://bun.com/install` with `curl -fsSL`, then run the downloaded file with `bash` from that temporary directory. The official installer can update the user's shell configuration. Linux needs `unzip`; if a prerequisite cannot be supplied within permitted user-level setup, report that exact blocker instead of using `sudo`.
- Windows: download `https://bun.sh/install.ps1` with `Invoke-WebRequest`, then run the downloaded script in PowerShell with `-NoCompletions -NoRegisterInstallation -NoPathUpdate`. Use its user-level executable directly in the current audit. Do not change execution policy or request administrator access.

Verify the installed executable with `--version` and `--revision`, then invoke it by its resolved absolute path for this audit; do not wait for a new shell or Agent session. Keep the runtime installation, remove only the temporary installer directory created by this setup, and never delete a pre-existing install. Unsupported OS/CPU, network denial, failed installation or a failed executable check is a setup blocker, not a successful audit. Do not loop indefinitely or replace the controlled reader with raw file reads.

## Technical-writing dependency

`daftai-chinese-technical-writing` is the required report-writing reference for every output language. The audit uses its general documentation principles across languages and applies Chinese-specific guidance only to Chinese output. Its name never selects the report language. The user does not need to name it or supply its path. This is internal dependency resolution within an audit, not a standalone installation deliverable. Keep successful setup and future-activation notices out of the audit response.

1. Look it up in the host's available skill registry. Read the resolved `SKILL.md`, not a guessed path.
2. If absent, obtain only that skill from [daftAI2026/daftAI-skills](https://github.com/daftAI2026/daftAI-skills/tree/main/skills/daftai-chinese-technical-writing). Use a supported host skill installer, or the public Skills CLI from a trusted directory outside the target. Do not substitute similarly named repositories or execute target hooks.
3. Install to the host's user-level skill scope, not the audited project. Preserve an existing installation; do not overwrite or upgrade it merely to write this report. Record the installed source/revision when available.
4. In this same audit, read the entry at the installer-confirmed path and the relevant references, then apply [report-writing.md](report-writing.md) to the frozen draft. A client may discover newly installed skills on its next turn; that menu/registry timing does not defer this required local-instruction step. Do not restart the audit or stop after installation. If current-host access prevents execution, report the writing stage as blocked, not finished.

Where the host supports the public Skills CLI, the installation form is below. If PATH is unchanged, invoke the resolved Bun executable with `x --bun` instead of `bunx --bun`:

```sh
bunx --bun skills add daftAI2026/daftAI-skills --skill daftai-chinese-technical-writing --agent <actual-supported-agent> --global --yes
```

`<actual-supported-agent>` is an Agent-selected, verified host identifier, not a question for the user. Prefer the host's installer when one exists. Use a trusted runtime/CLI and safe working directory; package installation is separate from executing target code. Follow the host's approval policy. Use the automatic dependency setup rule above; do not add a separate confirmation. A user's no-network/no-install instruction and actual host permission restrictions take precedence. `bunx` uses the resolved Bun runtime, so Node.js is not an additional audit dependency.

If installation fails or is prohibited, retain the evidence and draft report, state that the required writing stage is blocked, and provide the exact recovery action. Do not claim the dependency ran or the final delivery passed. Do not loop indefinitely, choose another writer, or silently downgrade to optional polish. The audit's structured report contract remains [report-schema.md](report-schema.md); the writer does not choose a new schema.

## Optional official Cloudflare MCP

After a Cloudflare choice, load [mcp-setup.md](mcp-setup.md) for official connection discovery, client registration and user-completed OAuth. Do not stop at an empty resource/plugin search. The reference includes the official endpoint and verified Codex CLI forms; other clients use their actual supported setup interface. Load it only for this optional path, not for project-only review or writing dependency setup.

Missing or failed authentication is a user-action stage, not automatic permission to finish project-only. Explain the missing step, start the supported connection/login flow after setup consent, and wait for completion or an explicit skip/cancel. Preserve the project draft while waiting. Then verify available tools and enter [connected-evidence.md](connected-evidence.md) only with valid scoped authorization. Setup success is not query success.
