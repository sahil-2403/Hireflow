import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import authRouter from "./modules/auth/auth.routes.js";
import companyRouter from "./modules/company/company.routes.js";
import jobRouter from "./modules/job/job.routes.js";
import candidateRouter from "./modules/candidate/candidate.routes.js";
import applicationRouter from "./modules/application/application.routes.js";
import analyticsRouter from "./modules/analytics/analytics.routes.js";
import recommendationRouter from "./modules/recommendation/recommendation.routes.js";
import aiRouter from "./modules/ai/ai.routes.js";

import swaggerSpec from "./config/swagger.js";

import { globalLimiter } from "./shared/middleware/rateLimiters.js";
import { csrfProtection } from "./shared/security/csrf.js";

import notFound from "./shared/middleware/notFound.js";
import errorHandler from "./shared/middleware/errorHandler.js";

const app = express();

app.disable("x-powered-by");

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production" ? undefined : false,
  }),
);

app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  }),
);

app.use(
  express.json({
    limit: "1mb",
  }),
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "1mb",
  }),
);

app.use(cookieParser());

app.use(csrfProtection);

app.use(
  process.env.NODE_ENV === "production" ? morgan("combined") : morgan("dev"),
);

app.use(globalLimiter);

/**
 * @openapi
 * /api/v1/health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Check API health
 *     responses:
 *       200:
 *         description: API is operational
 */
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    statusCode: 200,
    success: true,
    message: "HireFlow API is healthy",
    data: {
      environment: process.env.NODE_ENV,
      uptimeSeconds: Math.floor(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
});

app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "HireFlow API Documentation",
  }),
);

app.get("/api-docs.json", (req, res) => {
  res.status(200).json(swaggerSpec);
});

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/company", companyRouter);
app.use("/api/v1/jobs", jobRouter);
app.use("/api/v1/candidates", candidateRouter);
app.use("/api/v1/applications", applicationRouter);
app.use("/api/v1/analytics", analyticsRouter);
app.use("/api/v1/recommendations", recommendationRouter);
app.use("/api/v1/ai", aiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
