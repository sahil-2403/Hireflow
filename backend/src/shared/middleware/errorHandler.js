import ApiError from "../errors/ApiError.js";

const errorHandler = (err, req, res, next) => {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Unexpected errors — don't leak details in production
  console.error("Unexpected error:", err);

  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal server error",
  });
};

export default errorHandler;
