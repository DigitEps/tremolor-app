import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, markdownFull, progress, dominantVoice, answers } = body || {};
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
    }

    console.log("[LEAD] tremolor", {
      email, progress, dominantVoice,
      answers_len: Array.isArray(answers) ? answers.length : 0,
      at: new Date().toISOString(),
    });

    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.FROM_EMAIL || "no-reply@tremolor.app";
    const bccAdmin = process.env.ADMIN_EMAIL;

    if (apiKey) {
      const sgMod = await import("@sendgrid/mail");
      const sgMail = sgMod.default;
      sgMail.setApiKey(apiKey);

      const text =
        `Aquí tens el teu Informe Tremolor — Pla Enriquit de 7 dies\n\n` +
        `Progrés: ${progress}%\nVeu dominant: ${dominantVoice}\n\n` +
        (markdownFull || "");

      const msg: any = {
        to: email,
        from: fromEmail,
        subject: "El teu Pla Enriquit de 7 dies — Tremolor",
        text,
      };
      if (bccAdmin) msg.bcc = bccAdmin;

      await sgMail.send(msg);
      return NextResponse.json({ ok: true, delivered: true });
    }

    return NextResponse.json({ ok: true, delivered: false, reason: "no_api_key" });
  } catch (e) {
    console.error("Lead error", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}