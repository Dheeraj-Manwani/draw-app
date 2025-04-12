import express from "express";
import cors from "cors";
import bodyParser, { json, urlencoded } from "body-parser";
import { userRouter } from "./routes/user.routes";
import { roomRouter } from "./routes/room.routes";
import morgan from "morgan";
import dotenv from "dotenv";

const port = process.env.PORT || 5001;
const app = express();
dotenv.config();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app
  .disable("x-powered-by")
  .use(morgan("dev"))
  .use(urlencoded({ extended: true }))
  .use(json())
  .use(cors());

app.get("/health", (req, res) => {
  res.json({ message: "Server running healthy !!" });
});

app.use("/api/v1/user", userRouter);
app.use("/api/v1/room", roomRouter);

app.listen(port, () => {
  console.log(`api running on ${port}`);
});
