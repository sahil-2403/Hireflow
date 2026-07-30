import { EMAIL_BRAND_LOGO_CID } from "./email.constants.js";

import { escapeHtml } from "./email.utils.js";

const buildEmailLayout = ({
  preheader,
  title,
  greeting,
  message,
  actionLabel,
  actionUrl,
  noticeTitle,
  noticeText,
  closingText,
}) => {
  const safePreheader = escapeHtml(preheader);
  const safeTitle = escapeHtml(title);
  const safeGreeting = escapeHtml(greeting);
  const safeMessage = escapeHtml(message);
  const safeActionLabel = escapeHtml(actionLabel);
  const safeActionUrl = escapeHtml(actionUrl);
  const safeNoticeTitle = escapeHtml(noticeTitle);
  const safeNoticeText = escapeHtml(noticeText);
  const safeClosingText = escapeHtml(closingText);

  const closingParagraph = closingText
    ? `
      <p
        class="email-secondary-copy"
        style="
          margin:22px 0 0;
          color:#475569;
          font-family:Arial, Helvetica, sans-serif;
          font-size:14px;
          line-height:22px;
        "
      >
        ${safeClosingText}
      </p>
    `
    : "";

  return `
    <!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        >

        <meta
          name="x-apple-disable-message-reformatting"
        >

        <meta
          name="color-scheme"
          content="light"
        >

        <meta
          name="supported-color-schemes"
          content="light"
        >

        <title>${safeTitle}</title>

        <style>
          :root {
            color-scheme: light;
            supported-color-schemes: light;
          }

          body,
          table,
          td,
          a {
            -webkit-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }

          table,
          td {
            mso-table-lspace: 0;
            mso-table-rspace: 0;
          }

          table {
            border-collapse: collapse;
          }

          img {
            -ms-interpolation-mode: bicubic;
          }

          .brand-header,
          .brand-header-inner {
            background-color: #ffffff !important;
          }

          @media only screen and (max-width: 620px) {
            .email-shell {
              padding: 14px 8px !important;
            }

            .email-card {
              border-radius: 12px !important;
            }

            .brand-header {
              padding: 22px 20px !important;
            }

            .brand-logo {
              width: 142px !important;
            }

            .email-content {
              padding: 26px 20px 24px !important;
            }

            .email-title {
              font-size: 22px !important;
              line-height: 29px !important;
              letter-spacing: -0.25px !important;
            }

            .email-greeting {
              font-size: 15px !important;
              line-height: 23px !important;
            }

            .email-body-copy {
              font-size: 15px !important;
              line-height: 24px !important;
            }

            .email-action {
              font-size: 15px !important;
              line-height: 21px !important;
              padding: 13px 18px !important;
            }

            .notice-title {
              font-size: 13px !important;
              line-height: 20px !important;
            }

            .notice-copy,
            .email-secondary-copy {
              font-size: 13px !important;
              line-height: 20px !important;
            }

            .fallback-instruction {
              font-size: 12px !important;
              line-height: 19px !important;
            }

            .fallback-link {
              font-size: 12px !important;
              line-height: 19px !important;
            }

            .email-footer {
              padding: 20px !important;
            }

            .footer-copy {
              font-size: 12px !important;
              line-height: 18px !important;
            }
          }

          @media only screen and (max-width: 380px) {
            .email-content {
              padding-left: 18px !important;
              padding-right: 18px !important;
            }

            .brand-header {
              padding-left: 18px !important;
              padding-right: 18px !important;
            }

            .email-title {
              font-size: 21px !important;
              line-height: 28px !important;
            }

            .brand-logo {
              width: 136px !important;
            }
          }
        </style>
      </head>

      <body
        style="
          margin:0;
          padding:0;
          background-color:#f8fafc;
        "
      >
        <div
          style="
            display:none;
            max-height:0;
            max-width:0;
            overflow:hidden;
            opacity:0;
            color:transparent;
            font-size:1px;
            line-height:1px;
            mso-hide:all;
          "
        >
          ${safePreheader}
        </div>

        <table
          role="presentation"
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            width:100%;
            background-color:#f8fafc;
          "
        >
          <tr>
            <td
              align="center"
              class="email-shell"
              style="padding:32px 16px;"
            >
              <!--[if mso]>
              <table
                role="presentation"
                width="600"
                cellpadding="0"
                cellspacing="0"
                border="0"
              >
                <tr>
                  <td>
              <![endif]-->

              <table
                role="presentation"
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                class="email-card"
                style="
                  width:100%;
                  max-width:600px;
                  overflow:hidden;
                  background-color:#ffffff;
                  border:1px solid #e2e8f0;
                  border-top:4px solid #2563eb;
                  border-radius:16px;
                  box-shadow:
                    0 12px 32px rgba(15, 23, 42, 0.08);
                "
              >
                <tr>
                  <td
                    align="center"
                    bgcolor="#ffffff"
                    class="brand-header"
                    style="
                      padding:26px 48px;
                      background-color:#ffffff !important;
                      border-bottom:1px solid #e2e8f0;
                    "
                  >
                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      bgcolor="#ffffff"
                      class="brand-header-inner"
                      style="
                        width:100%;
                        background-color:#ffffff !important;
                      "
                    >
                      <tr>
                        <td
                          align="center"
                          bgcolor="#ffffff"
                          style="
                            background-color:#ffffff !important;
                          "
                        >
                          <img
                            src="cid:${EMAIL_BRAND_LOGO_CID}"
                            alt="Hireflow"
                            width="158"
                            class="brand-logo"
                            style="
                              display:block;
                              width:158px;
                              max-width:100%;
                              height:auto;
                              margin:0 auto;
                              background-color:#ffffff;
                              border:0;
                              outline:none;
                              text-decoration:none;
                            "
                          >
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <tr>
                  <td
                    class="email-content"
                    style="padding:32px 48px 30px;"
                  >
                    <h3
                      class="email-title"
                      style="
                        margin:0;
                        color:#0f172a;
                        font-family:Arial, Helvetica, sans-serif;
                        font-size:20px;
                        font-weight:700;
                        line-height:30px;
                        letter-spacing:-0.4px;
                        text-align:center;
                      "
                    >
                      ${safeTitle}
                    </h3>

                    <div
                      style="
                        margin-top:26px;
                        text-align:left;
                      "
                    >
                      <p
                        class="email-greeting"
                        style="
                          margin:0;
                          color:#0f172a;
                          font-family:Arial, Helvetica, sans-serif;
                          font-size:16px;
                          font-weight:700;
                          line-height:25px;
                        "
                      >
                        ${safeGreeting}
                      </p>

                      <p
                        class="email-body-copy"
                        style="
                          margin:9px 0 0;
                          color:#334155;
                          font-family:Arial, Helvetica, sans-serif;
                          font-size:16px;
                          line-height:26px;
                        "
                      >
                        ${safeMessage}
                      </p>
                    </div>

                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="margin-top:26px;"
                    >
                      <tr>
                        <td
                          align="center"
                          bgcolor="#2563eb"
                          style="
                            background-color:#2563eb;
                            border-radius:9px;
                          "
                        >
                          <a
                            href="${safeActionUrl}"
                            target="_blank"
                            class="email-action"
                            style="
                              display:block;
                              padding:14px 24px;
                              color:#ffffff;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:16px;
                              font-weight:700;
                              line-height:22px;
                              text-align:center;
                              text-decoration:none;
                              border-radius:9px;
                            "
                          >
                            ${safeActionLabel}
                          </a>
                        </td>
                      </tr>
                    </table>

                    <table
                      role="presentation"
                      width="100%"
                      cellpadding="0"
                      cellspacing="0"
                      border="0"
                      style="
                        margin-top:22px;
                        background-color:#eff6ff;
                        border:1px solid #bfdbfe;
                        border-radius:10px;
                      "
                    >
                      <tr>
                        <td
                          width="44"
                          valign="top"
                          style="
                            width:44px;
                            padding:15px 0 15px 15px;
                          "
                        >
                          <span
                            style="
                              display:inline-block;
                              width:26px;
                              height:26px;
                              border-radius:50%;
                              background-color:#dbeafe;
                              color:#2563eb;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:15px;
                              font-weight:700;
                              line-height:26px;
                              text-align:center;
                            "
                          >
                            ✓
                          </span>
                        </td>

                        <td
                          valign="top"
                          style="padding:15px;"
                        >
                          <p
                            class="notice-title"
                            style="
                              margin:0;
                              color:#1e3a8a;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:14px;
                              font-weight:700;
                              line-height:21px;
                            "
                          >
                            ${safeNoticeTitle}
                          </p>

                          <p
                            class="notice-copy"
                            style="
                              margin:3px 0 0;
                              color:#334155;
                              font-family:Arial, Helvetica, sans-serif;
                              font-size:14px;
                              line-height:21px;
                            "
                          >
                            ${safeNoticeText}
                          </p>
                        </td>
                      </tr>
                    </table>

                    ${closingParagraph}

                    <p
                      class="fallback-instruction"
                      style="
                        margin:26px 0 0;
                        color:#64748b;
                        font-family:Arial, Helvetica, sans-serif;
                        font-size:13px;
                        line-height:20px;
                        text-align:center;
                      "
                    >
                      If the button does not work, copy and
                      paste this link into your browser:
                    </p>

                    <div
                      style="
                        margin-top:9px;
                        padding:12px 13px;
                        background-color:#f8fafc;
                        border:1px solid #e2e8f0;
                        border-radius:8px;
                        text-align:left;
                      "
                    >
                      <a
                        href="${safeActionUrl}"
                        target="_blank"
                        class="fallback-link"
                        style="
                          color:#2563eb;
                          font-family:Arial, Helvetica, sans-serif;
                          font-size:13px;
                          line-height:20px;
                          text-decoration:none;
                          word-break:break-all;
                        "
                      >
                        ${safeActionUrl}
                      </a>
                    </div>
                  </td>
                </tr>

                <tr>
                  <td
                    align="center"
                    class="email-footer"
                    style="
                      padding:22px 32px;
                      background-color:#f8fafc;
                      border-top:1px solid #e2e8f0;
                    "
                  >
                    <p
                      class="footer-copy"
                      style="
                        margin:0;
                        color:#475569;
                        font-family:Arial, Helvetica, sans-serif;
                        font-size:13px;
                        font-weight:700;
                        line-height:20px;
                      "
                    >
                      This is an automated message from
                      Hireflow.
                    </p>

                    <p
                      class="footer-copy"
                      style="
                        margin:3px 0 0;
                        color:#64748b;
                        font-family:Arial, Helvetica, sans-serif;
                        font-size:13px;
                        line-height:20px;
                      "
                    >
                      Please do not reply to this email.
                    </p>
                  </td>
                </tr>
              </table>

              <!--[if mso]>
                  </td>
                </tr>
              </table>
              <![endif]-->
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

export default buildEmailLayout;
