import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdfParse = require("pdf-parse") as (buffer: Buffer) => Promise<{ text: string }>;
import mammoth from "mammoth";

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
  let summary = "";
  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 256,
      messages: [{
        role: "user",
        content: `Summarize this document in 2-3 sentences for use as reference material in a project tracker. Be concise and focus on the key topics covered.\n\n${extractedText.slice(0, 8000)}`,
      }],
    });
    const block = message.content.find(b => b.type === "text");
    summary = block?.type === "text" ? block.text : "";
  } catch {
    summary = "";
  }

  return NextResponse.json({
    name: file.name,
    summary,
    content: extractedText,
  });
}
