import buildEmailLayout from "../emailLayout.js";

import { normalizeRecipientName } from "../email.utils.js";

const buildPasswordResetEmail = ({ username, resetUrl, expiresInMinutes }) => {
  const recipientName = normalizeRecipientName(username);

  const subject = "Reset your Hireflow password";

  const text = [
    `Hi ${recipientName},`,
    "",
    "We received a request to create a new password for your Hireflow account.",
    "",
    "Use the secure link below:",
    resetUrl,
    "",
    `This link expires in ${expiresInMinutes} minutes and can only be used once.`,
    "",
    "If you did not request this, you can safely ignore this email. Your password will remain unchanged.",
    "",
    "This is an automated message from Hireflow. Please do not reply.",
  ].join("\n");

  const html = buildEmailLayout({
    preheader: `Use this secure password-reset link within ${expiresInMinutes} minutes.`,

    title: "Create a new password",

    greeting: `Hi ${recipientName},`,

    message:
      "We received a request to create a new password for your Hireflow account.",

    actionLabel: "Reset password",

    actionUrl: resetUrl,

    noticeTitle: `This secure link expires in ${expiresInMinutes} minutes.`,

    noticeText: "For your security, this link can only be used once.",

    closingText:
      "If you did not request this, you can safely ignore this email. Your password will remain unchanged.",
  });

  return {
    subject,
    text,
    html,
  };
};

export default buildPasswordResetEmail;
