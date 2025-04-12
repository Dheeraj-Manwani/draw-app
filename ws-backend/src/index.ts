import { Redis } from "ioredis";
import { WebSocket, WebSocketServer } from "ws";
import jwt from "jsonwebtoken";
import db from "./db";
import dotenv from "dotenv";
import bullmq, { Queue } from "bullmq";

dotenv.config();

const wss = new WebSocketServer({ port: 8080 });

interface User {
  ws: WebSocket;
  rooms: string[];
  userId: string;
}

const users: User[] = [];

// const connectionDetails = new Redis({
//   maxRetriesPerRequest: null,
//   host: process.env.REDIS_HOST,
//   port: Number(process.env.REDIS_PORT)!,
//   username: process.env.REDIS_USERNAME, // usually 'default' for Aiven
//   password: process.env.REDIS_PASSWORD,
//   tls: {}, // this enables TLS (rediss://)
// });

function checkUser(token: string): string | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET ?? "");

    if (typeof decoded == "string") {
      return null;
    }

    if (!decoded || !decoded.userId) {
      return null;
    }

    return decoded.userId;
  } catch (e) {
    console.log(e);
    return null;
  }
}

wss.on("connection", function connection(ws, request) {
  // const token = request.headers["authorization"];
  // if (!token) return ws.close();
  // const userId = checkUser(token);

  const url = request.url;
  if (!url) {
    return;
  }
  const queryParams = new URLSearchParams(url.split("?")[1]);
  const token = queryParams.get("token") || "";
  const userId = checkUser(token);

  if (userId == null) {
    ws.close();
    return null;
  }

  users.push({
    userId,
    rooms: [],
    ws,
  });

  ws.on("message", async function message(data) {
    let parsedData;
    if (typeof data !== "string") {
      parsedData = JSON.parse(data.toString());
    } else {
      parsedData = JSON.parse(data);
    }

    if (parsedData.type === "join_room") {
      const user = users.find((x) => x.ws === ws);
      user?.rooms.push(parsedData.roomId);
    }

    if (parsedData.type === "leave_room") {
      const user = users.find((x) => x.ws === ws);
      if (!user) {
        return;
      }
      user.rooms = user?.rooms.filter((x) => x === parsedData.room);
    }

    console.log("message received");
    console.log(parsedData);

    if (parsedData.type === "create_element") {
      const roomId = parsedData.roomId;
      const path = parsedData.path;
      const elementid = parsedData.id;
      try {
        await db.element.create({
          data: {
            id: elementid,
            roomId: roomId,
            type: parsedData.elementType,
            path,
            userId,
          },
        });

        users.forEach((user) => {
          if (user.rooms.includes(roomId)) {
            if (user.userId === userId) return;

            user.ws.send(
              JSON.stringify({
                type: "create_element",
                id: elementid,
                elementType: parsedData.elementType,
                path: path,
                roomId,
              })
            );
          }
        });
      } catch (e) {
        console.log("error occured", e);
      }
    }

    if (parsedData.type === "update_element") {
      const roomId = parsedData.roomId;
      const path = parsedData.path;
      const elementid = parsedData.id;
      try {
        await db.element.update({
          data: {
            path,
          },
          where: {
            id: elementid,
          },
        });

        users.forEach((user) => {
          if (user.rooms.includes(roomId)) {
            if (user.userId === userId) return;

            user.ws.send(
              JSON.stringify({
                type: "update_element",
                id: elementid,
                path: path,
              })
            );
          }
        });
      } catch (e) {
        console.log("error occured", e);
      }
    }

    // if (parsedData.type === "test_redis") {
    //   const myQueue = new Queue(process.env.QUEUE_NAME!, {
    //     connection: connectionDetails,
    //   });

    //   async function addJobs() {
    //     await myQueue.add("myJobName", { foo: "bar" });
    //     await myQueue.add("myJobName", { qux: "baz" });
    //   }

    //   await addJobs();
    // }
  });
});
