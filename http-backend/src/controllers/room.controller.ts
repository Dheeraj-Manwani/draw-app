import db from "../db/index";
import { CreateRoomSchema } from "../schemas/room";
import { asyncHandler } from "../utils/asyncHandler";
import { createUniqueSlug } from "../services/slugService";
import { NextFunction, Request, Response } from "express";

export const createRoom = asyncHandler(async function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  const parsedData = CreateRoomSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.json({
      message: "Incorrect Inputs",
    });
    return;
  }

  const slug = await createUniqueSlug("room", parsedData.data.name);

  const response = await db.room.create({
    data: {
      adminId: req.userId ?? "",
      name: parsedData.data.name,
      slug: slug,
    },
  });

  res.json({
    roomId: response.id,
    message: "Room created",
  });
});

export const getElements = asyncHandler(async function (req, res) {
  try {
    const roomId = req.params.roomId;
    console.log(req.params.roomId);
    const elements = await db.element.findMany({
      where: {
        roomId: roomId,
      },
      orderBy: {
        id: "desc",
      },
      take: 1000,
    });

    res.json({
      elements,
    });
  } catch (e) {
    console.log(e);
    res.json({
      elements: [],
    });
  }
});

export const getRoom = asyncHandler(async function (req, res) {
  const slug = req.params.slug;
  const room = await db.room.findFirst({
    where: {
      slug,
    },
  });

  res.json({
    room,
  });
});
