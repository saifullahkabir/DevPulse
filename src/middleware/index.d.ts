import type { TAuthUser } from "../types/authUser";

declare global {
  namespace Express {
    interface Request {
      user?: TAuthUser;
    }
  }
}
