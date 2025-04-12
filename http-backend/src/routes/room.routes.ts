import { Router } from "express";
import {
  createRoom,
  getElements,
  getRoom,
} from "../controllers/room.controller";
import { middleware } from "../middlewares/auth.middleware";

const router = Router();

router.post("/", middleware, createRoom);

router.get("/elements/:roomId", getElements);

router.get("/room/:slug", getRoom);

export const roomRouter: Router = router;
