import { Router } from "express";
import {
    createAccount,
    getAccountByUsername,
    getAccountsActiveGame,
    getAllAccounts,
    getUsernameAvailable,
    login
} from "../services/accountService";

const router = Router();

router.get("/", getAllAccounts)
router.get("/account/:username", getAccountByUsername)
router.get("/account/:username/game", getAccountsActiveGame)
router.get("/account/:username/available", getUsernameAvailable)
router.post("/register", createAccount)
router.post("/login", login)

export default router;