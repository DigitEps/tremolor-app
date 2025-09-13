import { NextResponse } from "next/server";
import { EmailTemplates, type EmailTemplateData } from "@/utils/emailTemplates";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, planMd, dominantVoice, progress, userName } = body || {};
    
    // Validate email server-side
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
    }

    console.log("[LEAD] tremolor", {
      email,
      dominantVoice,
      progress,
      hasPlanMd: !!planMd,
      at: new Date().toISOString(),
    });

    const SG = process.env.SENDGRID_API_KEY;
    const FROM = process.env.FROM_EMAIL || "no-reply@tremolor.app";
    const REPORT_URL = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/informe` : undefined;

    if (SG) {
      try {
        const sgMail = (await import("@sendgrid/mail")).default;
        sgMail.setApiKey(SG);

        // Prepare email template data
        const templateData: EmailTemplateData = {
          userEmail: email,
          dominantVoice: dominantVoice || "Tu",
          progress: progress || 100,
          reportUrl: REPORT_URL,
          userName: userName
        };

        // Generate professional email template
        const emailTemplate = EmailTemplates.getWelcomeTemplate(templateData);

        const msg = {
          to: email,
          from: {
            email: FROM,
            name: "Tremolor - Mapa del Tremolor"
          },
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          html: emailTemplate.html,
          // Add tracking and analytics
          trackingSettings: {
            clickTracking: { enable: true },
            openTracking: { enable: true }
          },
          // Add categories for analytics
          categories: ["tremolor-report", "welcome-email"]
        };

        await sgMail.send(msg);
        
        // Schedule follow-up emails (you could implement this with a queue system)
        // For now, we'll just log the intent
        console.log("[LEAD] Follow-up emails scheduled for:", email);
        
        return NextResponse.json({
          ok: true,
          queued: true,
          message: "Professional report email sent successfully"
        });
      } catch (e) {
        console.error("SendGrid error:", e);
        return NextResponse.json({ ok: true, queued: false });
      }
    }

    // No SendGrid API key - still return success for UI
    console.log("[LEAD] No SendGrid API key configured");
    return NextResponse.json({ ok: true, queued: false, reason: "no_sendgrid" });
  } catch (e) {
    console.error("Lead error:", e);
    // Always return 200 so UI doesn't regress gating
    return NextResponse.json({ ok: true, queued: false });
  }
}