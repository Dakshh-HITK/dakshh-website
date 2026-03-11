import { NextResponse } from "next/server";
import { marked } from "marked";
import { getAdminSession } from "@/lib/admin-session";
import { sendCustomMail } from "@/lib/auth-mail";

function canSendMail(
  session: { role: string; permissions: string[]; isMaster?: boolean } | null
): boolean {
  if (!session) return false;
  if (session.isMaster || session.role === "master") return true;
  if (session.role === "admin") return true;
  if (session.role === "imposter")
    return session.permissions.includes("registrations");
  return false;
}

interface RecipientInput {
  email: string;
  fullName?: string;
  teamName?: string;
  teamCode?: string;
  eventNames?: string;
}

function replacePlaceholders(
  text: string,
  r: RecipientInput
): string {
  return text
    .replace(/\{\{fullName\}\}/gi, r.fullName ?? "")
    .replace(/\{\{participantName\}\}/gi, r.fullName ?? "")
    .replace(/\{\{teamName\}\}/gi, r.teamName ?? "")
    .replace(/\{\{teamCode\}\}/gi, r.teamCode ?? "")
    .replace(/\{\{eventName\}\}/gi, r.eventNames ?? "")
    .replace(/\{\{eventNames\}\}/gi, r.eventNames ?? "")
    .replace(/\{\{email\}\}/gi, r.email ?? "");
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session || !canSendMail(session)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      subject?: string;
      bodyMarkdown?: string;
      recipients?: (string | RecipientInput)[];
    };
    const subject = body.subject?.trim();
    const bodyMarkdown = body.bodyMarkdown ?? "";
    const rawRecipients = Array.isArray(body.recipients) ? body.recipients : [];

    const recipients: RecipientInput[] = rawRecipients
      .map((r) => {
        if (typeof r === "string") {
          const email = r.trim();
          return email && email.includes("@") ? { email } : null;
        }
        const email = (r as RecipientInput).email?.trim();
        return email && email.includes("@")
          ? {
              email,
              fullName: (r as RecipientInput).fullName,
              teamName: (r as RecipientInput).teamName,
              teamCode: (r as RecipientInput).teamCode,
              eventNames: (r as RecipientInput).eventNames,
            }
          : null;
      })
      .filter((r): r is RecipientInput => r !== null);

    const uniqueRecipients = Array.from(
      new Map(recipients.map((r) => [r.email.toLowerCase(), r])).values()
    );

    if (!subject) {
      return NextResponse.json(
        { error: "Missing required field: subject" },
        { status: 400 }
      );
    }

    if (uniqueRecipients.length === 0) {
      return NextResponse.json(
        { error: "At least one recipient is required" },
        { status: 400 }
      );
    }

    const baseHtml = marked(bodyMarkdown || "(No content)", {
      gfm: true,
    }) as string;

    const delay = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms));

    let sent = 0;
    for (let i = 0; i < uniqueRecipients.length; i++) {
      const r = uniqueRecipients[i];
      const personalizedSubject = replacePlaceholders(subject, r);
      const personalizedBody = replacePlaceholders(baseHtml, r);
      const { error } = await sendCustomMail(
        [r.email],
        personalizedSubject,
        personalizedBody
      );
      if (error) {
        return NextResponse.json(
          {
            error: `Failed to send to ${r.email}: ${String(error)}`,
            sent,
          },
          { status: 500 }
        );
      }
      sent++;

      // Batch pause: longer break every 50 emails to stay well within Gmail limits
      if (sent % 50 === 0 && i < uniqueRecipients.length - 1) {
        console.log(`Sent ${sent}/${uniqueRecipients.length}, pausing 2 s…`);
        await delay(2000);
      } else if (i < uniqueRecipients.length - 1) {
        // Small gap between individual emails (pool handles auth reuse)
        await delay(200);
      }
    }

    return NextResponse.json({
      success: true,
      sent: uniqueRecipients.length,
    });
  } catch (err) {
    console.error("Admin mail send error:", err);
    return NextResponse.json(
      { error: "Failed to send email" },
      { status: 500 }
    );
  }
}
