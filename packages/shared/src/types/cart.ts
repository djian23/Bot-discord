export interface ParsedCart {
  title: string;
  site?: string;
  price?: number;
  quantity?: number;
  section?: string;
  row?: string;
  category?: string;
  image?: string;
  checkoutLink?: string;
  expirationAt?: Date;
  cartExternalId?: string;
}

export interface CartWebhookPayload {
  eventId: string;
  sourceChannelId: string;
  sourceMessageId: string;
  cart: ParsedCart;
}
