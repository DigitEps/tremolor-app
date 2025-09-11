import { NextResponse } from "next/server";

function parseCodes(): string[] {
  const raw = process.env.READER_CODES || "";
  return raw.split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
}

export async function POST(req: Request) {
  try {
    const { code, email } = await req.json();
    const codes = parseCodes();
    const tier = (process.env.CLAIM_TIER || "book2025").trim();

    if (!code || typeof code !== "string") {
      return NextResponse.json({ ok: false, error: "missing_code" }, { status: 400 });
    }
    const isValid = codes.includes(code.trim().toLowerCase());
    if (!isValid) {
      return NextResponse.json({ ok: false, error: "invalid_code" }, { status: 401 });
    }

    // Light audit (no PII beyond optional email)
    console.log("[CLAIM] ok", { code: "***", email: email || null, tier, at: new Date().toISOString() });

    return NextResponse.json({ ok: true, tier });
  } catch (e) {
    console.error("claim error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}