export interface TicketOffer {
  id: number;
  tickets_amount: number;
  price_euros: number;
  name: string;
}

export interface PurchaseTicketsRequest {
  offer_id: number;
}

export interface PurchaseResponse {
  tickets_received: number;
  amount_paid: number;
  new_balance: number;
}

export interface TicketBalance {
  balance: number;
}

export interface TicketPurchase {
  id: number;
  user_id: number;
  offer_id: number;
  tickets_received: number;
  amount_paid: number;
  stripe_payment_id?: string;
  created_at: string;
}