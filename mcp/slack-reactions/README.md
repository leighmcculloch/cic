# slack-reactions MCP

Tiny MCP server (single Deno file) exposing one tool: `add_reaction`. It posts to Slack's [`reactions.add`](https://api.slack.com/methods/reactions.add) endpoint.

Loaded by the project via [`.mcp.json`](../../.mcp.json) at the repo root. Claude Code starts the server on demand and exposes the tool as `mcp__slack-reactions__add_reaction`.

## Tool

`add_reaction(channel, timestamp, name)` — adds emoji `name` (no colons) to the message at `timestamp` in `channel`. Returns Slack's JSON response; `isError: true` if `ok: false`. `already_reacted` is a benign duplicate.

## Setup

### 1. Create the Slack app from the manifest

1. Go to <https://api.slack.com/apps> → **Create New App** → **From a manifest**.
2. Pick your workspace.
3. Paste the contents of [`manifest.yaml`](./manifest.yaml) (switch the editor to YAML) and confirm.

The manifest declares only the `reactions:write` user scope — reactions will be attributed to you, not a bot.

> Want to post as a bot instead? Move `reactions:write` from `scopes.user` to `scopes.bot` in `manifest.yaml` and reinstall. The bot then needs to be a member of any channel where it reacts.

### 2. Install to workspace

On the app page → **Install App** → **Install to Workspace** → approve.

Copy the **User OAuth Token** (starts with `xoxp-`).

### 3. Save the token to the env file

The MCP server is launched via `deno run --env-file=$HOME/.zenv_apikey_slack_reaction_mcp …`. Create that file with the bare key/value (no `export`):

```sh
echo "SLACK_TOKEN=xoxp-..." > ~/.zenv_apikey_slack_reaction_mcp
chmod 600 ~/.zenv_apikey_slack_reaction_mcp
```

Deno's `--env-file` reads it directly into the server process — no shell sourcing required.

### 4. Verify

```sh
SLACK_TOKEN=xoxp-... deno run --allow-net=slack.com --allow-env=SLACK_TOKEN mcp/slack-reactions/server.ts < /dev/null
```

It will exit immediately with no output (stdio MCP servers are silent until a client connects). A successful start = no `SLACK_TOKEN env var required` error.

To smoke-test the API call directly:

```sh
curl -s -X POST https://slack.com/api/reactions.add \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel":"C12345678","timestamp":"1777926278.872399","name":"eyes"}'
```

A response of `{"ok":true}` means the scope and token are good.

## How Claude Code loads it

The repo root `.mcp.json` registers the server under the name `slack-reactions`. Claude Code starts it on demand. The `--env-file` flag pulls `SLACK_TOKEN` from `~/.zenv_apikey_slack_reaction_mcp` into the server's process env.

When running under `silo`, the env file must be mounted into the sandbox — see the `mounts_ro` entry in [`silo.jsonc`](../../silo.jsonc).

## Finding `channel` and `timestamp`

Both are in any Slack message permalink:

```
https://stellarfoundation.slack.com/archives/C09AY3FHCN6/p1777926278872399
                                            ^^^^^^^^^^^   ^^^^^^^^^^^^^^^^
                                            channel       p<ts-without-dot>
```

Convert the `p…` segment to `ts` by inserting a dot 6 digits from the end: `p1777926278872399` → `1777926278.872399`.

## Common errors

| `error` field | Cause |
|---|---|
| `not_authed` / `invalid_auth` | Token missing or wrong. |
| `missing_scope` | Add `reactions:write` and reinstall the app. |
| `channel_not_found` | Bot token without channel membership, or wrong ID. |
| `already_reacted` | You already reacted with that emoji — skip and move on. |
| `invalid_name` | Emoji doesn't exist in the workspace (custom emoji must be uploaded). |
