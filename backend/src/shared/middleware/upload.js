import multer from "multer";

import ApiError from "../errors/ApiError.js";

const storage = multer.memoryStorage();

const createSingleFileMiddleware = ({
  fieldName,
  allowedMimeTypes,
  maximumSize,
}) => {
  const uploader = multer({
    storage,

    limits: {
      fileSize: maximumSize,
      files: 1,
    },

    fileFilter: (req, file, callback) => {
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(
          new ApiError(400, `Unsupported file type: ${file.mimetype}`),
        );
      }

      callback(null, true);
    },
  }).single(fieldName);

  return (req, res, next) => {
    uploader(req, res, (error) => {
      if (!error) {
        return next();
      }

      if (error instanceof ApiError) {
        return next(error);
      }

      if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
          return next(new ApiError(400, "Uploaded file is too large"));
        }

        if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return next(
            new ApiError(
              400,
              `Unexpected upload field. Expected "${fieldName}"`,
            ),
          );
        }

        return next(new ApiError(400, error.message));
      }

      return next(error);
    });
  };
};

const uploadResume = createSingleFileMiddleware({
  fieldName: "resume",
  allowedMimeTypes: ["application/pdf"],
  maximumSize: 5 * 1024 * 1024,
});

const uploadCompanyLogo = createSingleFileMiddleware({
  fieldName: "logo",
  allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  maximumSize: 2 * 1024 * 1024,
});

export { uploadResume, uploadCompanyLogo };
