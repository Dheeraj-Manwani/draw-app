// import { initDraw } from "@/draw";
import { useEffect, useRef, useState } from "react";
import { Game } from "@/canvas/Canvas";
import { ElementType } from "@/types/elements";
import { Toolbar } from "./Toolbar";

export function Canvas({
  roomId,
  socket,
}: {
  socket: WebSocket;
  roomId: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [game, setGame] = useState<Game>();
  const [selectedTool, setSelectedTool] = useState<ElementType>(
    ElementType.CIRCLE
  );

  useEffect(() => {
    game?.setTool(selectedTool);
  }, [selectedTool, game]);

  useEffect(() => {
    if (canvasRef.current) {
      const g = new Game(canvasRef.current, roomId, socket);
      setGame(g);

      return () => {
        g.destroy();
      };
    }
  }, [canvasRef]);

  return (
    <div
      style={{
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={canvasRef}
        // width={window.innerWidth}
        // height={window.innerHeight}
      ></canvas>
      <Toolbar setSelectedTool={setSelectedTool} selectedTool={selectedTool} />
    </div>
  );
}
