// Shared TypeScript interfaces for ticket requests

export interface TicketRequest {
  _id: string;
  passengerName: string;
  passengerEmail: string;
  phoneNumber: string;
  airlineCode: string;
  confirmationCode: string;
  ticketCost: string;
  status: string;
  mco: string;
  paymentMethod?: string;
  cardholderName?: string;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  date: string;
  time?: string;
  datetime?: string;
  consultant?: string;
  ticketType?: string;
  requestFor?: string;
  Desc?: string;
  billingZipCode: string;
  billingCountry: string;
  billingState: string;
  billingCity: string;
  billingAddress: string;
  billingFirstName?: string;
  billingLastName?: string;
  billingEmail?: string;
  billingPhone?: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
  
  // Multi-currency fields
  currency?: string;
  exchangeRate?: number;
  ticketCostUSD?: string;
  mcoUSD?: string;
}

export interface TicketRequestStatus {
  _id: string;
  ticketRequest: TicketRequest;
  status: string;
  paymentMethod?: string;
  remark?: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  paymentIntentId?: string;
  
  // Multi-currency fields
  currency?: string;
  saleAmountOriginal?: number;
  saleAmountUSD?: number;
  exchangeRate?: number;
}
