import http from "http";
import { Server } from "socket.io";
import app from "./app";
import config from "./config/config";
import DB_POOL from "./config/dbPool";
import { setupSocket } from "./socket";

const httpServer = http.createServer(app);

const socketServer = new Server(httpServer, { cors: { origin: config.FRONTEND_ORIGIN } });
setupSocket(socketServer);

httpServer.listen(config.APP_PORT, config.APP_HOST, () => {
	console.log(`Server listening on http://${config.APP_HOST}:${config.APP_PORT}`);
});

httpServer.on("error", (err) => {
	console.error("Failed to start server:", err);
	process.exit(1);
});

const shutdown = async () => {
	console.log("Shutting down server...");
	try { socketServer.close(); } catch {}
	try { await DB_POOL.end(); } catch {};
	httpServer.close(() => process.exit(0));
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
process.on("unhandledRejection", (reason) => { console.error("Unhandled Rejection:", reason); });
process.on("uncaughtException", (err) => { console.error("Uncaught Exception:", err); process.exit(1); });