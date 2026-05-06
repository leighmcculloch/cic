#!/usr/bin/env -S deno run --allow-net=api.github.com --allow-env=GITHUB_TOKEN
// Classify each given GitHub PR URL by my latest review/merge state and emit
// one JSONL line per PR with the chosen emoji (or null to skip).
//
// Usage:
//   ./main.ts <github-user> <pr-url> [<pr-url> ...]
//   printf '%s\n' "$url1" "$url2" | ./main.ts <github-user>
//
// Output: JSONL — one object per input URL:
//   {"url": "...", "emoji": "eyes|speech_balloon|white_check_mark|merged"|null,
//    "reason": "..."}
//
// Rules (mirror .claude/skills/pr-emojis/SKILL.md):
//   - I merged the PR                                         → merged
//   - I am the author and not the merger                      → null (skip)
//   - My most recent review state is PENDING                  → eyes
//   - My most recent review state is APPROVED                 → white_check_mark
//   - My most recent review state is COMMENTED/CHANGES_REQUESTED → speech_balloon
//   - Otherwise                                               → null (skip)
//
// Reads GITHUB_TOKEN from env.

import { pooledMap } from "jsr:@std/async@^1/pool";

interface Review {
  user: { login: string };
  state: string;
  submitted_at: string | null;
}

interface PR {
  user: { login: string };
  merged: boolean;
  merged_by: { login: string } | null;
}

type Emoji = "eyes" | "speech_balloon" | "white_check_mark" | "merged";

interface Result {
  url: string;
  emoji: Emoji | null;
  reason: string;
}

const PR_URL = /^https:\/\/github\.com\/([^/]+)\/([^/]+)\/pull\/(\d+)/;

async function ghFetch(token: string, url: string): Promise<Response> {
  return await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

async function ghApi<T>(token: string, path: string): Promise<T> {
  const res = await ghFetch(token, `https://api.github.com${path}`);
  if (!res.ok) throw new Error(`${res.status} ${path}`);
  return await res.json() as T;
}

async function ghApiPaginated<T>(token: string, path: string): Promise<T[]> {
  const all: T[] = [];
  let url: string | null = `https://api.github.com${path}?per_page=100`;
  while (url) {
    const res = await ghFetch(token, url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    all.push(...(await res.json() as T[]));
    const link = res.headers.get("link");
    const m = link?.match(/<([^>]+)>;\s*rel="next"/);
    url = m ? m[1] : null;
  }
  return all;
}

async function classifyOne(token: string, me: string, url: string): Promise<Result> {
  const m = url.match(PR_URL);
  if (!m) return { url, emoji: null, reason: "invalid url" };
  const [, owner, repo, num] = m;

  let pr: PR;
  try {
    pr = await ghApi<PR>(token, `/repos/${owner}/${repo}/pulls/${num}`);
  } catch {
    return { url, emoji: null, reason: "pr fetch failed" };
  }

  let reviews: Review[];
  try {
    reviews = await ghApiPaginated<Review>(
      token,
      `/repos/${owner}/${repo}/pulls/${num}/reviews`,
    );
  } catch {
    reviews = [];
  }

  const author = pr.user.login;
  const merger = pr.merged_by?.login ?? "";
  const mine = reviews
    .filter((r) => r.user.login === me)
    .sort((a, b) => (a.submitted_at ?? "").localeCompare(b.submitted_at ?? ""));
  const latest = mine.at(-1);

  if (pr.merged && merger === me) return { url, emoji: "merged", reason: "merged by me" };
  if (author === me) return { url, emoji: null, reason: "author is me; not merged by me" };
  if (!latest) return { url, emoji: null, reason: "no review or merge by me" };
  switch (latest.state) {
    case "PENDING":
      return { url, emoji: "eyes", reason: "pending review" };
    case "APPROVED":
      return { url, emoji: "white_check_mark", reason: "approved" };
    case "COMMENTED":
    case "CHANGES_REQUESTED":
      return { url, emoji: "speech_balloon", reason: latest.state.toLowerCase() };
    default:
      return { url, emoji: null, reason: `unhandled review state: ${latest.state}` };
  }
}

const [me, ...args] = Deno.args;
if (!me) {
  console.error(
    "usage: classify <github-user> [pr-url ...]   (urls also accepted on stdin)",
  );
  Deno.exit(2);
}

const urls: string[] = [...args];
if (urls.length === 0) {
  const text = await new Response(Deno.stdin.readable).text();
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t) urls.push(t);
  }
}

if (urls.length === 0) Deno.exit(0);

const token = Deno.env.get("GITHUB_TOKEN");
if (!token) {
  console.error("GITHUB_TOKEN env var required");
  Deno.exit(1);
}

const stream = pooledMap(8, urls, (u) => classifyOne(token, me, u));
for await (const r of stream) {
  console.log(JSON.stringify(r));
}
