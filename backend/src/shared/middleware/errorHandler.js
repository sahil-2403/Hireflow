import multer from "multer";
import mongoose from "mongoose";

import ApiError from "../errors/ApiError.js";

const errorHandler = (err, req, res, next) => {
  let error = err;

  if (error?.type === "entity.too.large") {
    error = new ApiError(413, "Request body is too large");
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const errors = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));

    error = new ApiError(400, "Database validation failed", errors);
  }

  if (error instanceof mongoose.Error.CastError) {
    error = new ApiError(400, `Invalid value for ${error.path}`);
  }

  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern || {})[0] || "field";

    error = new ApiError(409, `${field} already exists`);
  }

  if (error instanceof multer.MulterError) {
    error = new ApiError(400, error.message);
  }

  if (error instanceof ApiError) {
    return res.status(error.statusCode).json({
      success: false,
      statusCode: error.statusCode,
      message: error.message,
      errors: error.errors || [],
    });
  }

  console.error("Unexpected error:", error);

  const isDevelopment = process.env.NODE_ENV === "development";

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
    ...(isDevelopment && {
      stack: error.stack,
    }),
  });
};

export default errorHandler;
