import type { Server, Socket } from "socket.io";

export function setupSocket(socketServer: Server) {
	socketServer.on("connection", (socket: Socket) => {
		console.log("USER CONNECTED");

		socket.on("disconnect", () => { console.log("USER DISCONNECTED"); });
	});
}
