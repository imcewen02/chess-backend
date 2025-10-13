import { Server, Socket } from "socket.io";
import { getAccountFromToken } from "../utils/JwtUtil";
import { joinQueue, movePiece } from "../services/gameService";
import { Position } from "../models/position";
import accountRepository from "../repositories/accountRepository"
import { ApiError } from "../utils/ApiError";
import { Name } from "../models/pieces";

export function registerGameRoutes(socketServer: Server, socket: Socket) { 
    socket.on("games:joinQueue", async () => {
        const accountJson = getAccountFromToken(socket.handshake.auth.token);

        const account = await accountRepository.getByUsername(accountJson.username);
        if (!account) throw new ApiError(404, "User does not exist");

        account.password = "";

        joinQueue(account);
    })

    socket.on("games:movePiece", async (uuid: string, origin: Position, destination: Position, promoteTo?: Name) => {
        const accountJson = getAccountFromToken(socket.handshake.auth.token);

        const account = await accountRepository.getByUsername(accountJson.username);
        if (!account) throw new ApiError(404, "User does not exist");

        account.password = "";
        movePiece(uuid, account, origin, destination, promoteTo);
    })
}