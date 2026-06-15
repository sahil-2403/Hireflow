import swaggerJsdoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",

  info: {
    title: "HireFlow API",
    version: "1.0.0",
    description:
      "REST API for authentication, company management, jobs, candidates, applications and uploads.",
  },

  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:5000",
      description: "Current API server",
    },
  ],

  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Company" },
    { name: "Jobs" },
    { name: "Candidates" },
    { name: "Applications" },
    { name: "Uploads" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },

    schemas: {
      ApiError: {
        type: "object",
        properties: {
          success: {
            type: "boolean",
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
              type: "object",
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
          },
        },
      },

      Pagination: {
        type: "object",
        properties: {
          page: { type: "integer", example: 1 },
          limit: { type: "integer", example: 10 },
          total: { type: "integer", example: 25 },
          totalPages: {
            type: "integer",
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
  },
};

const swaggerSpec = swaggerJsdoc({
  failOnErrors: true,
  definition: swaggerDefinition,
  apis: ["./src/modules/**/*.routes.js", "./src/app.js"],
});

export default swaggerSpec;
