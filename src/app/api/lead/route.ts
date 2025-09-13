import { NextResponse } from "next/server";

// Helper to escape HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planMd } = body || {};
    
    // Validate email server-side
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
    }

    console.log("[LEAD] tremolor", {
      email,
      hasPlanMd: !!planMd,
      at: new Date().toISOString(),
    });

    const SG = process.env.SENDGRID_API_KEY;
    const FROM = process.env.FROM_EMAIL || "no-reply@example.com";

    if (SG) {
      try {
        const sgMail = (await import("@sendgrid/mail")).default;
        sgMail.setApiKey(SG);

        const text = planMd
          ? planMd.slice(0, 1000)
          : "Gràcies! Rebràs el Pla en aquesta bústia.";
          
        const html = planMd
          ? `<pre style="white-space:pre-wrap;font-family:ui-monospace,monospace">${escapeHtml(planMd)}</pre>`
          : "<p>Gràcies per respondre. Rebràs el Pla aviat.</p>";

        const msg = {
          to: email,
          from: FROM,
          subject: "El teu Pla Enriquit de 7 dies — Tremolor",
          text,
          html,
        };

        await sgMail.send(msg);
        return NextResponse.json({ ok: true, queued: true });
      } catch (e) {
        console.error("SendGrid error:", e);
        return NextResponse.json({ ok: true, queued: false });
      }
    }

    // No SendGrid API key
    return NextResponse.json({ ok: true, queued: false });
  } catch (e) {
    console.error("Lead error:", e);
    // Always return 200 so UI doesn't regress gating
    return NextResponse.json({ ok: true, queued: false });
  }
}