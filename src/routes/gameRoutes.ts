import { Server, Socket } from "socket.io";
import { getAccountFromToken } from "../utils/JwtUtil";
import {
    joinQueue
} from "../services/gameService";

export function registerGameRoutes(socketServer: Server, socket: Socket) { 
    socket.on("games:joinQueue", () => {
        const account = getAccountFromToken(socket.handshake.auth.token);
        joinQueue(account);
    })
}