import bcrypt from "bcryptjs";

const hashPassword = async (plainPassword) => {
  return await bcrypt.hash(plainPassword, 12);
};

const comparePassword = async (plainPassword, hashedPassword) => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

export { hashPassword, comparePassword };
