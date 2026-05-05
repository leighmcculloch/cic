# slack-reactions MCP

Tiny MCP server (single Deno file) exposing one tool: `add_reaction`. It posts to Slack's [`reactions.add`](https://api.slack.com/methods/reactions.add) endpoint.

Loaded by the project via `.mcp.json` at the repo root.

## Tool

`add_reaction(channel, timestamp, name)` — adds emoji `name` (no colons) to the message at `timestamp` in `channel`. Returns Slack's JSON response; `isError: true` if `ok: false`.

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

### 3. Export the token

```sh
export SLACK_TOKEN=xoxp-...
```

Put it in your shell profile or a `.envrc` (direnv). Do not commit it.

### 4. Verify

```sh
deno run --allow-net=slack.com --allow-env=SLACK_TOKEN mcp/slack-reactions/server.ts < /dev/null
```

It will exit immediately with no output (stdio MCP servers are silent until a client connects). A successful start = no `SLACK_TOKEN env var required` error.

To smoke-test the API call, send it a `tools/call` over stdio, or just run a one-shot curl:

```sh
curl -s -X POST https://slack.com/api/reactions.add \
  -H "Authorization: Bearer $SLACK_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channel":"C12345678","timestamp":"1777926278.872399","name":"eyes"}'
```

A response of `{"ok":true}` means the scope and token are good.

## How Claude Code loads it

The repo root `.mcp.json` registers the server. Claude Code starts it on demand and passes `SLACK_TOKEN` from the environment.

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
