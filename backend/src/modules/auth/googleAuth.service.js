import { OAuth2Client } from "google-auth-library";

import ApiError from "../../shared/errors/ApiError.js";

const googleClient = new OAuth2Client();

const verifyGoogleCredential = async (credential) => {
  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.sub || !payload?.email || payload.email_verified !== true) {
      throw new Error("Incomplete Google identity payload");
    }

    return {
      googleId: payload.sub,
      email: payload.email.trim().toLowerCase(),
      name: payload.name?.trim() || "",
      profilePhotoUrl: payload.picture?.trim() || null,
    };
  } catch {
    throw new ApiError(401, "Google authentication failed");
  }
};

export { verifyGoogleCredential };
