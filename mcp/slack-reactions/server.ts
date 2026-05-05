#!/usr/bin/env -S deno run --allow-net=slack.com --allow-env=SLACK_TOKEN

import { Server } from "npm:@modelcontextprotocol/sdk@1.0.4/server/index.js";
import { StdioServerTransport } from "npm:@modelcontextprotocol/sdk@1.0.4/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "npm:@modelcontextprotocol/sdk@1.0.4/types.js";

const token = Deno.env.get("SLACK_TOKEN");
if (!token) {
  console.error("SLACK_TOKEN env var required");
  Deno.exit(1);
}

const server = new Server(
  { name: "slack-reactions", version: "0.1.0" },
  { capabilities: { tools: {} } },
);

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: [{
    name: "add_reaction",
    description:
      "Add an emoji reaction to a Slack message. Reaction is posted as the token's owner (user token = user, bot token = bot).",
    inputSchema: {
      type: "object",
      properties: {
        channel: {
          type: "string",
          description: "Channel ID (e.g. C12345678 or DM ID like DABCDEFG).",
        },
        timestamp: {
          type: "string",
          description:
            "Message ts (e.g. 1777926278.872399). Found in message permalinks as p1777926278872399.",
        },
        name: {
          type: "string",
          description: "Emoji name without colons (e.g. 'eyes', 'merged').",
        },
      },
      required: ["channel", "timestamp", "name"],
    },
  }],
}));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  if (req.params.name !== "add_reaction") {
    throw new Error(`Unknown tool: ${req.params.name}`);
  }
  const { channel, timestamp, name } = req.params.arguments as {
    channel: string;
    timestamp: string;
    name: string;
  };
  const res = await fetch("https://slack.com/api/reactions.add", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({ channel, timestamp, name }),
  });
  const data = await res.json();
  return {
    content: [{ type: "text", text: JSON.stringify(data) }],
    isError: !data.ok,
  };
});

await server.connect(new StdioServerTransport());
