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

## Procedure

1. Confirm my GitHub identity via `mcp__github__get_me`. The classify script assumes `gh` is authenticated as that same user.
2. Search Slack for messages containing GitHub PR URLs using `slack_search_public_and_private` with a query like `https://github.com pull`. Page through results until the desired window is covered.
3. From the messages, build a list of `(channel, ts, pr_url)` tuples where `pr_url` matches `https://github.com/<owner>/<repo>/pull/<number>`. A single Slack message may contribute multiple tuples.
4. Take the **unique** set of `pr_url`s and pass them all to `classify.sh` in one invocation:
   ```
   .claude/skills/pr-emojis/classify.sh leighmcculloch <url1> <url2> ...
   ```
   The script emits one JSONL line per URL: `{"url": ..., "emoji": "eyes|speech_balloon|white_check_mark|merged"|null, "reason": "..."}`. It already encodes the author-only-merged rule, the most-recent-review rule, and pagination of the reviews list — do **not** re-derive these client-side.
5. Build a lookup `pr_url → emoji` from the script output. For each `(channel, ts, pr_url)` tuple where `emoji != null`:
   - If my reaction with that emoji is already on the message, skip.
   - Otherwise call `mcp__slack-reactions__add_reaction` with the channel, ts, and `name = emoji`.
6. Report a brief summary of reactions applied.

## If a Slack reaction tool is not available

If the runtime exposes no `slack_*_reaction` tool, fall back to: open a single Slack DM to myself (`slack_send_message` with channel = my own user) summarising the reactions that *would* have been applied — message link, PR link, and the chosen emoji — so I can apply them manually. Do NOT spam separate DMs per message; batch into one digest.

## Rules

- Never remove a reaction.
- Never add a reaction that is already present from me.
- Never react to messages that don't contain a PR URL.
- Skip PRs the script returns as `emoji: null`.
- If a single Slack message contains multiple PR URLs, evaluate each independently.
- The script handles caching implicitly — pass each unique URL once and reuse the result for every message that links to it.
- Do not re-implement the classification logic in the agent. The rules live in `classify.sh` so they stay in sync with this skill.
