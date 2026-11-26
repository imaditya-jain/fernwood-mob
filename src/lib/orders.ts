export type Money = { amount: string; currency: string };
export type OrderLine = { title: string; variantTitle?: string; quantity: number; image?: string; unitPrice: Money };
export type Tracking = { company?: string; number?: string; url?: string };
export type OrderSummary = {
  id: string;
  name: string;
  processedAt: string;
  financialStatus: string;
  fulfillmentStatus: string;
  cancelled: boolean;
  total: Money;
  itemCount: number;
  previewImages: string[];
};
export type OrderDetail = OrderSummary & {
  lines: OrderLine[];
  subtotal: Money;
  shipping: Money;
  tax: Money;
  tracking: Tracking[];
  shippingAddress?: { city?: string; region?: string; country?: string };
};
export type OrderPage = {
  orders: OrderSummary[];
  pageInfo: { hasNextPage: boolean; hasPreviousPage: boolean; startCursor?: string; endCursor?: string };
};

export const statusLabel = (status: string) => {
  const spaced = status.toLowerCase().replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};
export const formatMoney = ({ amount, currency }: Money) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount));
export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat("en-US", { dateStyle: "long", timeZone: "UTC" }).format(new Date(iso));
