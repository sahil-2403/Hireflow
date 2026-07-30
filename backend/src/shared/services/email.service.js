import { fileURLToPath } from "node:url";

import nodemailer from "nodemailer";

import { EMAIL_BRAND_LOGO_CID } from "../email/email.constants.js";

const emailLogoPath = fileURLToPath(
  new URL("../../assets/email/hireflow-logo.png", import.meta.url),
);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,

  port: Number(process.env.SMTP_PORT),

  secure: process.env.SMTP_SECURE === "true",

  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  const brandLogoAttachment = {
    filename: "hireflow-logo.png",
    path: emailLogoPath,
    cid: EMAIL_BRAND_LOGO_CID,
    contentDisposition: "inline",
  };

  return transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    text,
    html,

    attachments: [brandLogoAttachment, ...attachments],
  });
};

export default sendEmail;
