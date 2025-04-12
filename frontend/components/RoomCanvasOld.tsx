"use client";

// import { WS_URL } from "@/config";
// import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { Canvas } from "./Canvas";

export function RoomCanvas({ roomId }: { roomId: string }) {
  const [socket, setSocket] = useState<WebSocket>(
    new WebSocket(
      `${process.env.NEXT_PUBLIC_WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMzVkZWQyYy01ODY5LTQyYzQtYWUzNS0yM2RlOGJlZWQwODUiLCJpYXQiOjE3NDM5MzQzODR9.9X6VU-4mIWXPcEVYg1l2WhInYMQ-_Z6gyjcLQdTO4nM`
    )
  );

  // useEffect(() => {
  //   const ws = new WebSocket(
  //     `${process.env.NEXT_PUBLIC_WS_URL}?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJkMzVkZWQyYy01ODY5LTQyYzQtYWUzNS0yM2RlOGJlZWQwODUiLCJpYXQiOjE3NDM5MzQzODR9.9X6VU-4mIWXPcEVYg1l2WhInYMQ-_Z6gyjcLQdTO4nM`
  //   );

  //   ws.onopen = () => {
  //     setSocket(ws);
  //     const data = JSON.stringify({
  //       type: "join_room",
  //       roomId,
  //     });
  //     console.log(data);
  //     ws.send(data);
  //   };
  // }, []);

  // if (!socket) {
  //   return <div>Connecting to server....</div>;
  // }

  return (
    <div>
      <Canvas roomId={roomId} socket={socket} />
    </div>
  );
}
