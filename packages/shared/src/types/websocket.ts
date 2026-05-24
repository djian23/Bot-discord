export type WsEventType =
  | "cart:new"
  | "cart:claimed"
  | "cart:paid"
  | "cart:expired"
  | "ticket:created"
  | "ticket:closed"
  | "log:new"
  | "stats:update"
  | "bot:status";

export interface WsEvent<T = unknown> {
  type: WsEventType;
  payload: T;
  timestamp: string;
}
