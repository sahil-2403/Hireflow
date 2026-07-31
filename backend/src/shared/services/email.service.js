const BREVO_EMAIL_API_URL = "https://api.brevo.com/v3/smtp/email";

const EMAIL_REQUEST_TIMEOUT_MS = 15000;

const createEmailDeliveryError = (message, statusCode = null) => {
  const error = new Error(message);

  error.name = "EmailDeliveryError";
  error.statusCode = statusCode;

  return error;
};

const getEmailConfiguration = () => {
  const configuration = {
    apiKey: process.env.BREVO_API_KEY,
    senderName: process.env.EMAIL_FROM_NAME,
    senderEmail: process.env.EMAIL_FROM_ADDRESS,
  };

  const missingFields = Object.entries(configuration)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw createEmailDeliveryError(
      `Missing email configuration: ${missingFields.join(", ")}`,
    );
  }

  return configuration;
};

const normalizeRecipients = (to) => {
  const recipients = Array.isArray(to) ? to : [to];

  return recipients.map((recipient) => {
    if (typeof recipient === "string") {
      return {
        email: recipient,
      };
    }

    return {
      email: recipient.email,

      ...(recipient.name
        ? {
            name: recipient.name,
          }
        : {}),
    };
  });
};

const sendEmail = async ({ to, subject, text, html, attachments = [] }) => {
  const { apiKey, senderName, senderEmail } = getEmailConfiguration();

  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, EMAIL_REQUEST_TIMEOUT_MS);

  try {
    const requestBody = {
      sender: {
        name: senderName,
        email: senderEmail,
      },

      to: normalizeRecipients(to),

      subject,
      htmlContent: html,
      textContent: text,

      ...(attachments.length > 0
        ? {
            attachment: attachments,
          }
        : {}),
    };

    const response = await fetch(BREVO_EMAIL_API_URL, {
      method: "POST",

      headers: {
        accept: "application/json",
        "content-type": "application/json",
        "api-key": apiKey,
      },

      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    const responseBody = await response.json().catch(() => null);

    if (!response.ok) {
      throw createEmailDeliveryError(
        responseBody?.message ||
          `Brevo email request failed with status ${response.status}`,
        response.status,
      );
    }

    return responseBody;
  } catch (error) {
    if (error.name === "EmailDeliveryError") {
      throw error;
    }

    if (error.name === "AbortError") {
      throw createEmailDeliveryError("Brevo email request timed out");
    }

    throw createEmailDeliveryError(
      error.message || "Failed to send email through Brevo",
    );
  } finally {
    clearTimeout(timeoutId);
  }
};

export default sendEmail;
