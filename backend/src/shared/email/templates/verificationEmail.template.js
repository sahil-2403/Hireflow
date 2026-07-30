import buildEmailLayout from "../emailLayout.js";

import { normalizeRecipientName } from "../email.utils.js";

const buildVerificationEmail = ({
  username,
  verificationUrl,
  expiresInHours,
}) => {
  const recipientName = normalizeRecipientName(username);

  const subject = "Finish setting up your Hireflow account";

  const text = [
    `Hi ${recipientName},`,
    "",
    "Thanks for signing up with Hireflow.",
    "Use the secure link below to activate your account:",
    "",
    verificationUrl,
    "",
    `This link expires in ${expiresInHours} hours and can only be used once.`,
    "",
    "This is an automated message from Hireflow. Please do not reply.",
  ].join("\n");

  const html = buildEmailLayout({
    preheader: "Use the secure link to activate your Hireflow account.",

    title: "Confirm your email to get started",

    greeting: `Hi ${recipientName},`,

    message:
      "Thanks for signing up with Hireflow. Activate your account using the secure button below.",

    actionLabel: "Confirm my email",

    actionUrl: verificationUrl,

    noticeTitle: `This secure link expires in ${expiresInHours} hours.`,

    noticeText: "For your security, this link can only be used once.",
  });

  return {
    subject,
    text,
    html,
  };
};

export default buildVerificationEmail;
