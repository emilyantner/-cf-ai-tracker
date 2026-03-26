import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

export async function POST(request: NextRequest) {
  const auth = request.cookies.get("cf_auth")?.value;
  if (auth !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json() as {
    tasks: { task: string; status: string; pillar: string }[];
    actions: { task: string; status: string }[];
  };

  const { tasks, actions } = body;
  if (!tasks?.length && !actions?.length) {
    return NextResponse.json({ insight: "" });
  }

  const itemLines = [
    ...tasks.map(t => `- [Task, ${t.status}] ${t.task} (${t.pillar})`),
    ...actions.map(a => `- [Action, ${a.status}] ${a.task}`),
  ].join("\n");

  const prompt = `You are an executive assistant reviewing a project tracker for Channel Factory, an ad-tech company.

The following tasks and actions are currently flagged as Blocked or At Risk:

${itemLines}

In one plain-English sentence (max 20 words), identify the single most important underlying issue these items share. Don't list the items — give the diagnosis. Examples of the kind of insight to aim for: "Several near-term deliverables are slipping on timeline", "Progress is stalled waiting on unresolved dependencies", "Key milestones lack clear owners or defined due dates". Be specific to what you see above.`;

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 80,
    messages: [{ role: "user", content: prompt }],
  });

  const block = message.content.find(b => b.type === "text");
  const insight = block?.type === "text" ? block.text.trim().replace(/^"|"$/g, "") : "";

  return NextResponse.json({ insight });
}
