import { Router } from "express";
import { signinUser, signupUser } from "../controllers/user.controller";

const router = Router();

router.post("/signup", signupUser);
router.post("/signin", signinUser);

export const userRouter: Router = router;
