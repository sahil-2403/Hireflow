const requiredEnvVars = [
  "PORT",
  "MONGO_URI",
  "ACCESS_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_SECRET",
  "REFRESH_TOKEN_EXPIRY",
  "API_BASE_URL",
  "CLIENT_URL",
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
  "PASSWORD_RESET_TOKEN_EXPIRY_MINUTES",
  "EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `Missing required environment variables: ${missing.join(", ")}`,
    );
    process.exit(1);
  }
};

export default validateEnv;
