import { NextFunction, Request, Response } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export function middleware(req: Request, res: Response, next: NextFunction) {
  console.log("middleware ran ======");
  const token = req.headers["authorization"] ?? "";
  const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "") as JwtPayload;

  if (decoded) {
    req.userId = decoded.userId;
    next();
  } else {
    res.status(403).json({
      message: "Unauthorized",
    });
  }
}
