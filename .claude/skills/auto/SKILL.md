---
name: auto
description: Schedule the registered sub-skills to run on recurring loops, equivalent to invoking /loop for each one.
---

# Auto

Schedule the sub-skills listed below to run automatically on a recurring loop. Each entry is the equivalent of the user typing `/loop <interval> /<sub-skill>` for that sub-skill — but expressed as a single cron entry that routes the slash command back into the skill dispatcher when it fires.

## Relationship to `/loop`

`/loop` is the user-facing slash command for "run this prompt on a recurring interval". It is a parser-level command — it cannot be invoked as a tool from inside another skill. When a user types `/loop 1h /pr-emojis`, `/loop` parses the interval and the prompt, then calls `CronCreate` under the hood with `prompt: "/pr-emojis"` and an equivalent cron expression. At each fire, the runtime delivers that prompt as a fresh user message, which routes through the skill dispatcher exactly as if the user had typed it.

This skill skips the `/loop` parser and calls `CronCreate` directly — for two reasons:

1. A skill cannot call `/loop` as a tool; the only programmatic equivalent is `CronCreate`.
2. `/loop`'s grammar accepts only `Ns/Nm/Nh/Nd` intervals and explicitly refuses daily cadences (it warns that a daily local cron is unlikely to fire before the REPL closes). `CronCreate` accepts full 5-field cron, which is required for `/pr-reviews` (daily at 4am).

## Schedule

| Skill | `/loop` equivalent | Cron |
|---|---|---|
| `/pr-emojis` | `/loop 1h /pr-emojis` | `7 * * * *` |
| `/pr-reviews` | (not expressible via `/loop` — daily cadence) | `7 4 * * *` |
| `/briefing 1` | (not expressible via `/loop` — daily cadence) | `17 4 * * *` |
| `/briefing 7` | (not expressible via `/loop` — weekly cadence) | `27 4 * * 1` |
| `/meeting-prep` | (not expressible via `/loop` — daily cadence) | `37 4 * * *` |

The cron minute fields are deliberately off `:00` to avoid the fleet-wide thundering herd that hits at the top of the hour (per `CronCreate`'s own guidance).

## Procedure

1. Call `CronList` to see what is already scheduled.
2. For each row above where there is no existing job whose `prompt` matches the slash command, call `CronCreate` with:
   - `cron`: the value from the table
   - `prompt`: the slash command (e.g. `/pr-emojis`)
   - `recurring`: `true`
   - `durable`: `false`
3. Do NOT duplicate jobs that already exist with the same prompt and cron.
4. After scheduling, call `CronList` again and report the resulting jobs to the user.

## Rules

- Use `durable: false` so the loops live only in the current Claude session and are not persisted to `.claude/scheduled_tasks.json`. Re-running `/auto` after each restart re-registers them.
- Recurring cron jobs auto-expire after 7 days. Always remind the user of this when scheduling — they need to re-run `/auto` weekly to refresh.
- Cron jobs only fire while Claude is running and idle. If Claude is not running at the scheduled time, the job is skipped (not deferred).
- Each sub-skill is independent — failures in one must not affect the other's schedule.
- Cancel a job via `CronDelete` with the ID returned by `CronCreate` / shown in `CronList`.

## Adding a new sub-skill

1. Create `.claude/skills/<name>/SKILL.md` with its own task instructions.
2. Add a row to the schedule table above with the desired cron expression. Prefer off-`:00` and off-`:30` minutes for any approximate cadence.
3. Re-run `/auto` to register the new job.
