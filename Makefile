.PHONY: auto pr-emojis pr-needs-review pr-reviews briefing meeting-prep

DAYS ?= 1

auto:
	silo claude /auto

pr-emojis:
	silo claude /pr-emojis

pr-needs-review:
	silo claude /pr-needs-review

pr-reviews:
	silo claude /pr-reviews

briefing:
	silo claude "/briefing $(DAYS)"

meeting-prep:
	silo claude /meeting-prep
