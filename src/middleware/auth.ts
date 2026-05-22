import jwt from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
import sendResponse from "../utils/sendResponse";
import { StatusCodes } from "http-status-codes";
import config from "../config";
import { pool } from "../db";
import type { Role } from "../enums/role.enum";
import type { TAuthUser } from "../types/authUser";

const auth = (...roles: Role[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = req.headers.authorization;

      //* check token
      if (!token) {
        return sendResponse(res, {
          statusCode: StatusCodes.UNAUTHORIZED,
          success: false,
          message: "Unauthorized access!",
        });
      }

      //* verify token
      const decoded = jwt.verify(
        token,
        config.jwt_access_secret as string,
      ) as TAuthUser;

      //   console.log(decoded);
      //* check user is exists in db
      const userData = await pool.query(
        `
        SELECT id, name, email, role FROM users WHERE id=$1
        `,
        [decoded.id],
      );

      //* if user not exists
      if (userData.rows.length === 0) {
        return sendResponse(res, {
          statusCode: StatusCodes.NOT_FOUND,
          success: false,
          message: "User not found!",
        });
      }

      const user = userData.rows[0];

      //* role check
      if (roles.length && !roles.includes(user.role as Role)) {
        return sendResponse(res, {
          statusCode: StatusCodes.FORBIDDEN,
          success: false,
          message: "Forbidden access",
        });
      }

      req.user = decoded;

      next();
    } catch (error: unknown) {
      if (error instanceof jwt.JsonWebTokenError) {
        return sendResponse(res, {
          statusCode: StatusCodes.UNAUTHORIZED,
          success: false,
          message: "Invalid token!",
          error: error,
        });
      }

      if (error instanceof jwt.TokenExpiredError) {
        return sendResponse(res, {
          statusCode: StatusCodes.UNAUTHORIZED,
          success: false,
          message: "Token expired!",
          error: error,
        });
      }

      next(error);
    }
  };
};

export default auth;
