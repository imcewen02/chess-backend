import { Request, Response } from "express";
import accountModel from "../models/accountModel";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError";

export async function login(req: Request, res: Response): Promise<Response> {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) throw new ApiError(400, "username and password are required");

    const account = await accountModel.getByUsername(username);
    if (!account) throw new ApiError(401, "Invalid credentials");

    const passwordCorrect = await bcrypt.compare(password, account.password);
    if (!passwordCorrect) throw new ApiError(401, "Invalid credentials");

    return res.status(200).send();
}