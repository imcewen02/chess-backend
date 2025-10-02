import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import config from "../config/config";
import { ApiError } from "../utils/ApiError";
import { getAllActiveGames } from "./gameService";
import accountRepository from "../repositories/accountRepository"

const ASCII_PRINTABLE_REGEX = /^[!-~]+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Gets all the current accounts registered
 */
export async function getAllAccounts(req: Request, res: Response): Promise<Response> {
    const accounts = await accountRepository.getAll();
    return res.status(200).send(accounts);
}

/**
 * Gets a single account by username
 */
export async function getAccountByUsername(req: Request, res: Response): Promise<Response> {
    const username = req.params.username;
    if (!username) throw new ApiError(400, "username is required");

    const account = await accountRepository.getByUsername(username);
    if (!account) throw new ApiError(404, "User does not exist");

    account.password = "";
    return res.status(200).send(account);
}

/**
 * Checks if the input username is currently available or is taken
 */
export async function getUsernameAvailable(req: Request, res: Response): Promise<Response> {
    const username = req.params.username;
    if (!username) throw new ApiError(400, "username is required");

    const account = await accountRepository.getByUsername(username);

    return res.status(200).send({ usernameAvailable: account == null});
}

/**
 * Validates and registers an account
 */
export async function createAccount(req: Request, res: Response): Promise<Response> {
    const { email, username, password, experience } = req.body as { email: string; username: string; password: string; experience: number; };
    if (!email || !username || !password || experience === undefined) throw new ApiError(400, "email, username, password, and experience are required");

    if (email.length > 256) throw new ApiError(400, "email must be 256 characters or less");
    if (!EMAIL_REGEX.test(email)) throw new ApiError(400, "email invalid");

    if (username.length > 32 || username.length < 6) throw new ApiError(400, "username must be between 6 and 32 characters");
    if (!ASCII_PRINTABLE_REGEX.test(username)) throw new ApiError(400, "username must only contain ASCII printable characters");

    if (password.length > 32 || password.length < 8) throw new ApiError(400, "password must be between 8 and 32 characters");
    if (!ASCII_PRINTABLE_REGEX.test(password)) throw new ApiError(400, "password must only contain ASCII printable characters");

    if (![0, 1, 2, 3].includes(experience)) throw new ApiError(400, "experience must be between 0 and 3");

    if (await accountRepository.getByUsername(username) != null) throw new ApiError(409, "Account already exists");

    const hashedPassword = await bcrypt.hash(password, 10);
    const elo = (experience + 1) * 300;
    await accountRepository.insert(username, hashedPassword, elo, email);

    return res.status(201).send();
}

/**
 * Logs an account in, returning a jwt token for the account
 */
export async function login(req: Request, res: Response): Promise<Response> {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) throw new ApiError(400, "username and password are required");

    const account = await accountRepository.getByUsername(username);
    if (!account) throw new ApiError(401, "Invalid credentials");

    const passwordCorrect = await bcrypt.compare(password, account.password);
    if (!passwordCorrect) throw new ApiError(401, "Invalid credentials");

    account.password = "";
    const token = jwt.sign({ account: account }, config.JWT_SECRET, { expiresIn: "7d" });

    return res.status(200).send({token: token});
}

/**
 * Gets the accounts current active game
 */
export async function getAccountsActiveGame(req: Request, res: Response): Promise<Response> {
    const username = req.params.username;

    const accountsActiveGame = Array.from(getAllActiveGames().values()).find(game => game.whitePlayer.username == username || game.blackPlayer.username == username);
    
    return res.status(200).send({game: accountsActiveGame});
}