import { Router } from "express";
import {
  createRoom,
  getElements,
  getRoom,
  getRooms,
} from "../controllers/room.controller";
import { middleware } from "../middlewares/auth.middleware";

const router = Router();
router.get("/", middleware, getRooms);

router.post("/", middleware, createRoom);

router.get("/elements/:roomId", getElements);

router.get("/room/:slug", getRoom);

export const roomRouter: Router = router;
