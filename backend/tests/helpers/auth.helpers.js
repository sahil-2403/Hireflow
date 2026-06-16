import request from "supertest";

import app from "../../src/app.js";
import User from "../../src/modules/auth/auth.model.js";

const createVerifiedUser = async ({
  username,
  email,
  password = "Password123",
  role,
  isActive = true,
}) => {
  return User.create({
    username,
    email,
    password,
    role,
    isEmailVerified: true,
    isActive,
  });
};

const loginUser = async ({ email, password = "Password123" }) => {
  const response = await request(app)
    .post("/api/v1/auth/login")
    .send({
      email,
      password,
    })
    .expect(200);

  return response.body.data;
};

const authHeader = (accessToken) => ({
  Authorization: `Bearer ${accessToken}`,
});

export { createVerifiedUser, loginUser, authHeader };
