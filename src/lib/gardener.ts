import { z } from "zod";

import { storefrontQuery } from "@/lib/shopify/client";

/** Handle of the Shopify product that represents the service (same as the website). */
export const GARDENER_HANDLE = "garden-care-visit";
export const GARDENER_CITIES = ["Nagpur", "Pune", "Mumbai"] as const;

export type GardenerPlan = { id: string; name: string; price: string };
export type GardenerService = {
  title: string;
  variantId: string;
  oneTimePrice: string;
  currency: string;
  plans: GardenerPlan[];
};

const QUERY = /* GraphQL */ `
  query GardenerService($handle: String!) {
    product(handle: $handle) {
      title
      availableForSale
      variants(first: 1) { nodes { id price { amount currencyCode } } }
      sellingPlanGroups(first: 5) {
        nodes {
          sellingPlans(first: 10) {
            nodes {
              id
              name
              priceAdjustments { adjustmentValue { ... on SellingPlanFixedPriceAdjustment { price { amount } } } }
            }
          }
        }
      }
    }
  }
`;

const response = z.object({
  product: z
    .object({
      title: z.string(),
      availableForSale: z.boolean(),
      variants: z.object({
        nodes: z.array(z.object({ id: z.string(), price: z.object({ amount: z.string(), currencyCode: z.string() }) })),
      }),
      sellingPlanGroups: z.object({
        nodes: z.array(
          z.object({
            sellingPlans: z.object({
              nodes: z.array(
                z.object({
                  id: z.string(),
                  name: z.string(),
                  priceAdjustments: z.array(
                    z.object({ adjustmentValue: z.object({ price: z.object({ amount: z.string() }).optional() }) }),
                  ),
                }),
              ),
            }),
          }),
        ),
      }),
    })
    .nullable(),
});

/** Null when the service cannot be booked (unpublished, unavailable): the screen then shows "Booking opens soon". */
export async function fetchGardenerService(): Promise<GardenerService | null> {
  const { product } = response.parse(await storefrontQuery(QUERY, { handle: GARDENER_HANDLE }));
  const variant = product?.variants.nodes[0];
  if (!product || !variant || !product.availableForSale) return null;
  const plans = product.sellingPlanGroups.nodes
    .flatMap((group) => group.sellingPlans.nodes)
    .flatMap((plan) => {
      const price = plan.priceAdjustments[0]?.adjustmentValue.price?.amount;
      return price ? [{ id: plan.id, name: plan.name, price }] : [];
    });
  return { title: product.title, variantId: variant.id, oneTimePrice: variant.price.amount, currency: variant.price.currencyCode, plans };
}

/** Same rules as the website's booking form. */
const noControl = (value: string) => [...value].every((c) => c.charCodeAt(0) > 31 && c !== "\u007f");
const text = (label: string, min: number, max: number) =>
  z.string().trim().min(min, `${label} is required`).max(max, `${label} is too long`).refine(noControl, `${label} contains invalid characters`);

export const bookingSchema = z.object({
  name: text("Name", 2, 80),
  email: z.string().trim().toLowerCase().pipe(z.email("Enter a valid email address").max(254)),
  city: z.enum(GARDENER_CITIES, { message: "Choose a city" }),
  address: text("Address", 8, 300),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Enter the date as YYYY-MM-DD")
    .refine((v) => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), "Enter a real date")
    .refine((v) => Date.parse(`${v}T00:00:00Z`) >= Date.now() - 86_400_000, "Choose a date that has not passed"),
  phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,20}$/, "Enter a phone number we can reach you on"),
  notes: z.string().trim().max(500, "Notes are too long").refine(noControl, "Notes contain invalid characters").optional(),
});
export type Booking = z.output<typeof bookingSchema>;

/** The label/value pairs Shopify shows on the order line. */
export const bookingAttributes = (booking: Booking) => [
  { key: "Name", value: booking.name },
  { key: "City", value: booking.city },
  { key: "Address", value: booking.address },
  { key: "Preferred date", value: booking.date },
  { key: "Phone", value: booking.phone },
  ...(booking.notes ? [{ key: "Notes", value: booking.notes }] : []),
];
