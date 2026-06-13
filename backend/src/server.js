import "dotenv/config";

import validateEnv from "./config/env.js";
validateEnv();

import connectDB from "./config/database.js";
import app from "./app.js";

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`HireFlow server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
