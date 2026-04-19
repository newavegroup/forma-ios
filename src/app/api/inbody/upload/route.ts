import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/app/lib/session";
import { parse } from "../../../../../lib/inbody/parser";
import { savePdf } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = formData.get("pdf");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No PDF file provided" }, { status: 400 });
  }

  if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
    return NextResponse.json({ error: "File must be a PDF" }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Run the parser
  const result = await parse(buffer);

  if (!result.success || !result.data) {
    return NextResponse.json(
      {
        success: false,
        error: result.error ?? "Could not parse InBody PDF",
      },
      { status: 422 }
    );
  }

  // Save PDF to Railway volume (path stored for later DB insert on confirm)
  let pdfPath: string | null = null;
  try {
    pdfPath = await savePdf(session.userId, result.data.scan_date, buffer);
  } catch {
    // Non-fatal — PDF storage failure shouldn't block the parse result
    console.error("PDF storage failed — continuing without PDF path");
  }

  return NextResponse.json({
    success: true,
    data: result.data,
    raw_text: result.raw_text,
    pdf_path: pdfPath,
  });
}
