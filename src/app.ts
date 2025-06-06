import express, { Request, Response } from "express";
import cors from "cors";
import router from "./app/routes";
import globalErrorHandler from "./app/middleWear/globalErrorHandler";
import notFound from "./app/middleWear/notFound";
import cookieParser from "cookie-parser";
import 'dotenv/config';

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use("/api/v1", router);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello Chrismiche!");
});

// Error handler middlewear is positioned after all the routes definition because after the routes are handled then error will occur, not before
app.use(notFound);
app.use(globalErrorHandler);

export default app;
