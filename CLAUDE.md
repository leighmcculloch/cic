# CLAUDE.md

This project is a set of recurring background tasks expressed as Claude Code skills, scheduled by a super-skill.

## Layout

```
.claude/skills/<name>/SKILL.md   # one directory per skill
Makefile                         # one target per skill: `make <name>`
```

## Adding a new skill

1. Create `.claude/skills/<name>/SKILL.md` with frontmatter and a body:

```markdown
---
name: <name>
description: <one line>
---

# <Title>

<task instructions>
```

2. Add a target to the `Makefile`:

```make
<name>:
silo claude -p /<name>
```

3. If the skill should run on a recurring loop, add a row to the schedule table in `.claude/skills/auto/SKILL.md` and re-run `/auto`.

4. Update the skills table in `README.md`.

When removing or renaming a skill, update the `Makefile`, the `/auto` schedule table, and the `README.md` skills table together so they stay in sync.
