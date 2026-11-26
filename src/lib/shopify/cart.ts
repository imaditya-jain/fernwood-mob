import { z } from "zod";

import { type Cart, MAX_CART_LINES, MAX_LINE_QUANTITY } from "@/lib/cart";

import { storefrontQuery } from "./client";

const CART_FIELDS = /* GraphQL */ `
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost { subtotalAmount { amount currencyCode } }
    lines(first: 50) {
      nodes {
        id
        quantity
        cost { amountPerQuantity { amount } totalAmount { amount } }
        sellingPlanAllocation { sellingPlan { name } }
        merchandise {
          ... on ProductVariant {
            title
            image { url }
            product { handle title featuredImage { url } }
          }
        }
      }
    }
  }
`;

const USER_ERRORS = "userErrors { code message }";

const CART_QUERY = `${CART_FIELDS} query Cart($id: ID!) { cart(id: $id) { ...CartFields } }`;
const CART_CREATE = `${CART_FIELDS} mutation CartCreate($lines: [CartLineInput!]!, $buyerIdentity: CartBuyerIdentityInput) { cartCreate(input: { lines: $lines, buyerIdentity: $buyerIdentity }) { cart { ...CartFields } ${USER_ERRORS} } }`;
const CART_BUYER = `${CART_FIELDS} mutation CartBuyer($cartId: ID!, $email: String) { cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: { email: $email }) { cart { ...CartFields } ${USER_ERRORS} } }`;
const CART_LINES_ADD = `${CART_FIELDS} mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ...CartFields } ${USER_ERRORS} } }`;
const CART_LINES_UPDATE = `${CART_FIELDS} mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ...CartFields } ${USER_ERRORS} } }`;
const CART_LINES_REMOVE = `${CART_FIELDS} mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $lineIds) { cart { ...CartFields } ${USER_ERRORS} } }`;

const cartNode = z.object({
  id: z.string(),
  checkoutUrl: z.string(),
  totalQuantity: z.number(),
  cost: z.object({ subtotalAmount: z.object({ amount: z.string(), currencyCode: z.string() }) }),
  lines: z.object({
    nodes: z.array(
      z.object({
        id: z.string(),
        quantity: z.number(),
        cost: z.object({
          amountPerQuantity: z.object({ amount: z.string() }),
          totalAmount: z.object({ amount: z.string() }),
        }),
        sellingPlanAllocation: z.object({ sellingPlan: z.object({ name: z.string() }) }).nullable(),
        merchandise: z.object({
          title: z.string(),
          image: z.object({ url: z.string() }).nullable(),
          product: z.object({
            handle: z.string(),
            title: z.string(),
            featuredImage: z.object({ url: z.string() }).nullable(),
          }),
        }),
      }),
    ),
  }),
});

const userErrors = z.array(z.object({ code: z.string().nullable(), message: z.string() }));

export class CartError extends Error {
  constructor(
    message: string,
    /** True when the cart no longer exists (expired or already ordered). */
    readonly gone = false,
  ) {
    super(message);
    this.name = "CartError";
  }
}

const map = (node: z.infer<typeof cartNode>): Cart => ({
  id: node.id,
  totalQuantity: node.totalQuantity,
  subtotal: {
    amount: node.cost.subtotalAmount.amount,
    currency: node.cost.subtotalAmount.currencyCode,
  },
  checkoutUrl: node.checkoutUrl,
  lines: node.lines.nodes.map((line) => ({
    id: line.id,
    quantity: line.quantity,
    name: line.merchandise.product.title,
    slug: line.merchandise.product.handle,
    image: line.merchandise.image?.url ?? line.merchandise.product.featuredImage?.url ?? "",
    unitPrice: line.cost.amountPerQuantity.amount,
    lineTotal: line.cost.totalAmount.amount,
    variantTitle:
      line.sellingPlanAllocation?.sellingPlan.name ??
      (line.merchandise.title === "Default Title" ? "" : line.merchandise.title),
  })),
});

/** Runs a mutation and returns the cart. Shopify's own error text is never shown to the shopper. */
async function mutate(query: string, variables: Record<string, unknown>, key: string): Promise<Cart> {
  const data = z
    .record(z.string(), z.object({ cart: cartNode.nullable(), userErrors }))
    .parse(await storefrontQuery(query, variables));
  const result = data[key];
  if (!result) throw new CartError("Unexpected cart response");
  if (result.userErrors.some((e) => e.code === "INVALID")) throw new CartError("Cart is gone", true);
  if (result.userErrors.length > 0 || !result.cart) {
    throw new CartError("We couldn't update your cart. That item may be out of stock.");
  }
  return map(result.cart);
}

const GID = /^gid:\/\/shopify\/[A-Za-z]+\/[A-Za-z0-9?=&_-]+$/;
const assertGid = (value: string) => {
  if (!GID.test(value)) throw new CartError("Invalid id");
};
const clamp = (quantity: number) => Math.min(MAX_LINE_QUANTITY, Math.max(1, Math.trunc(quantity)));

export async function fetchCart(id: string): Promise<Cart | null> {
  assertGid(id);
  const data = z.object({ cart: cartNode.nullable() }).parse(await storefrontQuery(CART_QUERY, { id }));
  return data.cart ? map(data.cart) : null;
}

/** Optional extras for a line: a subscription plan and the booking details shown on the order line. */
export type LineExtras = {
  sellingPlanId?: string;
  attributes?: { key: string; value: string }[];
  /** Pre-fills checkout. Only used for bookings, where the shopper typed it. */
  buyerEmail?: string;
};

const lineInput = (variantId: string, quantity: number, extras?: LineExtras) => {
  assertGid(variantId);
  if (extras?.sellingPlanId) assertGid(extras.sellingPlanId);
  return {
    merchandiseId: variantId,
    quantity: clamp(quantity),
    ...(extras?.sellingPlanId ? { sellingPlanId: extras.sellingPlanId } : {}),
    ...(extras?.attributes?.length ? { attributes: extras.attributes } : {}),
  };
};

/** Sets (or clears) the buyer email so checkout is pre-filled and the order lands in the account's history. */
export const setBuyerEmail = (cartId: string, email: string | null) => {
  assertGid(cartId);
  return mutate(CART_BUYER, { cartId, email }, "cartBuyerIdentityUpdate");
};

export const createCart = (variantId: string, quantity = 1, extras?: LineExtras) =>
  mutate(
    CART_CREATE,
    {
      lines: [lineInput(variantId, quantity, extras)],
      ...(extras?.buyerEmail ? { buyerIdentity: { email: extras.buyerEmail } } : {}),
    },
    "cartCreate",
  );

export const addLine = async (cartId: string, variantId: string, quantity = 1, extras?: LineExtras) => {
  assertGid(cartId);
  const cart = await mutate(CART_LINES_ADD, { cartId, lines: [lineInput(variantId, quantity, extras)] }, "cartLinesAdd");
  return extras?.buyerEmail ? mutate(CART_BUYER, { cartId, email: extras.buyerEmail }, "cartBuyerIdentityUpdate") : cart;
};

export const setLineQuantity = (cartId: string, lineId: string, quantity: number) => {
  assertGid(cartId);
  assertGid(lineId);
  return mutate(CART_LINES_UPDATE, { cartId, lines: [{ id: lineId, quantity: clamp(quantity) }] }, "cartLinesUpdate");
};

export const removeLine = (cartId: string, lineId: string) => {
  assertGid(cartId);
  assertGid(lineId);
  return mutate(CART_LINES_REMOVE, { cartId, lineIds: [lineId] }, "cartLinesRemove");
};

export { MAX_CART_LINES };
