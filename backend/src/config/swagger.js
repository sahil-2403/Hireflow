import path from "node:path";
import { fileURLToPath } from "node:url";

import swaggerJsdoc from "swagger-jsdoc";

const LOCAL_SERVER_URL = "http://localhost:5000";
const configuredServerUrl = (process.env.API_BASE_URL || LOCAL_SERVER_URL).replace(
  /\/+$/,
  "",
);

const servers = [
  {
    url: configuredServerUrl,
    description:
      process.env.NODE_ENV === "production"
        ? "Production API server"
        : "Current API server",
  },
];

if (configuredServerUrl !== LOCAL_SERVER_URL) {
  servers.push({
    url: LOCAL_SERVER_URL,
    description: "Local development API server",
  });
}

const errorResponse = (description) => ({
  description,
  content: {
    "application/json": {
      schema: {
        $ref: "#/components/schemas/ApiError",
      },
    },
  },
});

const swaggerDefinition = {
  openapi: "3.0.3",
  info: {
    title: "Hireflow API",
    version: "1.0.0",
    description:
      "REST API documentation for Hireflow. Authentication uses HttpOnly cookies and unsafe requests require the X-CSRF-Token header.",
  },
  servers,
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Company" },
    { name: "Company Members" },
    { name: "Jobs" },
    { name: "Candidates" },
    { name: "Applications" },
    { name: "Uploads" },
    { name: "Analytics" },
    { name: "Recommendations" },
    { name: "AI" },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: process.env.ACCESS_TOKEN_COOKIE_NAME || "hireflow_access_token",
      },
      refreshCookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: process.env.REFRESH_TOKEN_COOKIE_NAME || "hireflow_refresh_token",
      },
      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",
      },
    },
    schemas: {
      ObjectId: {
        type: "string",
        pattern: "^[a-fA-F0-9]{24}$",
        example: "507f1f77bcf86cd799439011",
      },
      Role: {
        type: "string",
        enum: ["candidate", "owner", "recruiter"],
      },
      AuthUser: {
        type: "object",
        properties: {
          id: { $ref: "#/components/schemas/ObjectId" },
          username: { type: "string" },
          email: { type: "string", format: "email" },
          role: { $ref: "#/components/schemas/Role" },
          profilePhotoUrl: {
            type: "string",
            format: "uri",
            nullable: true,
          },
        },
      },
      CsrfTokenData: {
        type: "object",
        properties: {
          csrfToken: { type: "string" },
        },
      },
      RegistrationData: {
        type: "object",
        properties: {
          userId: { $ref: "#/components/schemas/ObjectId" },
          email: { type: "string", format: "email" },
          role: { type: "string", enum: ["candidate", "owner"] },
        },
      },
      ValidationIssue: {
        type: "object",
        properties: {
          field: { type: "string" },
          message: { type: "string" },
        },
      },
      ApiSuccess: {
        type: "object",
        properties: {
          statusCode: { type: "integer" },
          success: { type: "boolean", example: true },
          message: { type: "string" },
          data: {},
        },
      },
      ApiError: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          statusCode: { type: "integer" },
          message: { type: "string" },
          errors: {
            type: "array",
            items: { $ref: "#/components/schemas/ValidationIssue" },
          },
        },
      },
      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer" },
          limit: { type: "integer" },
          total: { type: "integer" },
          totalPages: { type: "integer" },
          hasNextPage: { type: "boolean" },
          hasPreviousPage: { type: "boolean" },
        },
      },
    },
    parameters: {
      PageQuery: {
        in: "query",
        name: "page",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      LimitQuery: {
        in: "query",
        name: "limit",
        schema: { type: "integer", minimum: 1, maximum: 50, default: 10 },
      },
      SearchQuery: {
        in: "query",
        name: "search",
        schema: { type: "string" },
      },
      OrderQuery: {
        in: "query",
        name: "order",
        schema: { type: "string", enum: ["asc", "desc"], default: "desc" },
      },
      JobIdPath: {
        in: "path",
        name: "jobId",
        required: true,
        schema: { $ref: "#/components/schemas/ObjectId" },
      },
      ApplicationIdPath: {
        in: "path",
        name: "applicationId",
        required: true,
        schema: { $ref: "#/components/schemas/ObjectId" },
      },
      RecruiterIdPath: {
        in: "path",
        name: "recruiterId",
        required: true,
        schema: { $ref: "#/components/schemas/ObjectId" },
      },
    },
    responses: {
      BadRequest: errorResponse("The submitted request is invalid"),
      Unauthorized: errorResponse("Authentication is required"),
      Forbidden: errorResponse("The request is not allowed"),
      NotFound: errorResponse("The requested resource was not found"),
      Conflict: errorResponse("The request conflicts with existing data"),
      PayloadTooLarge: errorResponse("The request payload is too large"),
      TooManyRequests: errorResponse("The request limit has been reached"),
      ServiceUnavailable: errorResponse("A required service is unavailable"),
      InternalServerError: errorResponse("An unexpected server error occurred"),
    },
  },
};

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const toGlobPath = (...segments) =>
  path.resolve(...segments).split(path.sep).join("/");

const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: swaggerDefinition,
  apis: [
    toGlobPath(currentDirectory, "../modules/**/*.routes.js"),
    toGlobPath(currentDirectory, "../app.js"),
  ],
});

export default swaggerSpec;
