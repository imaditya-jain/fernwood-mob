import { z } from "zod";

import type { Collection, Product, ProductBadge } from "@/lib/types";

import { storefrontQuery } from "./client";

const PRODUCT_FIELDS = /* GraphQL */ `
  fragment ProductFields on Product {
    id
    handle
    title
    productType
    tags
    availableForSale
    priceRange { minVariantPrice { amount } }
    compareAtPriceRange { minVariantPrice { amount } }
    featuredImage { url }
    variants(first: 1) { nodes { id } }
    light: metafield(namespace: "custom", key: "light") { value }
    size: metafield(namespace: "custom", key: "size") { value }
    collections(first: 20) {
      nodes { handle tagline: metafield(namespace: "custom", key: "tagline") { value } }
    }
  }
`;

const COLLECTIONS_QUERY = /* GraphQL */ `
  query Collections {
    collections(first: 50) {
      nodes {
        handle
        title
        description
        image { url }
        tagline: metafield(namespace: "custom", key: "tagline") { value }
        position: metafield(namespace: "custom", key: "position") { value }
      }
    }
  }
`;

const PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query Products($first: Int!) {
    products(first: $first) { nodes { ...ProductFields } }
  }
`;

const PRODUCT_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query Product($handle: String!) {
    product(handle: $handle) { ...ProductFields }
  }
`;

const COLLECTION_PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query CollectionProducts($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first, sortKey: COLLECTION_DEFAULT) { nodes { ...ProductFields } }
    }
  }
`;

const meta = z.object({ value: z.string() }).nullable();
const money = z.object({ amount: z.string() });

const productNode = z.object({
  id: z.string(),
  handle: z.string(),
  title: z.string(),
  productType: z.string(),
  tags: z.array(z.string()),
  availableForSale: z.boolean(),
  priceRange: z.object({ minVariantPrice: money }),
  compareAtPriceRange: z.object({ minVariantPrice: money }),
  featuredImage: z.object({ url: z.string() }).nullable(),
  variants: z.object({ nodes: z.array(z.object({ id: z.string() })) }),
  light: meta,
  size: meta,
  collections: z.object({
    nodes: z.array(z.object({ handle: z.string(), tagline: meta })),
  }),
});

const collectionNode = z.object({
  handle: z.string(),
  title: z.string(),
  description: z.string(),
  image: z.object({ url: z.string() }).nullable(),
  tagline: meta,
  position: meta,
});

const BADGES: ProductBadge[] = ["Sale", "New", "Bestseller"];

function toProduct(node: z.infer<typeof productNode>): Product {
  const price = Number(node.priceRange.minVariantPrice.amount);
  const compare = Number(node.compareAtPriceRange.minVariantPrice.amount);
  const variantId = node.variants.nodes[0]?.id;
  const badge = BADGES.find((candidate) => node.tags.includes(candidate));
  return {
    id: node.id,
    slug: node.handle,
    name: node.title,
    category: node.productType,
    price,
    ...(compare > price ? { compareAtPrice: compare } : {}),
    image: node.featuredImage?.url ?? "",
    ...(badge ? { badge } : {}),
    light: node.light?.value ?? "",
    size: node.size?.value ?? "",
    inStock: node.availableForSale,
    ...(variantId ? { variantId } : {}),
    collectionSlugs: node.collections.nodes.filter((c) => c.tagline?.value).map((c) => c.handle),
  };
}

/** Storefront collections are the ones carrying the `custom.tagline` metafield, ordered by `custom.position` (as on the website). */
export async function fetchCollections(): Promise<Collection[]> {
  const data = z
    .object({ collections: z.object({ nodes: z.array(collectionNode) }) })
    .parse(await storefrontQuery(COLLECTIONS_QUERY));
  return data.collections.nodes
    .filter((node) => node.tagline?.value)
    .sort((a, b) => (Number(a.position?.value) || 1e9) - (Number(b.position?.value) || 1e9))
    .map((node) => ({
      slug: node.handle,
      name: node.title,
      tagline: node.tagline?.value ?? "",
      description: node.description,
      image: node.image?.url ?? "",
    }));
}

export async function fetchProducts(): Promise<Product[]> {
  const data = z
    .object({ products: z.object({ nodes: z.array(productNode) }) })
    .parse(await storefrontQuery(PRODUCTS_QUERY, { first: 100 }));
  return data.products.nodes.map(toProduct);
}

export async function fetchProduct(handle: string): Promise<Product | null> {
  const data = z
    .object({ product: productNode.nullable() })
    .parse(await storefrontQuery(PRODUCT_QUERY, { handle }));
  return data.product ? toProduct(data.product) : null;
}

export async function fetchCollectionProducts(handle: string): Promise<Product[]> {
  const data = z
    .object({
      collection: z.object({ products: z.object({ nodes: z.array(productNode) }) }).nullable(),
    })
    .parse(await storefrontQuery(COLLECTION_PRODUCTS_QUERY, { handle, first: 100 }));
  return (data.collection?.products.nodes ?? []).map(toProduct);
}
