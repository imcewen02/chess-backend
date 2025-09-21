import { Server, Socket } from "socket.io";
import { getAccountFromToken } from "../utils/JwtUtil";

export function registerGameRoutes(socketServer: Server, socket: Socket) { 
    socket.on("games:joinQueue", () => {
        console.log(getAccountFromToken(socket.handshake.auth.token))
    })
}