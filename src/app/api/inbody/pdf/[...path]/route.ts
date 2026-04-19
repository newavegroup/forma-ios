import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { getPdf } from "@/lib/storage";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const filePath = path.join("/");

  // Prevent path traversal
  if (filePath.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  // Users can only access their own PDFs
  if (!filePath.startsWith(session.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const buffer = await getPdf(filePath);
    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "PDF not found" }, { status: 404 });
  }
}
