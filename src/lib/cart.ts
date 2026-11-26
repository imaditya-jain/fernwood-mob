/** Same limits as the website's cart. Shopify enforces stock; these stop absurd quantities. */
export const MAX_LINE_QUANTITY = 10;
export const MAX_CART_LINES = 50;

export type CartLine = {
  id: string;
  quantity: number;
  name: string;
  slug: string;
  image: string;
  /** Exact decimal strings from Shopify. */
  unitPrice: string;
  lineTotal: string;
  variantTitle: string;
};

export type Cart = {
  id: string;
  lines: CartLine[];
  totalQuantity: number;
  subtotal: { amount: string; currency: string };
  checkoutUrl: string;
};
