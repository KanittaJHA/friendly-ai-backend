import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";
import apiRouter from "./routes/apiRouter.js";

import { CLIENT_URL, PORT } from "./config/config.js";

const app = express();

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(cookieParser());

const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: { status: "error", message: "Too many requests, try again later." },
});

connectDB();

app.use("/friendly-api/v1", apiLimiter, apiRouter);

app.use(errorHandler);

const startServer = async () => {
  try {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  } catch (error) {
    console.error("Server failed to start:", error);
    process.exit(1);
  }
};

startServer();
