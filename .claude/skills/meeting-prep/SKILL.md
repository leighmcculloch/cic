---
name: meeting-prep
description: Draft prep notes for each of my meetings today, pulling Slack + GitHub context from the last 7 days and prepending to a Slack Canvas.
---

# Meeting Prep

Draft notes in preparation for my meetings today. The notes go out every day at the start of the day so I have all the context I need for every meeting I have. The goal is concise, skimmable notes that summarise and provide context for each meeting.

The user is GitHub user `leighmcculloch` (verify via `mcp__github__get_me`).

## Data sources

Gather information from all of these before writing anything. Run searches in parallel to save time.

### Google Calendar (today, my calendar)

- All meetings on my calendar for today (use `mcp__claude_ai_Google_Calendar__list_events` for today's window).
- Skip declined meetings, all-day events that aren't real meetings, and personal blocks.

### Slack channels (last 7 days, involving me)

- All Slack channels I have commented in.

### GitHub activity (last 7 days)

- PRs opened by me
- PRs merged by me
- PRs reviewed by me (approvals, comments)
- Issues opened or closed by me
- Threads / discussions I participated in

## Format rules

The update is written to a Slack Canvas using standard markdown. Each meeting gets a `###` header and a bullet list underneath.

### Structure

```
### [meeting-name] One-line summary of the meeting theme
- :emoji: Detail about a related discussion, specific PR or action ([link text](url))
- :emoji: Another detail ([link text](url))
- :emoji: Coordination or non-code work ([thread](slack-url))
### [another-meeting] One-line summary
- :emoji: ...
```

### Formatting notes

- Use `###` headers for meeting groups — no blank lines between sections (keep them tight).
- Use `-` bullet lists for items under each meeting.
- Use standard markdown links: `[text](url)` — **not** Slack mrkdwn `<url|text>`.
- Emojis use Slack's `:emoji:` syntax (they render fine in canvases).

### Emoji usage

Each bullet gets an emoji prefix that signals where the context comes from:

| Emoji | Meaning |
|-------|---------|
| `:github:` | A PR or code-related action (always include the PR link) |
| `:speech_balloon:` | Coordination, discussion, or decision-making (link to Slack thread or GitHub issue / discussion if possible) |
| `:hourglass_flowing_sand:` | Work in progress / ongoing item |
| `:arrow_forward:` | Presentation or demo |
| `:sweating:` | Something that was harder than expected or required extra iterations |
| `:eyes:` | Code reviews done for others |
| `:pray:` | Thanks / shoutouts |

### PR link format

Use standard markdown links with a short descriptor:

- `[repo#123](https://github.com/stellar/repo/pull/123)` when the repo belongs to the `stellar` org.
- `[org/repo#123](https://github.com/org/repo/pull/123)` when the repo belongs to another org.

When there are multiple PRs for the same sub-task, list them inline separated by commas.

### Grouping logic

- Group by **meeting**.
- If a meeting has only one bullet, it still gets its own top-level entry.
- Put the main / biggest meetings that have the most context activity first.
- If today has no meetings, write a single line stating that and skip the rest.

### Tone

- Concise and factual — this isn't a narrative, it's a scannable list.
- A touch of personality is fine (`:sweating:` for hard stuff, brief color commentary), but keep it short.
- Don't over-explain what a PR does — the PR title + link is usually enough. Add context only when it's not obvious from the title (e.g. a performance finding, a workaround, a coordination story).
- Don't add greetings, sign-offs, or filler text. Jump straight into the meeting headers.

## Output destination

The daily update is written to a persistent Slack Canvas: https://stellarfoundation.slack.com/docs/T02B046LB/F0AV70V60GM

**Prepend** the new update to the canvas (so the latest day is always at the top). Use a `##` header with the date as a separator (e.g. `## March 23, 2026`). DO NOT create a new canvas each time — update the existing one via `slack_update_canvas`.

After writing, DM me the canvas link via `slack_send_message` so I can review.

## Process

1. Pull today's meetings from Google Calendar.
2. In parallel, search Slack and GitHub for the last 7 days of activity.
3. Deduplicate — the same PR often shows up in both Slack and GitHub. Use the richer context but don't list it twice.
4. Group items by meeting relevance — match Slack threads, PRs, and discussions to whichever meeting they're most likely to come up in (based on attendees, topic, channel, repo).
5. Within each meeting, order roughly by importance / narrative flow, not chronologically.
6. Write the update to the canvas (prepend with a date header), then DM me the link for review.
