import db from "../db/index";
import { CreateUserSchema, SignInSchema } from "../schemas/user";
import { asyncHandler } from "../utils/asyncHandler";
import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { generateSalt, hashPassword } from "../utils/auth";

export const signupUser = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const zodRes = CreateUserSchema.safeParse(req.body);
  if (!zodRes.success) {
    console.log(zodRes.error);
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }
  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(zodRes.data.password, salt);

    const response = await db.user.create({
      data: {
        name: zodRes.data.name,
        email: zodRes.data.email,
        password: hashedPassword,
        salt: salt,
      },
    });
    const token = jwt.sign(
      { userId: response?.id! },
      process.env.JWT_SECRET ?? ""
    );

    res.json({
      token,
    });
    return;
  } catch (e) {
    console.log(e);
    res.json({
      message: "Unable to sign up",
    });
  }
});

export const signinUser = asyncHandler(async function (req, res, next) {
  const parsedData = SignInSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }

  const response = await db.user.findFirst({
    where: {
      email: parsedData.data.email,
    },
  });

  if (!response || !response.id) {
    res.status(403).json({
      message: "User with this email does not exists",
    });
    return;
  }

  const givenHash = await hashPassword(parsedData.data.password, response.salt);
  if (givenHash == response.password) {
    console.log("JWT_SECRET ", process.env.JWT_SECRET);
    const token = jwt.sign(
      { userId: response?.id! },
      process.env.JWT_SECRET ?? ""
    );

    res.json({ token });
    return;
  }
  res.status(401).json({
    message: "Entered password is incorrect.",
  });
  return;
});
