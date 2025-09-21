import express from "express";
import cors from "cors";
import config from "./config/config";
import morgan from "morgan";
import accountRoutes from "./routes/accountRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { ApiError } from "./utils/ApiError";

const app = express();

// Middleware
app.use(cors({ origin: config.FRONTEND_ORIGIN }));
app.use(express.json());
app.use(morgan("dev"));

// Routes
app.use("/api/accounts", accountRoutes);
app.use((_req, _res, next) => { next(new ApiError(404, "Not Found")); });

// Centralized error handler
app.use(errorHandler);

export default app;