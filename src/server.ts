import http from "http";
import { Server, Socket } from "socket.io";
import app from "./app";
import config from "./config/config";
import DB_POOL from "./config/dbPool";
import { registerGameRoutes } from "./routes/gameRoutes";
import {
	verifyToken
} from "./utils/JwtUtil";

// Http Server Config
const httpServer = http.createServer(app);

httpServer.listen(config.APP_PORT, config.APP_HOST, () => {
	console.log(`Server listening on http://${config.APP_HOST}:${config.APP_PORT}`);
});

httpServer.on("error", (err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});

// Socket Server Config
const socketServer = new Server(httpServer, { cors: { origin: config.FRONTEND_ORIGIN } });

socketServer.on("connection", (socket: Socket) => {
	registerGameRoutes(socketServer, socket);
});

socketServer.use((socket, next) => {
	const tokenVerified = verifyToken(socket.handshake.auth.token);
	if (tokenVerified) {
		next();
	} else {
		next(new Error("Unauthorized"));
	}
})

// Shutdown Config
const shutdown = async () => {
	console.log("Shutting down server...");
	try { socketServer.close(); } catch {}
	try { await DB_POOL.end(); } catch {};
	httpServer.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => { console.error("Unhandled Rejection:", reason); });
process.on("uncaughtException", (err) => { console.error("Uncaught Exception:", err); });