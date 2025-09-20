import { Router } from "express";
import {
    login
} from "../services/authService";

const router = Router();

router.post("/login", login)

export default router;