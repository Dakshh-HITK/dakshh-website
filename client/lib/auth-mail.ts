import { Resend } from "resend";
import { render } from "@react-email/render";
import { EmailTemplate } from "@/components/email-template";
import { OtpEmailTemplate } from "@/components/otp-email-template";
import { AdminInviteEmailTemplate } from "@/components/admin-invite-email-template";
import { SeminarConfirmationEmailTemplate } from "@/components/seminar-confirmation-email-template";
import { CustomMailTemplate } from "@/components/custom-mail-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const onboardingFrom = "Dakshh Team <onboarding@dakshh-hitk.com>";
const announcementsFrom = "Dakshh Team <announcements@dakshh-hitk.com>";

export async function sendWelcomeEmail(to: string) {
  return resend.emails.send({
    from: onboardingFrom,
    to: [to],
    subject: "Welcome to TechFest Dakshh: Among Us Edition",
    react: EmailTemplate({ email: to }),
  });
}

export async function sendOtpEmail(to: string, otp: string) {
  return resend.emails.send({
    from: onboardingFrom,
    to: [to],
    subject: "Your Dakshh verification OTP",
    react: OtpEmailTemplate({ otp }),
  });
}

export async function sendAdminOtpEmail(to: string, otp: string) {
  return resend.emails.send({
    from: onboardingFrom,
    to: [to],
    subject: "Admin panel verification code",
    react: OtpEmailTemplate({ otp }),
  });
}

export async function sendAdminInviteEmail(
  to: string,
  role: string,
  loginUrl: string
) {
  return resend.emails.send({
    from: onboardingFrom,
    to: [to],
    subject: "You've been invited to the Dakshh Admin Panel",
    react: AdminInviteEmailTemplate({ email: to, role, loginUrl }),
  });
}

export async function sendSeminarConfirmationEmail(
  to: string,
  params: {
    userName: string;
    seminarTitle: string;
    speaker: string;
    date: string;
    time: string;
    mode: "online" | "offline";
    venue?: string;
    meetLink?: string;
    club?: string;
  }
) {
  return resend.emails.send({
    from: onboardingFrom,
    to: [to],
    subject: `Registration for Seminar Confirmed: ${params.seminarTitle} — Dakshh 2026`,
    react: SeminarConfirmationEmailTemplate(params),
  });
}

/* ── Mass / custom mail via Resend (announcements@) ── */
export async function sendCustomMail(
  to: string[],
  subject: string,
  htmlBody: string
) {
  const html = await render(CustomMailTemplate({ htmlContent: htmlBody }));
  return resend.emails.send({
    from: announcementsFrom,
    to,
    subject,
    html,
  });
}
