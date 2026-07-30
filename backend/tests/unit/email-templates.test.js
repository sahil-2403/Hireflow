import { describe, expect, test } from "vitest";

import buildVerificationEmail from "../../src/shared/email/templates/verificationEmail.template.js";

import buildPasswordResetEmail from "../../src/shared/email/templates/passwordResetEmail.template.js";

describe("Email templates", () => {
  test("builds a responsive verification email", () => {
    const verificationUrl = "https://hireflow.example/verify-email/test-token";

    const email = buildVerificationEmail({
      username: '<script>alert("unsafe")</script>',

      verificationUrl,
      expiresInHours: 24,
    });

    expect(email.subject).toBe("Finish setting up your Hireflow account");

    expect(email.text).toContain(verificationUrl);

    expect(email.html).toContain("cid:hireflow-brand-logo");

    expect(email.html).toContain("@media only screen and (max-width: 620px)");

    expect(email.html).toContain("max-width:600px");

    expect(email.html).toContain("Confirm my email");

    expect(email.html).toContain("&lt;script&gt;");

    expect(email.html).not.toContain('<script>alert("unsafe")</script>');
  });

  test("builds a responsive password-reset email", () => {
    const resetUrl = "https://hireflow.example/reset-password/test-token";

    const email = buildPasswordResetEmail({
      username: "Sahil",
      resetUrl,
      expiresInMinutes: 15,
    });

    expect(email.subject).toBe("Reset your Hireflow password");

    expect(email.text).toContain(resetUrl);

    expect(email.html).toContain("Create a new password");

    expect(email.html).toContain("Reset password");

    expect(email.html).toContain("This secure link expires in 15 minutes.");

    expect(email.html).toContain("Your password will remain unchanged.");
  });
});
