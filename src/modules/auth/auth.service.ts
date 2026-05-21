import bcrypt from "bcryptjs";
import { pool } from "../../db";
import type { IRegisterUser } from "./auth.interface";
import jwt from "jsonwebtoken";
import config from "../../config";

const registerUserIntoDB = async (payload: IRegisterUser) => {
  const { name, email, password, role } = payload;

  const hashPassword = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    INSERT INTO users(name, email, password, role) VALUES ($1, $2, $3, COALESCE($4, 'contributor'))
    RETURNING *
    `,
    [name, email, hashPassword, role],
  );

  delete result.rows[0].password;

  return result;
};

const loginUserIntoDB = async (payload: {
  email: string;
  password: string;
}) => {
  const { email, password } = payload;

  const userData = await pool.query(
    `
    SELECT * FROM users WHERE email=$1
    `,
    [email],
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }

  const user = userData.rows[0];

  const matchPassword = await bcrypt.compare(password, user.password);

  if (!matchPassword) {
    throw new Error("Password not match!");
  }

  const jwtpayload = {
    id: user.id,
    name: user.name,
    role: user.role,
  };

  const accessToken = jwt.sign(jwtpayload, config.jwt_access_secret as string, {
    expiresIn: "7d",
  });

  delete user.password;

  return {
    token: accessToken,
    user: user,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUserIntoDB,
};
