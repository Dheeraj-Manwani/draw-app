import { getExistingShapes } from "./http";
import {
  Action,
  CirclePath,
  Coordinate,
  CursorPosition,
  Element,
  LinePath,
  Path,
  RectanglePath,
} from "@/types/elements";
import { ElementType } from "@/types/elements";
import {
  cursorForPosition,
  getElementAtPosition,
  getResizedPath,
  positionWithinElement,
} from "./util";
import { v4 as uuid } from "uuid";

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private existingElements: Element[];
  private selectedElement: Element | null;
  private roomId: string;
  private action: Action;
  private startX = 0;
  private startY = 0;
  private endX = 0;
  private endY = 0;
  private selectedTool: ElementType;
  private elementOffset: { start: Coordinate; end?: Coordinate };

  socket: WebSocket;

  constructor(canvas: HTMLCanvasElement, roomId: string, socket: WebSocket) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.existingElements = [];
    this.selectedElement = null;
    this.roomId = roomId;
    this.socket = socket;
    this.action = Action.None;
    this.init();
    this.initHandlers();
    this.initMouseHandlers();
    this.selectedTool = ElementType.CURSOR;
    this.elementOffset = { start: { x: 0, y: 0 } };
  }

  destroy() {
    this.canvas.removeEventListener("mousedown", this.mouseDownHandler);

    this.canvas.removeEventListener("mouseup", this.mouseUpHandler);

    this.canvas.removeEventListener("mousemove", this.mouseMoveHandler);
  }

  setTool(tool: ElementType) {
    this.selectedTool = tool;
  }

  async init() {
    this.existingElements = await getExistingShapes(this.roomId);
    console.log(this.existingElements);
    this.clearCanvas();
  }

  initHandlers() {
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type == "create_element") {
        const parsedPath = JSON.parse(data.path);
        this.existingElements.push({
          id: data.id,
          type: data.elementType,
          path: parsedPath,
        });
        this.clearCanvas();
      }

      if (data.type === "update_element") {
        const parsedPath = JSON.parse(data.path);
        const newElements = this.existingElements.map((el) => {
          if (el.id === data.id) {
            return { ...el, path: parsedPath };
          }
          return el;
        });
        this.existingElements = newElements;
      }
    };
  }

  clearCanvas() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = "rgba(0, 0, 0)";
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.existingElements.map((shape) => {
      if (shape.type === ElementType.RECTANGLE) {
        const path = shape.path as RectanglePath;
        this.ctx.strokeStyle = "rgba(255, 255, 255)";
        this.ctx.strokeRect(path.startX, path.startY, path.width, path.height);
      } else if (shape.type === ElementType.CIRCLE) {
        const path = shape.path as CirclePath;

        console.log(shape);
        this.ctx.beginPath();
        this.ctx.arc(
          path.startX,
          path.startY,
          Math.abs(path.radius),
          0,
          Math.PI * 2
        );
        this.ctx.stroke();
        this.ctx.closePath();
      } else if (shape.type === ElementType.LINE) {
        const path = shape.path as LinePath;
        this.ctx.beginPath();
        this.ctx.moveTo(path.startX, path.startY);
        this.ctx.lineTo(path.endX, path.endY);
        this.ctx.stroke();
        this.ctx.closePath();
      }
    });
  }

  createElement(
    type: ElementType,
    startX: number,
    startY: number,
    currX: number,
    currY: number,
    width: number,
    height: number
  ): Path | null {
    if (type === ElementType.RECTANGLE) {
      this.ctx.strokeRect(startX, startY, width, height);
      return { startX, startY, width, height };
    } else if (type === ElementType.CIRCLE) {
      const radius = Math.max(width, height) / 2;
      const x = startX + radius;
      const y = startY + radius;
      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.abs(radius), 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.closePath();
      return { startX: x, startY: y, radius: Math.abs(radius) };
    } else if (type === ElementType.LINE) {
      this.endX = currX;
      this.endY = currY;
      this.ctx.beginPath();
      this.ctx.moveTo(startX, startY);
      this.ctx.lineTo(currX, currY);
      this.ctx.stroke();
      return { startX, startY, endX: currX, endY: currY };
    }
    return null;
  }

  updateElement(currX: number, currY: number) {
    let elementsCopy = [...this.existingElements];
    const currElement = { ...this.selectedElement };

    if (!currElement || !currElement.id) return;
    const newStartX = currX - this.elementOffset.start.x;
    const newStartY = currY - this.elementOffset.start.y;

    let newPath;
    switch (currElement.type) {
      case ElementType.RECTANGLE:
        const rectPath = currElement.path as RectanglePath;
        newPath = this.createElement(
          currElement.type,
          newStartX,
          newStartY,
          currX,
          currY,
          rectPath.width,
          rectPath.height
        );
        break;
      case ElementType.LINE:
        const linePath = currElement.path as LinePath;
        const newEndX = currX - this.elementOffset.end!.x;
        const newEndY = currY - this.elementOffset.end!.y;
        newPath = this.createElement(
          currElement.type,
          newStartX,
          newStartY,
          newEndX,
          newEndY,
          0,
          0
        );
        break;
      default:
        throw new Error(`Type not recognised: ${currElement.type}`);
    }

    const newElement: Element = {
      id: currElement.id,
      path: newPath!,
      type: currElement.type,
    };

    elementsCopy = elementsCopy.map((el) => {
      if (el.id === currElement.id) return newElement;
      return el;
    });
    this.selectedElement = newElement;
    this.existingElements = elementsCopy;
  }

  resizeElement(currX: number, currY: number) {
    if (!this.selectedElement) return;

    const currElement = { ...this.selectedElement };
    let elementsCopy = [...this.existingElements];

    // if (currElement.type === ElementType.RECTANGLE) {
    // const path = currElement.path as RectanglePath;

    // const newWidth = Math.abs(currX - path.startX);
    // const newHeight = Math.abs(currY - path.startY);

    // const newPath: RectanglePath = {
    //   ...path,
    //   width: newWidth,
    //   height: newHeight,
    // };

    const newPath = getResizedPath(
      currElement.path,
      currElement.position!,
      currX,
      currY
    );

    if (!newPath) return;

    const updatedElement: Element = {
      ...currElement,
      path: newPath,
    };

    elementsCopy = elementsCopy.map((el) =>
      el.id === updatedElement.id ? updatedElement : el
    );

    this.selectedElement = updatedElement;
    this.existingElements = elementsCopy;
    // }

    this.clearCanvas();
  }

  mouseDownHandler = (e: MouseEvent) => {
    // this.action =
    // this.selectedTool === ElementType.CURSOR ? Action.Moving : Action.Drawing;
    this.startX = e.clientX;
    this.startY = e.clientY;
    console.log("mouseDownHandler: this.selectedTool ", this.selectedTool);

    if (this.selectedTool === ElementType.CURSOR) {
      const element = getElementAtPosition(
        this.startX,
        this.startY,
        this.existingElements
      );
      if (!element) return;
      const offsetX = this.startX - element.path.startX;
      const offsetY = this.startY - element.path.startY;
      let elementOffset = {
        start: { x: offsetX, y: offsetY },
        end: { x: 0, y: 0 },
      };

      if (element.type === ElementType.LINE) {
        const endOffsetX = this.startX - element.path.endX!;
        const endOffsetY = this.startY - element.path.endY!;
        elementOffset = {
          start: elementOffset.start,
          end: { x: endOffsetX, y: endOffsetY },
        };
      }

      this.elementOffset = elementOffset;
      console.log("{ x: offsetX, y: offsetY }: ", { x: offsetX, y: offsetY });
      this.selectedElement = element;
      console.log("this.selectedElement: ", this.selectedElement);

      if (element.position === CursorPosition.Inside) {
        this.action = Action.Moving;
      } else {
        this.action = Action.Resizing;
      }
    } else {
      this.action = Action.Drawing;
    }
  };
  mouseUpHandler = (e: MouseEvent) => {
    this.action = Action.None;
    const width = e.clientX - this.startX;
    const height = e.clientY - this.startY;

    const selectedTool = this.selectedTool;
    let element = null;
    if (selectedTool === ElementType.RECTANGLE) {
      element = {
        startX: this.startX,
        startY: this.startY,
        height,
        width,
      };
    } else if (selectedTool === ElementType.CIRCLE) {
      const radius = Math.max(width, height) / 2;
      element = {
        radius: radius,
        startX: this.startX + radius,
        startY: this.startY + radius,
      };
    } else if (selectedTool === ElementType.LINE) {
      element = {
        startX: this.startX,
        startY: this.startY,
        endX: this.endX,
        endY: this.endY,
      };
    } else if (selectedTool === ElementType.CURSOR) {
      this.socket.send(
        JSON.stringify({
          type: "update_element",
          id: this.selectedElement?.id,
          path: JSON.stringify({ ...this.selectedElement?.path }),
          roomId: this.roomId,
          elementType: selectedTool,
        })
      );
    } else {
      return;
    }

    if (!element) {
      return;
    }
    const elementId = uuid();
    this.existingElements.push({
      type: selectedTool,
      path: element,
      id: elementId,
    });

    this.socket.send(
      JSON.stringify({
        type: "create_element",
        id: elementId,
        path: JSON.stringify({ ...element }),
        roomId: this.roomId,
        elementType: selectedTool,
      })
    );
  };
  mouseMoveHandler = (e: MouseEvent) => {
    if (this.action === Action.Drawing) {
      const width = e.clientX - this.startX;
      const height = e.clientY - this.startY;
      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      const selectedTool = this.selectedTool;
      console.log(selectedTool);
      this.createElement(
        selectedTool,
        this.startX,
        this.startY,
        e.clientX,
        e.clientY,
        width,
        height
      );
    } else if (
      this.action === Action.Moving &&
      this.selectedTool === ElementType.CURSOR
    ) {
      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      this.updateElement(e.clientX, e.clientY);
      console.log("this.updateElement(e.clientX, e.clientY);: ");
    } else if (
      this.action === Action.Resizing &&
      this.selectedTool === ElementType.CURSOR
    ) {
      this.clearCanvas();
      this.ctx.strokeStyle = "rgba(255, 255, 255)";
      this.resizeElement(e.clientX, e.clientY);
    }

    if (this.selectedTool === ElementType.CURSOR) {
      // console.log(this.existingElements);

      const element = getElementAtPosition(
        e.clientX,
        e.clientY,
        this.existingElements
      );
      console.log(
        "element ===== ",
        element,
        "e.target instanceof HTMLElement",
        e.target instanceof HTMLElement
      );
      if (e.target instanceof HTMLElement) {
        e.target.style.cursor =
          element && element.position
            ? cursorForPosition(element.position)
            : "default";
      }
    }
  };

  initMouseHandlers() {
    this.canvas.addEventListener("mousedown", this.mouseDownHandler);

    this.canvas.addEventListener("mouseup", this.mouseUpHandler);

    this.canvas.addEventListener("mousemove", this.mouseMoveHandler);
  }
}
