---
name: pr-emojis
description: React on Slack to messages linking to GitHub PRs the user is involved with, based on the user's review state.
---

# PR Emojis

For every Slack message — anywhere reachable, posted by anyone — that contains a link to a GitHub PR where I am involved (author, reviewer, commenter, or merger/closer), add a Slack emoji reaction reflecting my latest activity on that PR. Never remove existing reactions — this is additive only.

The user is GitHub user `leighmcculloch` (verify via `mcp__github__get_me`).

## State → Emoji

Pick the *single most recent* applicable state:

| My latest activity on the PR | Emoji |
|---|---|
| I have a pending review (started reviewing, not yet submitted) | `:eyes:` |
| My most recent submitted review is `COMMENTED` or `CHANGES_REQUESTED` | `:speech_balloon:` |
| My most recent submitted review is `APPROVED` | `:white_check_mark:` |
| I merged the PR, OR I authored a PR that someone merged | `:merged:` |

If none apply (e.g. I only opened the PR but it's still open and I haven't reviewed it), do nothing.

If I am the author of the PR, only the `:merged:` state applies — skip `:eyes:`, `:speech_balloon:`, and `:white_check_mark:` even if I have pending/submitted reviews on my own PR. Once my PR is merged (by anyone), it gets `:merged:`.

## Tools

This skill uses two Deno scripts plus an MCP tool:

- `.claude/skills/pr-emojis/find/main.ts` — given my GitHub login and a day-window, hits the user activity API (`/users/<me>/events`) and emits one PR URL per line for every PR I've acted on (opened/merged/reviewed/commented). Reads `GITHUB_TOKEN`. Directly executable via shebang.
- `.claude/skills/pr-emojis/classify/main.ts` — given my GitHub login and a list of PR URLs (args or stdin), emits JSONL with the chosen emoji per PR. Reads `GITHUB_TOKEN`. The rules above are encoded inside it — do **not** re-derive them in the agent.
- `mcp__slack-reactions__add_reaction(channel, timestamp, name)` — registered via [`.mcp.json`](../../../.mcp.json), implemented at [`mcp/slack-reactions/`](../../../mcp/slack-reactions/README.md). Posts the reaction as me.

## Procedure

The algorithm starts from **GitHub activity**, not Slack: list the PRs I've acted on recently, classify them, then for each PR with a non-null emoji search Slack for messages linking to that PR. This avoids the "Slack search window aged out the message" problem of the prior Slack-first design.

1. Confirm my GitHub identity via `mcp__github__get_me`. Both Deno scripts assume `GITHUB_TOKEN` is set in env and resolves to that user.
2. List the PRs I've touched in the last **3 days** and classify them in one pipeline:
   ```sh
   .claude/skills/pr-emojis/find/main.ts leighmcculloch 3 \
     | .claude/skills/pr-emojis/classify/main.ts leighmcculloch \
     | jq -c 'select(.emoji != null)'
   ```
   The output is JSONL: `{"url": ..., "emoji": "eyes|speech_balloon|white_check_mark|merged", "reason": "..."}`. Each line is a PR with a desired reaction.
3. For each `(pr_url, emoji)` in the output:
   1. Search Slack for messages referencing `pr_url` using `slack_search_public_and_private` with the URL as the query (page through if there are many). Capture every message that mentions it.
   2. For each Slack message:
      - If my reaction with that emoji is already on the message, skip.
      - Otherwise call `mcp__slack-reactions__add_reaction` with the channel ID, message `ts`, and emoji name (no colons). `already_reacted` is a benign duplicate signal and can be ignored.
4. Report a brief summary of reactions applied (PR → emoji → message count).

## Rules

- Never remove a reaction.
- Never add a reaction that is already present from me.
- Never react to messages that don't contain a PR URL.
- Ignore messages in my own self-DM channel. These are outputs from other skills, not organic mentions.
- Skip PRs the classify script returns as `emoji: null`.
- A Slack message may reference multiple PRs; the procedure iterates per-PR (step 3), so the same message may legitimately get multiple reactions across different PRs.
- Do not re-implement the classification logic in the agent. The rules live in `classify/main.ts` so they stay in sync with this skill.
- Do not re-implement PR discovery in the agent. The events-API logic lives in `find/main.ts`.
