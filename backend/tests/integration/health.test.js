import request from "supertest";

import app from "../../src/app.js";

describe("Health and fallback routes", () => {
  test("GET /api/v1/health returns API health information", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.statusCode).toBe(200);
    expect(response.body.message).toBe(
      "HireFlow API is healthy"
    );

    expect(response.body.data).toEqual(
      expect.objectContaining({
        environment: "test",
        uptimeSeconds: expect.any(Number),
        timestamp: expect.any(String),
      })
    );
  });

  test("unknown route returns standardized JSON 404", async () => {
    const response = await request(app)
      .get("/api/v1/does-not-exist")
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      statusCode: 404,
      message:
        "Route not found: GET /api/v1/does-not-exist",
      errors: [],
    });
  });
});