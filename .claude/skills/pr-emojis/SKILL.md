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
| I merged the PR | `:merged:` |

If none apply (e.g. I only opened the PR but have not reviewed/merged it), do nothing.

If I am the author of the PR, only the `:merged:` state applies — skip `:eyes:`, `:speech_balloon:`, and `:white_check_mark:` even if I have pending/submitted reviews on my own PR.

## Tools

This skill uses:

- `.claude/skills/pr-emojis/classify/main.ts` — given my GitHub login and a list of PR URLs, emits JSONL with the chosen emoji per PR. Reads `GITHUB_TOKEN` from env. The rules above are encoded inside it — do **not** re-derive them in the agent. Directly executable via shebang.
- The [`/slack-react`](../slack-react/SKILL.md) skill to post each reaction. See its SKILL.md for invocation; do not re-derive the deno command here.

## Procedure

1. Confirm my GitHub identity via `mcp__github__get_me`. The classify CLI assumes `GITHUB_TOKEN` is set in env and resolves to that user.
2. Search Slack for messages containing GitHub PR URLs using `slack_search_public_and_private` with a query like `https://github.com pull`. Page through results until the desired window is covered.
3. From the messages, build a list of `(channel, ts, pr_url)` tuples where `pr_url` matches `https://github.com/<owner>/<repo>/pull/<number>`. A single Slack message may contribute multiple tuples.
4. Take the **unique** set of `pr_url`s and pass them all to `classify/main.ts` in one invocation:
   ```sh
   .claude/skills/pr-emojis/classify/main.ts leighmcculloch <url1> <url2> ...
   ```
   The script emits one JSONL line per URL: `{"url": ..., "emoji": "eyes|speech_balloon|white_check_mark|merged"|null, "reason": "..."}`.
5. Build a lookup `pr_url → emoji` from the script output. For each `(channel, ts, pr_url)` tuple where `emoji != null`:
   - If my reaction with that emoji is already on the message, skip.
   - Otherwise post the reaction via the [`/slack-react`](../slack-react/SKILL.md) skill (its SKILL.md is the source of truth for the invocation). `already_reacted` errors can be safely ignored.
6. Report a brief summary of reactions applied.

## Rules

- Never remove a reaction.
- Never add a reaction that is already present from me.
- Never react to messages that don't contain a PR URL.
- Skip PRs the script returns as `emoji: null`.
- If a single Slack message contains multiple PR URLs, evaluate each independently.
- The script handles caching implicitly — pass each unique URL once and reuse the result for every message that links to it.
- Do not re-implement the classification logic in the agent. The rules live in `classify/main.ts` so they stay in sync with this skill.
