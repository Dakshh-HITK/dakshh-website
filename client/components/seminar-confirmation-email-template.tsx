import * as React from "react";
import { images } from "@/constants/images";

interface SeminarConfirmationEmailProps {
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

export function SeminarConfirmationEmailTemplate({
  userName,
  seminarTitle,
  speaker,
  date,
  time,
  mode,
  venue,
  meetLink,
  club,
}: SeminarConfirmationEmailProps) {
  const siteUrl = (
    process.env.SITE_URL ?? "https://www.dakshh-hitk.com/"
  ).replace(/\/+$/, "");

  const dakshhLogo = images.Dakshh_Logo;
  const iicLogo = images.IIC;
  const heritageLogo = images.Heritage;

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
          <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
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
          {/* Logo */}
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
                    style={{ display: "block", border: 0, margin: "0 auto 8px" }}
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

          {/* Title */}
          <h1
            style={{
              margin: "0 0 8px",
              fontSize: "28px",
              lineHeight: "36px",
              color: "#ffffff",
              letterSpacing: "0.5px",
            }}
          >
            You&#39;re Registered, {userName}!
          </h1>
          <p
            style={{
              margin: "0 0 20px",
              fontSize: "16px",
              lineHeight: "24px",
              color: "#a1a1aa",
            }}
          >
            Your spot is confirmed for the seminar below. See the details and get ready.
          </p>

          {/* Seminar Details Card */}
          <div
            style={{
              border: "1px solid #22d3ee44",
              borderLeft: "4px solid #22d3ee",
              borderRadius: "12px",
              padding: "20px 18px",
              backgroundColor: "#0f1a1f",
              marginBottom: "20px",
            }}
          >
            <p
              style={{
                margin: "0 0 4px",
                fontWeight: 700,
                color: "#22d3ee",
                textTransform: "uppercase",
                letterSpacing: "0.8px",
                fontSize: "12px",
              }}
            >
              Seminar Details
            </p>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "22px",
                fontWeight: 700,
                lineHeight: "28px",
                color: "#ffffff",
              }}
            >
              {seminarTitle}
            </p>

            <table role="presentation" width="100%" cellPadding={0} cellSpacing={0}>
              <tbody>
                <tr>
                  <td style={{ paddingBottom: "8px", verticalAlign: "top" }}>
                    <span style={{ color: "#22d3ee", fontSize: "15px" }}>🎤 Speaker</span>
                  </td>
                  <td
                    align="right"
                    style={{
                      paddingBottom: "8px",
                      color: "#e4e4e7",
                      fontSize: "15px",
                      verticalAlign: "top",
                    }}
                  >
                    {speaker}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px", verticalAlign: "top" }}>
                    <span style={{ color: "#22d3ee", fontSize: "15px" }}>📅 Date</span>
                  </td>
                  <td
                    align="right"
                    style={{
                      paddingBottom: "8px",
                      color: "#e4e4e7",
                      fontSize: "15px",
                    }}
                  >
                    {date}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px", verticalAlign: "top" }}>
                    <span style={{ color: "#22d3ee", fontSize: "15px" }}>⏰ Time</span>
                  </td>
                  <td
                    align="right"
                    style={{
                      paddingBottom: "8px",
                      color: "#e4e4e7",
                      fontSize: "15px",
                    }}
                  >
                    {time}
                  </td>
                </tr>
                <tr>
                  <td style={{ paddingBottom: "8px", verticalAlign: "top" }}>
                    <span style={{ color: "#22d3ee", fontSize: "15px" }}>
                      {mode === "online" ? "🌐 Mode" : "📍 Venue"}
                    </span>
                  </td>
                  <td
                    align="right"
                    style={{
                      paddingBottom: "8px",
                      color: "#e4e4e7",
                      fontSize: "15px",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode === "online"
                      ? "Online"
                      : venue
                      ? venue
                      : "Offline"}
                  </td>
                </tr>
                {club && (
                  <tr>
                    <td style={{ paddingBottom: "8px", verticalAlign: "top" }}>
                      <span style={{ color: "#22d3ee", fontSize: "15px" }}>🏷️ Club</span>
                    </td>
                    <td
                      align="right"
                      style={{ paddingBottom: "8px", color: "#e4e4e7", fontSize: "15px" }}
                    >
                      {club}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Google Meet Link (online seminars only) */}
          {mode === "online" && meetLink && (
            <div
              style={{
                border: "1px solid #4ade8055",
                borderLeft: "4px solid #4ade80",
                borderRadius: "12px",
                padding: "16px 18px",
                backgroundColor: "#0d1a12",
                marginBottom: "20px",
              }}
            >
              <p
                style={{
                  margin: "0 0 8px",
                  fontWeight: 700,
                  color: "#4ade80",
                  textTransform: "uppercase",
                  letterSpacing: "0.8px",
                  fontSize: "12px",
                }}
              >
                Your Meeting Link
              </p>
              <p
                style={{
                  margin: "0 0 12px",
                  fontSize: "14px",
                  lineHeight: "22px",
                  color: "#a1a1aa",
                }}
              >
                Join the seminar using the Google Meet link below at the scheduled time.
              </p>
              <table role="presentation" cellPadding={0} cellSpacing={0}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        borderRadius: "10px",
                        backgroundColor: "#166534",
                        border: "2px solid #4ade80",
                      }}
                    >
                      <a
                        href={meetLink}
                        style={{
                          display: "inline-block",
                          padding: "11px 20px",
                          borderRadius: "8px",
                          color: "#ffffff",
                          textDecoration: "none",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: "0.6px",
                          fontSize: "13px",
                        }}
                      >
                        🎥 Join Google Meet
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* CTA */}
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
                    href={`${siteUrl}/seminars`}
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
                    View All Seminars
                  </a>
                </td>
              </tr>
            </tbody>
          </table>

          <p
            style={{
              margin: "22px 0 0",
              color: "#a1a1aa",
              fontSize: "15px",
              lineHeight: "22px",
            }}
          >
            See you there, crewmate.
            <br />
            — The Dakshh Team
          </p>
        </div>
      </div>
    </div>
  );
}
