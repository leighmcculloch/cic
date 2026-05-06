#!/usr/bin/env -S deno run --allow-net=api.github.com --allow-env=GITHUB_TOKEN
// Find GitHub PRs the given user has acted on in the last N days, by reading
// the user activity (events) API. Outputs one PR URL per line, deduped.
//
// Usage:
//   ./main.ts <github-user> [days=3]
//
// Sources covered (all done by the user, hence shown in their events feed):
//   - PullRequestEvent             (opened, closed/merged, reopened, etc.)
//   - PullRequestReviewEvent       (submitted reviews)
//   - PullRequestReviewCommentEvent (line comments on a review)
//   - IssueCommentEvent            (comments on issues that are actually PRs)
//
// Reads GITHUB_TOKEN.

interface Event {
  type: string;
  created_at: string;
  repo: { name: string };
  payload: {
    pull_request?: { number: number };
    issue?: { number: number; pull_request?: unknown };
  };
}

const [me, daysArg] = Deno.args;
if (!me) {
  console.error("usage: find <github-user> [days=3]");
  Deno.exit(2);
}
const days = parseInt(daysArg ?? "3", 10);
if (!days || days < 1) {
  console.error("days must be a positive integer");
  Deno.exit(2);
}

const token = Deno.env.get("GITHUB_TOKEN");
if (!token) {
  console.error("GITHUB_TOKEN env var required");
  Deno.exit(1);
}

const cutoff = new Date(Date.now() - days * 86400000);

const PR_TYPES = new Set([
  "PullRequestEvent",
  "PullRequestReviewEvent",
  "PullRequestReviewCommentEvent",
]);

function urlForEvent(e: Event): string | null {
  if (PR_TYPES.has(e.type) && e.payload.pull_request) {
    return `https://github.com/${e.repo.name}/pull/${e.payload.pull_request.number}`;
  }
  if (e.type === "IssueCommentEvent" && e.payload.issue?.pull_request) {
    return `https://github.com/${e.repo.name}/pull/${e.payload.issue.number}`;
  }
  return null;
}

const urls = new Set<string>();
let url: string | null = `https://api.github.com/users/${
  encodeURIComponent(me)
}/events?per_page=100`;
let stop = false;
while (url && !stop) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  if (!res.ok) {
    console.error(`events fetch failed: ${res.status}`);
    break;
  }
  const events = await res.json() as Event[];
  for (const e of events) {
    if (new Date(e.created_at) < cutoff) {
      stop = true;
      break;
    }
    const u = urlForEvent(e);
    if (u) urls.add(u);
  }
  if (stop) break;
  const link = res.headers.get("link");
  const m = link?.match(/<([^>]+)>;\s*rel="next"/);
  url = m ? m[1] : null;
}

for (const u of urls) console.log(u);
