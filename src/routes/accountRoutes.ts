import { Router } from "express";
import {
    createAccount,
    getAccountByUsername,
    getAllAccounts,
    getUsernameAvailable
} from "../services/accountService";

const router = Router();

router.get("/", getAllAccounts)
router.get("/account/:username", getAccountByUsername)
router.get("/account/:username/available", getUsernameAvailable)
router.post("/register", createAccount)

export default router;