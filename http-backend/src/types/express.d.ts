import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      userId?: string; // or number, depending on your ID type
      user?: JwtPayload; // if you need full decoded token
    }
  }
}
