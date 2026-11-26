const STORE = process.env.EXPO_PUBLIC_SHOPIFY_STORE_URL;
const TOKEN = process.env.EXPO_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;
/** Pinned like the website; upgrade deliberately. */
export const SHOPIFY_API_VERSION = "2025-10";

export class ShopifyError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = "ShopifyError";
  }
}

type GraphQlResponse = { data?: unknown; errors?: { message: string }[] };

/**
 * Storefront API call. The Storefront token is public by design (it only reads the catalogue and manages carts),
 * so it ships in the app; the Admin token must never come anywhere near this project.
 */
export async function storefrontQuery(
  query: string,
  variables: Record<string, unknown> = {},
  signal?: AbortSignal,
): Promise<unknown> {
  if (!STORE || !TOKEN) {
    throw new ShopifyError("Shopify is not configured. Copy .env.example to .env.local.");
  }
  const response = await fetch(`https://${STORE}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    ...(signal ? { signal } : {}),
  });
  if (!response.ok) throw new ShopifyError(`Shopify responded ${response.status}`, response.status);
  const body = (await response.json()) as GraphQlResponse;
  if (body.errors?.length) throw new ShopifyError(body.errors.map((e) => e.message).join("; "));
  return body.data;
}
