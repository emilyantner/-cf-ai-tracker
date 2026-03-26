import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import mammoth from "mammoth";
import { PILLARS, ACTIONS } from "@/lib/data";

type StatusKey = "Complete" | "On Track" | "In Progress" | "At Risk" | "Blocked" | "Not Started";

interface ClaudeResponse {
  summary: string;
  suggestions: Record<string, unknown>[];
}

async function extractText(file: File): Promise<string> {
  const bytes  = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const mime   = file.type;
  const name   = file.name.toLowerCase();

  if (mime === "application/pdf" || name.endsWith(".pdf")) {
    const result = await pdfParse(buffer);
    return result.text;
  }

  if (
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mime === "application/msword" ||
    name.endsWith(".docx") ||
    name.endsWith(".doc")
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (mime === "text/plain" || name.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error(`Unsupported file type: ${mime || name}`);
}

function buildPrompt(documentText: string): string {
  const taskLines = PILLARS.flatMap(p =>
    p.tasks.map(t =>
      `  [task id=${t.id} pillar="${p.id}"] "${t.task}" | status: ${t.status} | owner: ${t.owner} | due: ${t.due}`
    )
  ).join("\n");

  const actionLines = ACTIONS.map(a =>
    `  [action id=${a.id}] "${a.task}" | status: ${a.status} | owner: ${a.owner} | due: ${a.due}`
  ).join("\n");

  return `You are an AI assistant helping to keep a project tracker up to date for Channel Factory, an ad-tech company.

## Current Tracker State

### Tasks (by pillar)
${taskLines}

### Open Actions
${actionLines}

Valid status values: "Complete" | "On Track" | "In Progress" | "At Risk" | "Blocked" | "Not Started"
Valid product values for new actions: "AERO" | "IQ Series" | "Both"

## Uploaded Document

${documentText.slice(0, 12000)}

## Instructions

Read the uploaded document carefully. Identify any information that suggests the tracker should be updated. This includes:
- Tasks or actions that appear to have progressed, completed, or become blocked based on the document
- Owner changes mentioned in the document
- Updated or newly mentioned due dates
- New action items that are not yet in the tracker

Return ONLY a valid JSON object — no markdown, no explanation outside the JSON. The JSON must match this exact schema:

{
  "summary": "<1-2 sentence plain-English summary of what the document is about and what you found>",
  "suggestions": [
    { "kind": "task_status", "pillarId": "<pillar id>", "taskId": <number>, "taskLabel": "<task text>", "newStatus": "<StatusKey>", "reason": "<why>" },
    { "kind": "task_owner", "pillarId": "<pillar id>", "taskId": <number>, "taskLabel": "<task text>", "newOwner": "<name>", "reason": "<why>" },
    { "kind": "task_due", "pillarId": "<pillar id>", "taskId": <number>, "taskLabel": "<task text>", "newDue": "<date string>", "reason": "<why>" },
    { "kind": "action_status", "actionId": <number>, "actionLabel": "<action text>", "newStatus": "<StatusKey>", "reason": "<why>" },
    { "kind": "action_owner", "actionId": <number>, "actionLabel": "<action text>", "newOwner": "<name>", "reason": "<why>" },
    { "kind": "action_due", "actionId": <number>, "actionLabel": "<action text>", "newDue": "<date string>", "reason": "<why>" },
    { "kind": "new_action", "owner": "<name>", "due": "<date string>", "product": "AERO"|"IQ Series"|"Both", "task": "<description>", "reason": "<why>" }
  ]
}

Only include suggestions where you have clear evidence from the document. Do not fabricate changes. If the document contains no relevant tracker updates, return an empty suggestions array with an honest summary.`;
}

export async function POST(request: NextRequest) {
  const auth = request.cookies.get("cf_auth")?.value;
  if (auth !== process.env.SITE_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5 MB)" }, { status: 400 });
  }

  let extractedText: string;
  try {
    extractedText = await extractText(file);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Extraction failed";
    return NextResponse.json({ error: `Could not read file: ${msg}` }, { status: 422 });
  }

  if (extractedText.trim().length < 20) {
    return NextResponse.json({ error: "File appears to be empty or unreadable" }, { status: 422 });
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let raw: string;
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: buildPrompt(extractedText) }],
    });
    const block = message.content.find(b => b.type === "text");
    raw = block?.type === "text" ? block.text : "";
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Claude API error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  let parsed: ClaudeResponse;
  try {
    const jsonMatch = raw.match(/```json\s*([\s\S]*?)\s*```/) ?? raw.match(/(\{[\s\S]*\})/);
    const jsonStr   = jsonMatch ? jsonMatch[1] : raw;
    parsed          = JSON.parse(jsonStr) as ClaudeResponse;
  } catch {
    return NextResponse.json({ error: "Claude returned unparseable output" }, { status: 502 });
  }

  if (!Array.isArray(parsed.suggestions)) {
    parsed.suggestions = [];
  }

  return NextResponse.json(parsed);
}
