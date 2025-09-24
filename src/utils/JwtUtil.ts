import jwt from "jsonwebtoken";
import config from "../config/config";
import { Account } from "../models/account";

/**
 * Checks if the token is signed with the correct signature
 * 
 * @returns true if the token is verified, false otherwise
 */
export function verifyToken(token: string): boolean {
    try {
        jwt.verify(token, config.JWT_SECRET);
        return true;
    } catch (err) {
        return false;
    }
}

/**
 * Fetches the account from a token
 * 
 * @returns the account
 */
export function getAccountFromToken(token: string): Account {
    const tokenObj: any = jwt.verify(token, config.JWT_SECRET)
    return tokenObj.account;
}