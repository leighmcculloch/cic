.PHONY: auto pr-emojis pr-needs-review pr-reviews briefing meeting-prep

DAYS ?= 1

auto:
	silo claude -p /auto

pr-emojis:
	silo claude -p /pr-emojis

pr-needs-review:
	silo claude -p /pr-needs-review

pr-reviews:
	silo claude -p /pr-reviews

briefing:
	silo claude -p "/briefing $(DAYS)"

meeting-prep:
	silo claude -p /meeting-prep
