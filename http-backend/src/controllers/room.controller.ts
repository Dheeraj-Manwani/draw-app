import db from "../db/index";
import { CreateRoomSchema } from "../schemas/room";
import { asyncHandler } from "../utils/asyncHandler";
import { createUniqueSlug } from "../services/slugService";
import { NextFunction, Request, Response } from "express";
// import "@types/express"; // Import type definitions

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
      adminId: (req as any).userId ?? "",
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

export const getRooms = asyncHandler(async function (req, res) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = 20;
    const skip = (page - 1) * pageSize;

    // Get rooms where the user is either the admin or a participant
    const drawings = await db.room.findMany({
      where: {
        OR: [
          { adminId: (req as any).userId }, // rooms where user is admin
          { users: { some: { id: (req as any).userId } } }, // rooms where user is participant
        ],
      },
      include: {
        admin: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            elements: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      skip: skip,
      take: pageSize,
    });

    // Get total count for pagination
    const totalCount = await db.room.count({
      where: {
        OR: [
          { adminId: (req as any).userId },
          { users: { some: { id: (req as any).userId } } },
        ],
      },
    });

    const totalPages = Math.ceil(totalCount / pageSize);

    res.json({
      drawings,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching drawings:", error);
    res.status(500).json({
      message: "Error fetching drawings",
      drawings: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalCount: 0,
        pageSize: 20,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });
  }
});
