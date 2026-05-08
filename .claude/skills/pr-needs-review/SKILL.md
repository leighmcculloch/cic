---
name: pr-needs-review
description: Find GitHub PRs posted in Slack over the last 3 days that have no reviews, and DM a summary.
---

# PR Needs Review

Search Slack for GitHub pull request links posted in the last 3 days, identify which ones have not been reviewed by anyone, and send a summary to me as a Slack DM.

The user is GitHub user `leighmcculloch` (verify via `mcp__github__get_me`).

## Procedure

1. Search Slack (via `slack_search_public_and_private`) for messages containing `github.com/stellar` and `/pull/` posted in the last 3 days. Page through all results.
2. Extract all unique GitHub PR URLs from the messages. Normalize URLs (strip anchors, query params) to deduplicate. For each PR URL, record the permalink(s) of the Slack message(s) where it appeared.
3. For each PR URL, parse the owner, repo, and PR number. Fetch the PR details via `mcp__github__pull_request_read` (method: `get`) and reviews via `mcp__github__pull_request_read` (method: `get_reviews`).
4. Keep only PRs that:
   - Are still open.
   - Have **zero** submitted reviews (ignore pending reviews).
5. For each qualifying PR, note:
   - The full PR URL.
   - The PR title.
   - The PR author's GitHub username.
   - Lines added and removed (from the PR details: `additions` and `deletions`).
   - The Slack message permalink(s) where it was mentioned.
6. Send a single Slack DM to me (my own DM channel) with the list formatted as below.

## Message format

Each PR is one line:

```
<{url}|{owner}/{repo}#{number}> {title} `@{author}` `+{additions} -{deletions}` ({slack_links})
```

Where `{slack_links}` is a comma-separated list of Slack message permalink links, numbered sequentially: `(<permalink1|1>)` for one message, or `(<permalink1|1>, <permalink2|2>, <permalink3|3>)` for three messages.

Example:

```
<https://github.com/stellar/go/pull/1234|stellar/go#1234> Fix horizon ingestion bug `@janedoe` `+42 -7` (<https://myorg.slack.com/archives/C123/p456|1>, <https://myorg.slack.com/archives/C789/p012|2>)
```

If no PRs need review, send: "No unreviewed PRs found in the last 3 days."

## Rules

- Only count submitted reviews (APPROVED, CHANGES_REQUESTED, COMMENTED). Pending reviews do not count.
- Do not filter by org — any PR linked in Slack qualifies, though in practice most will be `stellar/*`.
- Deduplicate PRs that appear in multiple Slack messages.
- Do not post anything publicly — results go only to my Slack DM.
