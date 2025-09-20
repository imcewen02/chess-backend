import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
    let status = 500;
    let message = "Internal Server Error";

    if (err instanceof ApiError) {
        status = err.status;
        message = err.message;
    } else if (err instanceof Error) {
        message = err.message;
    }

    console.error(err);
    res.status(status).json({ error: message });
}