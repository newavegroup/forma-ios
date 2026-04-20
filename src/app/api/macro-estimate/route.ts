import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { estimateMacros } from "../../../../lib/macro-estimator/estimator";
import { z } from "zod";

const requestSchema = z.object({
  description: z.string().min(3).max(500),
});

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

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  try {
    const estimate = await estimateMacros(parsed.data.description);
    return NextResponse.json({ success: true, estimate });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Macro estimation failed:", message);
    // Surface the real error so we can debug
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
