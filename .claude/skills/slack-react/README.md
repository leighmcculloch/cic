# slack-react

Tiny skill for posting emoji reactions to Slack messages via Slack's [`reactions.add`](https://api.slack.com/methods/reactions.add) API. The work is done by [`slack-react-cli/cli.ts`](./slack-react-cli/cli.ts) — a ~25-line Deno script wired up as a `react` task in [`slack-react-cli/deno.jsonc`](./slack-react-cli/deno.jsonc).

It's intended as a building block other skills can call. Today `/pr-emojis` uses it to react to Slack messages linking to PRs the user is involved with, but anything that needs to add a reaction can invoke the same task.

## Usage

```sh
# from the project root:
deno task --cwd .claude/skills/slack-react/slack-react-cli react <channel> <ts> <emoji>

# or from the cli directory:
deno task react <channel> <ts> <emoji>
```

- `channel` — channel ID (`C12345678`) or DM ID (`DABCDEFG`).
- `ts` — message timestamp (`1777926278.872399`). Conversion from a permalink: take the `p…` segment after `/archives/<channel>/` and insert a dot 6 digits from the end.
- `emoji` — name without colons (`eyes`, `merged`, `white_check_mark`, …). Custom workspace emoji must already exist.

The task definition handles permissions (`--allow-net=slack.com`, `--allow-env=SLACK_TOKEN`) and loads `SLACK_TOKEN` from `~/.zenv_apikey_slack_reaction_mcp` via Deno's `--env-file` flag. Prints Slack's JSON response; exits 0 on `ok:true`, 1 otherwise. `already_reacted` is a benign duplicate.

The slash command `/slack-react <free text or permalink>` lets you ask the agent to react ad-hoc — see [`SKILL.md`](./SKILL.md) for the parsing details.

## Slack app setup

Setup is one-time. The rest of this README walks through creating the Slack app from [`manifest.yaml`](./manifest.yaml) and saving the resulting `xoxp-…` user token to `~/.zenv_apikey_slack_reaction_mcp` so the CLI can post on your behalf.

## Prerequisites

- A Slack workspace where you can create apps. Some workspaces require admin approval for new apps; if yours does, the workflow below pauses at install time waiting for approval.

## 1. Open the Slack app creator

Go to <https://api.slack.com/apps> and sign in.

## 2. Create from manifest

1. Click **Create New App**.
2. Choose **From a manifest**.
3. Pick your workspace and click **Next**.

## 3. Paste the manifest

1. Switch the editor toggle from JSON to **YAML**.
2. Paste the contents of [`manifest.yaml`](./manifest.yaml).
3. Click **Next**. Slack validates the manifest and shows a summary.
4. Click **Create**.

The manifest declares only the `reactions:write` *user* scope, so reactions are attributed to **you** — not a bot.

## 4. Install to your workspace

On the app's page:

1. Sidebar → **Install App**.
2. Click **Install to Workspace**.
3. Approve the permission prompt.

If your workspace requires admin approval, request it here and wait. The install button reappears once approved.

## 5. Copy the User OAuth token

Still on the app's page:

1. Sidebar → **OAuth & Permissions**.
2. Under **OAuth Tokens**, copy the **User OAuth Token**. It starts with `xoxp-`.

> Don't copy the *Bot* token. The manifest only requests user scopes, so a bot token won't have `reactions:write`.

## 6. Save the token to the env file

The CLI expects the token in `~/.zenv_apikey_slack_reaction_mcp`, loaded via Deno's `--env-file` flag:

```sh
echo "SLACK_TOKEN=xoxp-..." > ~/.zenv_apikey_slack_reaction_mcp
chmod 600 ~/.zenv_apikey_slack_reaction_mcp
```

> The filename ends in `_mcp` for backwards compatibility with the prior MCP-server setup. Rename freely if you also update the path in [`SKILL.md`](./SKILL.md) and any consuming skill (e.g. `.claude/skills/pr-emojis/SKILL.md`).

The file format is bare `SLACK_TOKEN=xoxp-…` (no `export`). That's intentional — Deno's `--env-file` reads it directly without shell sourcing, so an unexported assignment is fine.

## 7. Smoke test

Pick a message you've sent in any channel. Right-click it → **Copy link** to get a permalink:

```
https://yourworkspace.slack.com/archives/C09AY3FHCN6/p1777926278872399
                                        └ channel └ p<ts-without-dot>
```

Convert the `p…` segment to a timestamp by inserting a dot 6 digits from the end:
`p1777926278872399` → `1777926278.872399`.

Run the CLI:

```sh
# from the project root:
deno task --cwd .claude/skills/slack-react/slack-react-cli react C09AY3FHCN6 1777926278.872399 eyes
```

- `{"ok":true}` → setup is good. The 👀 reaction should appear on the message.
- `{"ok":false,"error":"already_reacted"}` → also fine; means a previous run already added it.
- Any other error → see the error table below.

## Bot mode (optional)

To post reactions as a bot rather than yourself:

1. Edit `manifest.yaml`: move `reactions:write` from `scopes.user` to `scopes.bot`.
2. Sidebar → **App Manifest** → paste the updated YAML → **Save Changes**.
3. Reinstall the app (Slack will prompt — required for new scopes to take effect).
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`) and put it in the env file as `SLACK_TOKEN=xoxb-…`.
5. The bot must be invited to any channel where it reacts (`/invite @slack-reactions`). DMs and channels you both belong to work without an explicit invite.

## Updating scopes later

If the skill ever needs more scopes (e.g. `reactions:read`):

1. Sidebar → **App Manifest** → edit the YAML → **Save Changes**.
2. Slack flags new scopes — click **Reinstall** to apply.
3. The token doesn't change; no env file edit needed.

## Common errors

| Slack `error` | Cause | Fix |
|---|---|---|
| `not_authed` / `invalid_auth` | Token missing, wrong, or revoked. | Re-copy the User OAuth Token; rewrite the env file. |
| `missing_scope` | Manifest missing `reactions:write`, or you didn't reinstall after a scope change. | Verify the manifest, reinstall the app. |
| `channel_not_found` | Wrong channel ID, or (bot mode) the bot isn't in that channel. | Double-check the ID; in bot mode, invite the bot. |
| `already_reacted` | You/bot already reacted with that emoji. | Benign — skip. |
| `invalid_name` | Emoji doesn't exist in the workspace. | Use a valid emoji, or upload the custom emoji first. |

## Where the CLI is invoked from

- **Other skills:** invoke `deno task --cwd .claude/skills/slack-react/slack-react-cli react …` (e.g. `.claude/skills/pr-emojis/SKILL.md`).
- **Standalone:** `deno task react <channel> <ts> <emoji>` from the [`slack-react-cli/`](./slack-react-cli/) directory.
- **Slash command:** `/slack-react <free text or permalink>` parses the request and runs the task (see [`SKILL.md`](./SKILL.md)).
