import path from "node:path";
import { fileURLToPath } from "node:url";

import swaggerJsdoc from "swagger-jsdoc";

const LOCAL_SERVER_URL = "http://localhost:5000";

const normalizeServerUrl = (url) => {
  return url.replace(/\/+$/, "");
};

const configuredServerUrl = normalizeServerUrl(
  process.env.API_BASE_URL || LOCAL_SERVER_URL,
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

const swaggerDefinition = {
  openapi: "3.0.3",

  info: {
    title: "Hireflow API",
    version: "1.0.0",

    description: `
REST API for the Hireflow hiring platform.

Hireflow supports candidates, company administrators, and recruiters
through job discovery, application management, hiring workflows,
analytics, recommendations, media uploads, and AI-assisted recruitment.

## Authentication

Hireflow uses HttpOnly access-token and refresh-token cookies.

The API does not expect JWT access tokens in local storage or in the
Authorization header.

A successful login sets the authentication cookies automatically.
The browser sends the access-token cookie with protected requests.

## CSRF protection

Every POST, PUT, PATCH, and DELETE request requires an
\`X-CSRF-Token\` header.

Obtain a token from:

\`GET /api/v1/auth/csrf-token\`

Send the returned token using:

\`X-CSRF-Token: <token>\`

The header value must match the CSRF cookie created by the API.

## Roles

- \`candidate\`
- \`owner\` — displayed as company admin in the user interface
- \`recruiter\`

Each protected operation documents its permitted roles.
    `.trim(),
  },

  servers,

  tags: [
    {
      name: "Health",
      description: "API availability and runtime health",
    },
    {
      name: "Auth",
      description:
        "Registration, authentication, sessions, verification, password recovery, and profile photos",
    },
    {
      name: "Company",
      description: "Company profiles, branding, and recruiter administration",
    },
    {
      name: "Company Members",
      description: "Owner and recruiter company-member profiles",
    },
    {
      name: "Jobs",
      description: "Public job discovery and company job management",
    },
    {
      name: "Candidates",
      description: "Candidate profiles and resume management",
    },
    {
      name: "Applications",
      description: "Job applications and company hiring workflows",
    },
    {
      name: "Uploads",
      description: "Profile photos, company logos, and candidate resumes",
    },
    {
      name: "Analytics",
      description: "Candidate and company dashboard analytics",
    },
    {
      name: "Recommendations",
      description: "Deterministic job recommendations and match explanations",
    },
    {
      name: "AI",
      description: "AI-assisted resume analysis and recruitment workflows",
    },
  ],

  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",

        name: process.env.ACCESS_TOKEN_COOKIE_NAME || "hireflow_access_token",

        description:
          "HttpOnly access-token cookie set by the login and refresh endpoints. The cookie is managed automatically by the browser and cannot be entered manually through Swagger UI.",
      },

      refreshCookieAuth: {
        type: "apiKey",
        in: "cookie",

        name: process.env.REFRESH_TOKEN_COOKIE_NAME || "hireflow_refresh_token",

        description:
          "HttpOnly refresh-token cookie set by login and rotated by the refresh endpoint. It is scoped to /api/v1/auth and managed automatically by the browser.",
      },

      csrfToken: {
        type: "apiKey",
        in: "header",
        name: "X-CSRF-Token",

        description:
          "CSRF token returned by GET /api/v1/auth/csrf-token. Required for POST, PUT, PATCH, and DELETE requests.",
      },
    },

    schemas: {
      ObjectId: {
        type: "string",
        pattern: "^[a-fA-F0-9]{24}$",
        example: "507f1f77bcf86cd799439011",
        description:
          "MongoDB ObjectId represented as a 24-character hexadecimal string",
      },

      Role: {
        type: "string",

        enum: ["candidate", "owner", "recruiter"],

        example: "candidate",

        description:
          "Hireflow account role. The owner role is displayed as company admin in the user interface.",
      },

      AuthUser: {
        type: "object",

        required: ["id", "username", "email", "role", "profilePhotoUrl"],

        properties: {
          id: {
            $ref: "#/components/schemas/ObjectId",
          },

          username: {
            type: "string",
            example: "sahil_24",
          },

          email: {
            type: "string",
            format: "email",
            example: "candidate@example.com",
          },

          role: {
            $ref: "#/components/schemas/Role",
          },

          profilePhotoUrl: {
            type: "string",
            format: "uri",
            nullable: true,
            example:
              "https://res.cloudinary.com/example/image/upload/profile.jpg",
          },
        },
      },

      CsrfTokenData: {
        type: "object",

        required: ["csrfToken"],

        properties: {
          csrfToken: {
            type: "string",
            minLength: 64,
            maxLength: 64,
            example:
              "5d26af9b760b03c33e9948eae1dc6b88eb29304ea5a159ad1d09cb8e4cf9c7af",

            description:
              "Token that must be sent in the X-CSRF-Token header for unsafe requests",
          },
        },
      },

      RegistrationData: {
        type: "object",

        required: ["userId", "email", "role"],

        properties: {
          userId: {
            $ref: "#/components/schemas/ObjectId",
          },

          email: {
            type: "string",
            format: "email",
            example: "candidate@example.com",
          },

          role: {
            type: "string",
            enum: ["candidate", "owner"],
            example: "candidate",
          },
        },
      },

      ValidationIssue: {
        type: "object",

        required: ["field", "message"],

        properties: {
          field: {
            type: "string",
            example: "email",
          },

          message: {
            type: "string",
            example: "Invalid email address",
          },
        },
      },

      ApiSuccess: {
        type: "object",

        required: ["statusCode", "success", "message", "data"],

        properties: {
          statusCode: {
            type: "integer",
            minimum: 200,
            maximum: 399,
            example: 200,
          },

          success: {
            type: "boolean",
            enum: [true],
            example: true,
          },

          message: {
            type: "string",
            example: "Operation completed successfully",
          },

          data: {
            description:
              "Endpoint-specific response payload. It may be null when the operation has no payload.",
            example: {},
          },
        },
      },

      ApiError: {
        type: "object",

        required: ["success", "statusCode", "message", "errors"],

        properties: {
          success: {
            type: "boolean",
            enum: [false],
            example: false,
          },

          statusCode: {
            type: "integer",
            example: 400,
          },

          message: {
            type: "string",
            example: "Validation failed",
          },

          errors: {
            type: "array",

            items: {
              $ref: "#/components/schemas/ValidationIssue",
            },

            example: [
              {
                field: "email",
                message: "Invalid email address",
              },
            ],
          },

          stack: {
            type: "string",

            description: "Development-only stack trace for unexpected errors",
          },
        },
      },

      Pagination: {
        type: "object",

        required: [
          "page",
          "limit",
          "total",
          "totalPages",
          "hasNextPage",
          "hasPreviousPage",
        ],

        properties: {
          page: {
            type: "integer",
            minimum: 1,
            example: 1,
          },

          limit: {
            type: "integer",
            minimum: 1,
            example: 10,
          },

          total: {
            type: "integer",
            minimum: 0,
            example: 25,
          },

          totalPages: {
            type: "integer",
            minimum: 0,
            example: 3,
          },

          hasNextPage: {
            type: "boolean",
            example: true,
          },

          hasPreviousPage: {
            type: "boolean",
            example: false,
          },
        },
      },
    },

    parameters: {
      PageQuery: {
        in: "query",
        name: "page",
        required: false,

        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },

        description: "Requested result page",
      },

      LimitQuery: {
        in: "query",
        name: "limit",
        required: false,

        schema: {
          type: "integer",
          minimum: 1,
          maximum: 50,
          default: 10,
        },

        description: "Maximum number of records returned per page",
      },

      SearchQuery: {
        in: "query",
        name: "search",
        required: false,

        schema: {
          type: "string",
          minLength: 1,
        },

        description: "Text used to filter matching records",
      },

      OrderQuery: {
        in: "query",
        name: "order",
        required: false,

        schema: {
          type: "string",
          enum: ["asc", "desc"],
          default: "desc",
        },

        description: "Result sorting direction",
      },

      JobIdPath: {
        in: "path",
        name: "jobId",
        required: true,

        schema: {
          $ref: "#/components/schemas/ObjectId",
        },

        description: "Job identifier",
      },

      ApplicationIdPath: {
        in: "path",
        name: "applicationId",
        required: true,

        schema: {
          $ref: "#/components/schemas/ObjectId",
        },

        description: "Application identifier",
      },

      RecruiterIdPath: {
        in: "path",
        name: "recruiterId",
        required: true,

        schema: {
          $ref: "#/components/schemas/ObjectId",
        },

        description: "Recruiter user identifier",
      },
    },

    responses: {
      BadRequest: {
        description: "The submitted request is invalid",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 400,
              message: "Validation failed",
              errors: [
                {
                  field: "email",
                  message: "Invalid email address",
                },
              ],
            },
          },
        },
      },

      Unauthorized: {
        description: "A valid authenticated session is required",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 401,
              message: "Authentication token missing",
              errors: [],
            },
          },
        },
      },

      Forbidden: {
        description:
          "The request is forbidden because of role restrictions, account state, or invalid CSRF protection",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            examples: {
              insufficientRole: {
                summary: "Insufficient role",
                value: {
                  success: false,
                  statusCode: 403,
                  message: "You are not authorized to perform this action",
                  errors: [],
                },
              },

              invalidCsrfToken: {
                summary: "Invalid CSRF token",
                value: {
                  success: false,
                  statusCode: 403,
                  message: "Invalid CSRF token",
                  errors: [],
                },
              },
            },
          },
        },
      },

      NotFound: {
        description: "The requested resource was not found",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 404,
              message: "Resource not found",
              errors: [],
            },
          },
        },
      },

      Conflict: {
        description: "The request conflicts with an existing resource or state",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 409,
              message: "Resource already exists",
              errors: [],
            },
          },
        },
      },

      PayloadTooLarge: {
        description:
          "The JSON or URL-encoded request body exceeds the permitted size",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 413,
              message: "Request body is too large",
              errors: [],
            },
          },
        },
      },

      TooManyRequests: {
        description: "The applicable request or usage limit has been reached",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 429,
              message: "Too many requests. Please try again later.",
              errors: [],
            },
          },
        },
      },

      ServiceUnavailable: {
        description:
          "A required external service or AI capability is currently unavailable",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 503,
              message: "Service is currently unavailable",
              errors: [],
            },
          },
        },
      },

      InternalServerError: {
        description: "An unexpected server error occurred",

        content: {
          "application/json": {
            schema: {
              $ref: "#/components/schemas/ApiError",
            },

            example: {
              success: false,
              statusCode: 500,
              message: "Internal server error",
              errors: [],
            },
          },
        },
      },
    },
  },
};

const currentFilePath = fileURLToPath(import.meta.url);

const currentDirectory = path.dirname(currentFilePath);

const toGlobPath = (...segments) => {
  return path
    .resolve(...segments)
    .split(path.sep)
    .join("/");
};

const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,

  definition: swaggerDefinition,

  apis: [
    toGlobPath(currentDirectory, "../modules/**/*.routes.js"),

    toGlobPath(currentDirectory, "../app.js"),
  ],
});

export default swaggerSpec;
