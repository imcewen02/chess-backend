import { Server, Socket } from "socket.io";
import { getAccountFromToken } from "../utils/JwtUtil";
import { joinQueue, movePiece } from "../services/gameService";
import { Position } from "../models/position";

export function registerGameRoutes(socketServer: Server, socket: Socket) { 
    socket.on("games:joinQueue", () => {
        const account = getAccountFromToken(socket.handshake.auth.token);
        joinQueue(account);
    })

    socket.on("games:movePiece", (uuid: string, origin: Position, destination: Position) => {
        const account = getAccountFromToken(socket.handshake.auth.token);
        movePiece(uuid, account, origin, destination);
    })
}