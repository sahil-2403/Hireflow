import "dotenv/config";

import connectDB from "../config/database.js";
import User from "../modules/auth/auth.model.js";

import { ROLES } from "../config/constants.js";

const createOwner = async () => {
  try {
    await connectDB();

    const { OWNER_USERNAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;

    if (!OWNER_USERNAME || !OWNER_EMAIL || !OWNER_PASSWORD) {
      throw new Error(
        "OWNER_USERNAME, OWNER_EMAIL and OWNER_PASSWORD are required",
      );
    }

    const existingOwner = await User.findOne({
      $or: [
        {
          role: ROLES.OWNER,
        },
        {
          email: OWNER_EMAIL.toLowerCase(),
        },
        {
          username: OWNER_USERNAME.toLowerCase(),
        },
      ],
    });

    if (existingOwner) {
      throw new Error("An owner or matching account already exists");
    }

    await User.create({
      username: OWNER_USERNAME,
      email: OWNER_EMAIL,
      password: OWNER_PASSWORD,
      role: ROLES.OWNER,
      isEmailVerified: true,
      isActive: true,
    });

    console.log("Company owner created successfully");
    process.exit(0);
  } catch (error) {
    console.error("Owner creation failed:", error.message);

    process.exit(1);
  }
};

createOwner();
