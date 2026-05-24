export const CART_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Available",
  CLAIMED: "Claimed",
  PAID: "Paid",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
  SOLD_OUT: "Sold Out",
};

export const CLAIM_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PAID: "Paid",
  CANCELLED: "Cancelled",
  REFUNDED: "Refunded",
};

export const TICKET_STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  CLOSED: "Closed",
  ARCHIVED: "Archived",
};

export const EMBED_COLORS = {
  DEFAULT: 0x5865f2,
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
  WARNING: 0xfee75c,
  INFO: 0x5865f2,
} as const;

export const CART_EXPIRY_DEFAULT_MINUTES = 15;
export const TICKET_AUTO_CLOSE_HOURS = 48;
export const MAX_CLAIMS_PER_DAY_DEFAULT = 5;
