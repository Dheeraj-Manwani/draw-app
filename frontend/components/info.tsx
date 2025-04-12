import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { Cross, FileQuestion } from "lucide-react";
import { useState } from "react";

export function Info() {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        className="z-20 absolute top-5 right-5 p-2 rounded-lg border-none bg-primary transition-colors duration-300 hover:bg-primary-hover"
        aria-label="Open information dialog"
        onClick={() => setOpen(true)}
      >
        <FileQuestion className="text-primary-bg-color" />
      </button>
      <Dialog
        onClose={() => setOpen(false)}
        aria-labelledby="customized-dialog-title"
        open={open}
        PaperProps={{
          style: {
            borderRadius: "10px",
          },
        }}
      >
        <DialogTitle
          sx={{ m: 0, p: 2 }}
          id="customized-dialog-title"
          className="bg-primary text-primary-bg-color text-center"
        >
          How to Use NinjaSketch
        </DialogTitle>
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
          className="absolute right-2 top-2"
        >
          <Cross className="text-primary-bg-color" />
        </IconButton>
        <div className="p-5 max-w-xl leading-relaxed text-primary-text-color">
          <p className="font-bold">
            Welcome to NinjaSketch! Get started with these simple steps:
          </p>
          <ul className="list-none my-2.5 mb-5">
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Choose a Tool:</strong>{" "}
              Select from pencil, line, rectangle, or text tools to start
              drawing.
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Draw & Move:</strong>{" "}
              Click and drag on the canvas to draw. Select an element and drag
              to move.
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Edit Text:</strong>{" "}
              Select the text tool and click on the canvas to start typing.
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Zoom:</strong> Use Ctrl
              + Scroll to zoom in and out of the canvas.
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Pan:</strong> Hold
              Space and drag to move around the canvas, or hold the middle mouse
              button.
            </li>
          </ul>
          <p>Keyboard Shortcuts:</p>
          <ul className="list-none my-2.5 mb-5">
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Undo:</strong> Ctrl + Z
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Redo:</strong> Ctrl + Y
              or Ctrl + Shift + Z
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Zoom In:</strong> Ctrl
              + Plus
            </li>
            <li className="mb-2.5">
              <strong className="text-primary font-bold">Zoom Out:</strong> Ctrl
              + Minus
            </li>
          </ul>
          <p>Enjoy creating your masterpiece!</p>
        </div>
      </Dialog>
    </div>
  );
}
