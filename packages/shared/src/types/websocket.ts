export type WsEventType =
  | "cart:new"
  | "cart:claimed"
  | "cart:paid"
  | "cart:expired"
  | "cart:cancelled"
  | "ticket:created"
  | "ticket:closed"
  | "stats:update"
  | "bot:status";

export interface WsEvent<T = unknown> {
  type: WsEventType;
  payload: T;
  timestamp: string;
}
