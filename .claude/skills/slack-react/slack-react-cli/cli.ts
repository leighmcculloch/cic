#!/usr/bin/env -S deno run --allow-net=slack.com --allow-env=SLACK_TOKEN
// Add an emoji reaction to a Slack message via Slack's reactions.add API.
//
// Usage:
//   ./cli.ts <channel> <timestamp> <name>
//
// `channel` and `timestamp` come from any Slack permalink:
//   https://…/archives/C09AY3FHCN6/p1777926278872399
//                       └ channel └ p<ts-without-dot>  → 1777926278.872399
//
// Reads SLACK_TOKEN from env. Prints Slack's JSON response to stdout.
// Exits 0 if `ok:true`, 1 otherwise.

const [channel, timestamp, name] = Deno.args;
if (!channel || !timestamp || !name) {
  console.error("usage: cli.ts <channel> <timestamp> <name>");
  Deno.exit(2);
}

const token = Deno.env.get("SLACK_TOKEN");
if (!token) {
  console.error("SLACK_TOKEN env var required");
  Deno.exit(1);
}

const res = await fetch("https://slack.com/api/reactions.add", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify({ channel, timestamp, name }),
});
const data = await res.json();
console.log(JSON.stringify(data));
Deno.exit(data.ok ? 0 : 1);
