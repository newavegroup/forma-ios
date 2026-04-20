import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { db } from "@/db";
import { coachConversations } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { buildCoachContext, renderContextPrompt } from "../../../../lib/coach/context";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

type Message = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are Forma Coach, a sports nutrition and body composition coach. You have deep expertise in carb cycling, recomposition, and performance nutrition.

Your approach is based on the IleNut methodology: 3:1 carb cycling (3 low-carb rest days to 1 high-carb training day), both at the same total calories, with macro splits varying by day type.

You have access to the user's body composition data, current macro targets, today's food log, and recent check-ins. Use this data to give specific, actionable advice — not generic tips.

Tone: direct, encouraging, practical. You speak like a knowledgeable training partner, not a clinical dietitian. Keep responses concise unless the user asks for detail. Use numbers when helpful. Never make things up — if data is missing, say so.

Do not mention that you are Claude or that you are built on any AI model.`;

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { message } = body as { message?: string };
  if (!message?.trim()) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Load or create today's conversation
  const existing = await db
    .select()
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.userId, session.userId),
        eq(coachConversations.sessionDate, today)
      )
    )
    .limit(1);

  const history: Message[] = (existing[0]?.messagesJson as Message[]) ?? [];

  // Build context bundle
  const ctx = await buildCoachContext(session.userId);
  const contextBlock = renderContextPrompt(ctx);

  // Append user message
  const updatedHistory: Message[] = [
    ...history,
    { role: "user", content: message.trim() },
  ];

  // Call Claude with streaming
  const stream = await client.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    system: `${SYSTEM_PROMPT}\n\n---\n\n## User's Current Data\n\n${contextBlock}`,
    messages: updatedHistory,
  });

  // Stream response back to client and collect full text
  const encoder = new TextEncoder();
  let fullResponse = "";

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          const text = chunk.delta.text;
          fullResponse += text;
          controller.enqueue(encoder.encode(text));
        }
      }

      // Persist conversation after stream completes
      const finalHistory: Message[] = [
        ...updatedHistory,
        { role: "assistant", content: fullResponse },
      ];

      if (existing[0]) {
        await db
          .update(coachConversations)
          .set({ messagesJson: finalHistory })
          .where(eq(coachConversations.id, existing[0].id));
      } else {
        await db.insert(coachConversations).values({
          userId: session.userId,
          sessionDate: today,
          messagesJson: finalHistory,
        });
      }

      controller.close();
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Transfer-Encoding": "chunked",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];
  const existing = await db
    .select()
    .from(coachConversations)
    .where(
      and(
        eq(coachConversations.userId, session.userId),
        eq(coachConversations.sessionDate, today)
      )
    )
    .limit(1);

  return NextResponse.json({
    messages: (existing[0]?.messagesJson as Message[]) ?? [],
  });
}
