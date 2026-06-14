import { z } from "zod";

import { APPLICATION_STATUS } from "../../config/constants.js";

export const applyToJobSchema = z.object({
  coverLetter: z
    .union([z.string().trim().max(5000), z.literal(""), z.null()])
    .optional()
    .transform((value) => value || null),
});

export const updateApplicationStatusSchema = z.object({
  status: z.enum(Object.values(APPLICATION_STATUS)),
});
