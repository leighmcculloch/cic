#!/usr/bin/env bash
# Classify each given GitHub PR URL by my latest review/merge state and emit
# one JSONL line per PR with the chosen emoji (or null to skip).
#
# Usage:
#   classify.sh <github-user> <pr-url> [<pr-url> ...]
#   printf '%s\n' "$url1" "$url2" | classify.sh <github-user>
#
# Output: JSONL — one object per input URL:
#   {"url": "...", "emoji": "eyes|speech_balloon|white_check_mark|merged"|null,
#    "reason": "..."}
#
# Rules (mirror .claude/skills/pr-emojis/SKILL.md):
#   - I merged the PR                                        → merged
#   - I am the author and PR is not merged by me             → null (skip)
#   - My most recent review state is PENDING                 → eyes
#   - My most recent review state is APPROVED                → white_check_mark
#   - My most recent review state is COMMENTED / CHANGES_REQUESTED → speech_balloon
#   - Otherwise                                              → null (skip)
#
# Requires: gh (authenticated as <github-user>), jq, xargs.

set -euo pipefail

me="${1:?github user required as first argument}"
shift || true

urls=()
if [[ $# -gt 0 ]]; then
  urls=("$@")
else
  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    urls+=("$line")
  done
fi

[[ ${#urls[@]} -eq 0 ]] && exit 0

classify_one() {
  local url="$1" me="$2"
  if [[ ! "$url" =~ ^https://github\.com/([^/]+)/([^/]+)/pull/([0-9]+) ]]; then
    jq -nc --arg url "$url" '{url: $url, emoji: null, reason: "invalid url"}'
    return
  fi
  local owner="${BASH_REMATCH[1]}" repo="${BASH_REMATCH[2]}" num="${BASH_REMATCH[3]}"

  local pr reviews
  if ! pr=$(gh api "repos/${owner}/${repo}/pulls/${num}" 2>/dev/null); then
    jq -nc --arg url "$url" '{url: $url, emoji: null, reason: "pr fetch failed"}'
    return
  fi
  reviews=$(gh api --paginate "repos/${owner}/${repo}/pulls/${num}/reviews" 2>/dev/null || echo '[]')

  jq -nc \
    --arg url "$url" --arg me "$me" \
    --argjson pr "$pr" --argjson reviews "$reviews" '
    ($pr.user.login // "") as $author
    | ($pr.merged // false) as $merged
    | (($pr.merged_by // {}) | .login // "") as $merger
    | ($reviews
        | map(select(.user.login == $me))
        | sort_by(.submitted_at // "")
        | last) as $latest
    | (if $merged and $merger == $me then
         { emoji: "merged", reason: "merged by me" }
       elif $author == $me then
         { emoji: null, reason: "author is me; not merged by me" }
       elif $latest == null then
         { emoji: null, reason: "no review or merge by me" }
       elif ($latest.state // "") == "PENDING" then
         { emoji: "eyes", reason: "pending review" }
       elif ($latest.state // "") == "APPROVED" then
         { emoji: "white_check_mark", reason: "approved" }
       elif ($latest.state // "") == "COMMENTED" or ($latest.state // "") == "CHANGES_REQUESTED" then
         { emoji: "speech_balloon", reason: ($latest.state | ascii_downcase) }
       else
         { emoji: null, reason: ("unhandled review state: " + ($latest.state // "null")) }
       end) + { url: $url }
  '
}

export -f classify_one

# Parallelize across PRs (cap concurrent gh calls to avoid hammering the API).
printf '%s\n' "${urls[@]}" | xargs -P 8 -I {} bash -c 'classify_one "$1" "$2"' _ {} "$me"
