import { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import type { WsEvent } from "@discord-manager/shared";

let io: SocketServer | null = null;

export function initWsServer(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: { origin: process.env.NEXT_PUBLIC_APP_URL, credentials: true },
  });

  io.on("connection", (socket) => {
    console.log(`[WS] Client connected: ${socket.id}`);
    socket.on("disconnect", () => console.log(`[WS] Client disconnected: ${socket.id}`));
  });

  console.log("[WS] Socket.io server initialized");
}

export function emitWsEvent(event: WsEvent) {
  if (io) io.emit(event.type, event);
}
