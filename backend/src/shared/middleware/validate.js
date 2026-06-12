import { ZodError } from "zod";
import ApiError from "../errors/ApiError.js";

const validate = (schema) => {
  return (req, res, next) => {
    try {
      const validatedData = schema.parse(req.body);

      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));

        return next(new ApiError(400, "Validation failed", errors));
      }

      next(error);
    }
  };
};

export default validate;
