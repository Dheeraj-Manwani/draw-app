import { NextFunction, Request, Response } from "express";
import { verifyToken } from "@clerk/express";
import db from "../db/index";

export function middleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.log("middleware ran ======");

  const authHeader = req.headers["authorization"];

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      message: "Authorization header missing or invalid format",
    });
    return;
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  verifyToken(token, {
    secretKey: process.env.CLERK_SECRET_KEY,
  })
    .then(async (payload: any) => {
      if (payload && payload.sub) {
        const clerkUserId = payload.sub;

        try {
          // Check if user exists in local database
          let user = await db.user.findUnique({
            where: { id: clerkUserId },
          });

          // If user doesn't exist, create them
          if (!user) {
            user = await db.user.create({
              data: {
                id: clerkUserId,
                name: payload.name || payload.email || "User",
                email: payload.email || `${clerkUserId}@clerk.local`,
                password: "clerk-user", // Placeholder for Clerk users
                salt: "clerk-salt", // Placeholder for Clerk users
              },
            });
          }

          (req as any).userId = user.id;
          next();
        } catch (dbError) {
          console.error("Database error during user sync:", dbError);
          res.status(500).json({
            message: "Error syncing user data",
          });
        }
      } else {
        res.status(401).json({
          message: "Invalid token payload",
        });
      }
    })
    .catch((error: any) => {
      console.error("Token verification failed:", error);
      res.status(401).json({
        message: "Invalid or expired token",
      });
    });
}
