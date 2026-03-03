import { images } from "@/constants/images";
import * as React from "react";

interface AdminInviteEmailTemplateProps {
  email: string;
  role: string;
  loginUrl: string;
}

const roleLabels: Record<string, string> = {
  admin: "Admin",
  crewmate: "Crewmate",
  imposter: "Imposter",
  camsguy: "CamsGuy",
};

const roleColors: Record<string, string> = {
  admin: "#ff4655",
  crewmate: "#00ffff",
  imposter: "#a855f7",
  camsguy: "#ffd700",
};

export function AdminInviteEmailTemplate({
  email,
  role,
  loginUrl,
}: AdminInviteEmailTemplateProps) {
  const avatarIndex =
    (Array.from(email).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % 10 ||
      0) + 1;
  const siteUrl = (
    process.env.SITE_URL ?? "https://www.dakshh-hitk.com/"
  ).replace(/\/+$/, "");
  const primaryCrewmate = `${siteUrl}/${avatarIndex}.png`;
  const dakshhLogo = images.Dakshh_Logo;
  const iicLogo = images.IIC;
  const heritageLogo = images.Heritage;
  const roleLabel = roleLabels[role] ?? role;
  const roleColor = roleColors[role] ?? "#00ffff";

  return (
    <div
      style={{
        backgroundColor: "#040404",
        margin: 0,
        padding: "18px 10px",
        fontFamily:
          '"Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: "#f4f4f5",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "980px",
          margin: "0 auto",
          backgroundColor: "#090909",
          border: "2px solid #1f1f1f",
          borderRadius: "16px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid #1f1f1f",
            backgroundColor: "#0e0e0e",
          }}
        >
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
          >
            <tbody>
              <tr>
                <td />
                <td align="right" style={{ verticalAlign: "middle" }}>
                  <table role="presentation" cellPadding={0} cellSpacing={0}>
                    <tbody>
                      <tr>
                        <td style={{ paddingRight: "8px" }}>
                          <img
                            src={iicLogo}
                            alt="IIC logo"
                            width={34}
                            height={34}
                            style={{ display: "block", border: 0 }}
                          />
                        </td>
                        <td>
                          <img
                            src={heritageLogo}
                            alt="Heritage logo"
                            width={34}
                            height={34}
                            style={{ display: "block", border: 0 }}
                          />
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Body */}
        <div style={{ padding: "24px 18px" }}>
          {/* Logo + title */}
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ marginBottom: "18px" }}
          >
            <tbody>
              <tr>
                <td align="center" style={{ verticalAlign: "middle" }}>
                  <img
                    src={dakshhLogo}
                    alt="Dakshh logo"
                    width={72}
                    height={72}
                    style={{
                      display: "block",
                      border: 0,
                      margin: "0 auto 8px",
                    }}
                  />
                  <div
                    style={{
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "30px",
                      letterSpacing: "1.5px",
                      lineHeight: "34px",
                    }}
                  >
                    DAKSHH 2026
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "34px",
              lineHeight: "40px",
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            You&apos;ve Been Recruited
          </h1>

          <p
            style={{
              margin: "0 0 18px",
              fontSize: "17px",
              lineHeight: "26px",
              color: "#e4e4e7",
            }}
          >
            Good news — you&apos;ve been invited to join the Dakshh 2026 Admin
            Panel. A mission has been assigned to you. Report to the ship.
          </p>

          {/* Role card */}
          <div
            style={{
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "16px 14px",
              backgroundColor: "#0f0f0f",
              margin: "0 0 18px",
            }}
          >
            <table
              role="presentation"
              width="100%"
              cellPadding={0}
              cellSpacing={0}
            >
              <tbody>
                <tr>
                  <td style={{ verticalAlign: "middle" }}>
                    <p
                      style={{
                        margin: "0 0 6px",
                        fontWeight: 700,
                        color: "#ffd700",
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                        fontSize: "12px",
                      }}
                    >
                      Mission Briefing
                    </p>
                    <p
                      style={{
                        margin: "0 0 4px",
                        color: "#a1a1aa",
                        fontSize: "14px",
                      }}
                    >
                      Invited email
                    </p>
                    <p
                      style={{
                        margin: "0 0 10px",
                        color: "#ffffff",
                        fontSize: "15px",
                        fontWeight: 600,
                      }}
                    >
                      {email}
                    </p>
                    <p
                      style={{
                        margin: "0 0 4px",
                        color: "#a1a1aa",
                        fontSize: "14px",
                      }}
                    >
                      Assigned role
                    </p>
                    <p
                      style={{
                        margin: 0,
                        color: roleColor,
                        fontSize: "18px",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "1px",
                      }}
                    >
                      {roleLabel}
                    </p>
                  </td>
                  <td
                    align="right"
                    style={{ verticalAlign: "middle", paddingLeft: "12px" }}
                  >
                    <img
                      src={primaryCrewmate}
                      alt="Assigned crewmate"
                      width={64}
                      height={64}
                      style={{ display: "block", border: 0 }}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p
            style={{
              margin: "0 0 10px",
              fontSize: "16px",
              lineHeight: "24px",
              color: "#a1a1aa",
            }}
          >
            To get started:
          </p>
          <table
            role="presentation"
            width="100%"
            cellPadding={0}
            cellSpacing={0}
            style={{ marginBottom: "22px" }}
          >
            <tbody>
              {[
                "Click the button below to open the admin login page",
                "Enter your invited email address",
                "Set a password for your account",
                "Complete OTP verification to log in",
              ].map((step, i) => (
                <tr key={i}>
                  <td
                    style={{
                      color: "#00ffff",
                      fontSize: "15px",
                      width: "22px",
                      lineHeight: "26px",
                      verticalAlign: "top",
                      fontWeight: 700,
                    }}
                  >
                    {i + 1}.
                  </td>
                  <td
                    style={{
                      color: "#e4e4e7",
                      fontSize: "15px",
                      lineHeight: "26px",
                      paddingBottom: "2px",
                    }}
                  >
                    {step}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* CTA button */}
          <table role="presentation" cellPadding={0} cellSpacing={0}>
            <tbody>
              <tr>
                <td
                  style={{
                    borderRadius: "12px",
                    backgroundColor: "#ff4655",
                    border: "2px solid #ffffff",
                  }}
                >
                  <a
                    href={loginUrl}
                    style={{
                      display: "inline-block",
                      padding: "13px 20px",
                      borderRadius: "10px",
                      color: "#ffffff",
                      textDecoration: "none",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.6px",
                      fontSize: "14px",
                    }}
                  >
                    Set Up Your Account
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <p
            style={{
              margin: "20px 0 0",
              color: "#a1a1aa",
              fontSize: "15px",
              lineHeight: "22px",
            }}
          >
            If you weren&apos;t expecting this invitation, you can safely ignore
            this email.
            <br />
            See you on the ship.
          </p>
        </div>
      </div>
    </div>
  );
}
