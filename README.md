# cic

A personal set of recurring background tasks expressed as [Claude Code](https://docs.claude.com/en/docs/claude-code) skills, scheduled by a super-skill (`/auto`).

These tasks are intended to be run inside [silo], a sandboxing wrapper that scopes the Claude CLI's filesystem and network access. The `Makefile` targets invoke `silo claude` rather than `claude` directly, and the sandbox is configured via `silo.jsonc`.

[silo]: https://github.com/leighmcculloch/silo

## Skills

| Skill | What it does |
|---|---|
| [`/auto`](.claude/skills/auto/SKILL.md) | Registers the other skills as recurring cron jobs in the running Claude session. |
| [`/pr-emojis`](.claude/skills/pr-emojis/SKILL.md) | Reacts on Slack to messages linking to GitHub PRs I'm involved with, based on my review state. |
| [`/pr-reviews`](.claude/skills/pr-reviews/SKILL.md) | Picks a random unreviewed PR in the `@stellar` GitHub org, reviews it, and DMs the findings. |
| [`/briefing`](.claude/skills/briefing/SKILL.md) | Drafts a standup update from Slack + GitHub + Calendar activity over the last N days and prepends it to the team Slack Canvas. |
| [`/meeting-prep`](.claude/skills/meeting-prep/SKILL.md) | Drafts prep notes for today's meetings, pulling Slack + GitHub context from the last 7 days. |

## Layout

```
.claude/skills/<name>/SKILL.md   # one directory per skill
Makefile                         # one target per skill: `make <name>`
silo.jsonc                       # silo sandbox config for `silo claude`
```

## Running

Each skill can be run ad-hoc via `make`:

```sh
make pr-emojis
make pr-reviews
make briefing            # defaults to 1 day
make briefing DAYS=7     # weekly window
make meeting-prep
```

Each target shells out to `silo claude -p /<skill>` — `silo` is a sandboxing wrapper that scopes the Claude CLI's tool access per the config in `silo.jsonc`.

## Scheduling

To register the recurring loops, run `make auto` (or `/auto` inside Claude Code). This calls `CronCreate` under the hood for each entry in the schedule table in [`auto/SKILL.md`](.claude/skills/auto/SKILL.md).

Caveats:

- Cron jobs are **session-only** (`durable: false`) and only fire while Claude is running and idle. Re-run `/auto` after each restart.
- Recurring jobs auto-expire after 7 days, so re-run `/auto` weekly regardless.

## Adding a new skill

1. Create `.claude/skills/<name>/SKILL.md` with frontmatter and task instructions.
2. Add a `<name>` target to the `Makefile`.
3. If it should run on a recurring loop, add a row to the schedule table in `.claude/skills/auto/SKILL.md` and re-run `/auto`.
4. Add the skill to the table at the top of this README.

## License

Copyright 2026 Stellar Development Foundation (This is not an official project of the Stellar Development Foundation)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

