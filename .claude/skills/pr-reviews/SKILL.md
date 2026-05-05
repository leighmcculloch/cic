---
name: pr-reviews
description: Pick a random unreviewed PR in the @stellar GitHub org, review it with iterative critique, and DM the findings.
---

# PR Reviews

Pick one open PR in the GitHub `stellar` org that is ready for review and not yet reviewed by me, review it carefully with one round of self-critique, and send the findings to me on Slack.

The user is GitHub user `leighmcculloch` (verify via `mcp__github__get_me`).

## Procedure

1. Search open PRs across the `stellar` org via `mcp__github__search_pull_requests` with criteria:
   - `org:stellar`
   - `is:pr is:open`
   - `draft:false`
   - `review:none` OR `-review:approved` (the PR is not yet approved)
2. From the candidates, drop any PR whose description (the PR body, i.e. the issue/PR-level reactions) already has an `:eyes:` reaction from me. This marker indicates I have previously seen / claimed this PR via this skill.
3. From the remaining list, pick **one PR at random**.
4. Add an `:eyes:` reaction from me to the PR description so this skill will not re-pick the same PR on its next run. (Use the GitHub reactions API for the issue-level reaction.)
5. Run a code review using the `code-reviewer` subagent. Capture the findings.
6. Run a critique of that review using a *different* subagent (e.g. `general-purpose` framed as a senior reviewer). Ask: are the findings correct, complete, and pragmatic? What is missing? What is overreach?
7. Iterate the review for a total of 2 passes — i.e. the initial review plus one refinement that incorporates the critique.
8. Send the final findings to me as a Slack DM via `slack_send_message` (channel = my own DM). The message should include:
   - The PR link and title
   - A one-line verdict (e.g. `APPROVE`, `CHANGES NEEDED`, `LOOKS GOOD WITH NITS`)
   - A short bulleted list of actionable findings, or `No findings.` if clean.

## Rules

- Use a *different* agent for the critique vs. the initial review.
- Two passes total. Do not loop further on style debates.
- Be pragmatic — surface real issues, not nitpicks. Match the bar of a staff engineer who cares about outcomes, not engineering excellence for its own sake.
- If the candidate list is empty, send a single Slack DM saying "No PRs to review today." and stop.
- Never post a public review or comment on the PR itself — findings go only to my Slack DM.
- The `:eyes:` reaction on the PR description is the one and only side effect on GitHub.
