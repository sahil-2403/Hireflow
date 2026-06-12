import express from "express";
import cors from "cors";
import morgan from "morgan";

import errorHandler from "./shared/middleware/errorHandler.js";

import authRouter from "./modules/auth/auth.routes.js";

const app = express();

// Core middleware
app.use(express.json());
app.use(cors());
app.use(morgan("dev"));

app.get("/", (req, res) => {
  res.json({ message: "HireFlow API is running" });
});

app.use("/api/v1/auth", authRouter);
// app.use("/api/v1/company", companyRouter);
// app.use("/api/v1/candidates", candidateRouter);
// app.use("/api/v1/jobs", jobRouter);
// app.use("/api/v1/applications", applicationRouter);

app.use(errorHandler);

export default app;
