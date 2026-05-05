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

## Procedure

1. Confirm my GitHub identity via `mcp__github__get_me`.
2. Search Slack for messages containing GitHub PR URLs using `slack_search_public_and_private` with a query like `github.com/ in:` or `https://github.com pull`. Page through results.
3. Extract unique PR URLs of the form `https://github.com/<owner>/<repo>/pull/<number>`.
4. For each unique PR URL:
   a. Fetch the PR via `mcp__github__pull_request_read` (method `get`) and the reviews list (`pull_request_read` with method `get_reviews`) and merge state.
   b. Determine if I am involved (author / reviewer / commenter / merger). If not, skip.
   c. Determine which emoji applies per the table above.
5. For each Slack message linking to that PR:
   a. Skip if the desired reaction is already present from me.
   b. Otherwise add the reaction.

## If a Slack reaction tool is not available

If the runtime exposes no `slack_*_reaction` tool, fall back to: open a single Slack DM to myself (`slack_send_message` with channel = my own user) summarising the reactions that *would* have been applied — message link, PR link, and the chosen emoji — so I can apply them manually. Do NOT spam separate DMs per message; batch into one digest.

## Rules

- Never remove a reaction.
- Never add a reaction that is already present from me.
- Never react to messages that don't contain a PR URL.
- Skip PRs where I am not an involved party.
- If a single Slack message contains multiple PR URLs, evaluate each independently.
- Be efficient — cache PR lookups within a run; the same PR may appear in many messages.
