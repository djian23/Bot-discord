"use client";

import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import type { WsEvent, WsEventType } from "@discord-manager/shared";

export function useWebSocket(
  eventType: WsEventType,
  handler: (event: WsEvent) => void,
) {
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const botUrl = process.env.NEXT_PUBLIC_BOT_WS_URL ?? "http://localhost:4000";
    if (!socketRef.current) {
      socketRef.current = io(botUrl, { transports: ["websocket"] });
    }

    const socket = socketRef.current;
    socket.on(eventType, handler);

    return () => {
      socket.off(eventType, handler);
    };
  }, [eventType, handler]);
}
