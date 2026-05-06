---
name: slack-react
description: Add an emoji reaction to a Slack message. Used as a script by other skills (e.g. /pr-emojis) and directly when the user asks to react to a specific message.
---

# slack-react

Adds an emoji reaction to a Slack message via Slack's [`reactions.add`](https://api.slack.com/methods/reactions.add) API. Reactions are attributed to the token's owner (user token = user, bot token = bot).

## CLI

The CLI lives in [`slack-react-cli/`](./slack-react-cli/) and is wired up as a Deno task. Invoke from anywhere:

```sh
# from the project root:
deno task --cwd .claude/skills/slack-react/slack-react-cli react <channel> <ts> <emoji>

# or from the cli directory:
deno task react <channel> <ts> <emoji>
```

- `channel` — channel ID (e.g. `C12345678`) or DM ID (e.g. `DABCDEFG`).
- `ts` — message timestamp (e.g. `1777926278.872399`). Found in any permalink.
- `emoji` — name without colons (e.g. `eyes`, `merged`).

The task definition handles `--env-file=$HOME/.zenv_apikey_slack_reaction_mcp` (loading `SLACK_TOKEN` directly into the deno process — no shell sourcing needed) plus the `--allow-net=slack.com` and `--allow-env=SLACK_TOKEN` permissions. The file uses bare `SLACK_TOKEN=…` (no `export`); `--env-file` reads it without needing to source. Prints Slack's JSON response to stdout. Exit code 0 if `ok:true`, 1 otherwise. `already_reacted` is a benign duplicate.

## Direct invocation (`/slack-react <text>`)

When the user invokes this skill with a free-form request, parse it for `(channel, ts, emoji)` and run the task. Common forms:

- A Slack permalink + an emoji name:
  - `react :eyes: to https://stellarfoundation.slack.com/archives/C09AY3FHCN6/p1777926278872399`
- Explicit ids:
  - `channel C09AY3FHCN6, ts 1777926278.872399, emoji eyes`

### Permalink → channel + ts

```
https://stellarfoundation.slack.com/archives/C09AY3FHCN6/p1777926278872399
                                            └ channel └ p<ts-without-dot>
```

Insert a dot 6 digits from the end of the `p…` segment: `p1777926278872399` → `1777926278.872399`.

## Setup

One-time Slack app creation, install, and token wiring is documented step-by-step in [`README.md`](./README.md). Do that once, then this skill is ready.
