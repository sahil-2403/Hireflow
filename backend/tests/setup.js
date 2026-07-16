import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongoServer;

process.env.NODE_ENV = "test";

process.env.ACCESS_TOKEN_SECRET =
  "test-access-token-secret-that-is-long-enough";

process.env.ACCESS_TOKEN_EXPIRY = "15m";

process.env.REFRESH_TOKEN_SECRET =
  "test-refresh-token-secret-that-is-long-enough";

process.env.REFRESH_TOKEN_EXPIRY = "7d";
process.env.REFRESH_TOKEN_EXPIRY_DAYS = "7";

process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_HOURS = "24";
process.env.PASSWORD_RESET_TOKEN_EXPIRY_MINUTES = "15";

process.env.CLIENT_URL = "http://localhost:5173";
process.env.API_BASE_URL = "http://localhost:5000";

process.env.GLOBAL_RATE_LIMIT_WINDOW_MINUTES = "15";
process.env.GLOBAL_RATE_LIMIT_MAX_REQUESTS = "10000";

process.env.AUTH_RATE_LIMIT_WINDOW_MINUTES = "15";
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = "10000";

process.env.AI_ENABLED = "false";
process.env.AI_PROVIDER = "gemini";
process.env.AI_MODEL = "";
process.env.GEMINI_API_KEY = "";
process.env.AI_REQUEST_TIMEOUT_MS = "30000";

process.env.AI_RESUME_ANALYSIS_DAILY_LIMIT = "1";
process.env.AI_JOB_RESUME_FIT_DAILY_LIMIT = "3";
process.env.AI_COMPANY_RESUME_REVIEW_DAILY_LIMIT = "10";
process.env.AI_JOB_POST_SUGGESTION_DAILY_LIMIT = "5";
process.env.AI_INTERVIEW_KIT_DAILY_LIMIT = "10";
process.env.AI_SHORTLIST_DAILY_LIMIT = "3";
process.env.AI_CANDIDATE_COMPARISON_DAILY_LIMIT = "5";

process.env.AI_MAX_SHORTLIST_CANDIDATES = "10";
process.env.AI_MAX_COMPARISON_CANDIDATES = "3";

process.env.GEMINI_API_BASE_URL =
  "https://generativelanguage.googleapis.com/v1beta";

process.env.SMTP_HOST = "smtp.example.com";
process.env.SMTP_PORT = "587";
process.env.SMTP_SECURE = "false";
process.env.SMTP_USER = "test@example.com";
process.env.SMTP_PASSWORD = "test-password";
process.env.EMAIL_FROM = "HireFlow Test <test@example.com>";

process.env.CLOUDINARY_CLOUD_NAME = "test-cloud";
process.env.CLOUDINARY_API_KEY = "test-key";
process.env.CLOUDINARY_API_SECRET = "test-secret";

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();

  const mongoUri = mongoServer.getUri();

  process.env.MONGO_URI = mongoUri;

  await mongoose.connect(mongoUri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;

  for (const collection of Object.values(collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
  await mongoServer.stop();
});
