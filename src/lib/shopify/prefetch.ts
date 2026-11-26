import type { QueryClient } from "@tanstack/react-query";

import { fetchCollectionProducts, fetchCollections, fetchProducts } from "./catalog";

const STALE = 5 * 60 * 1000;

/** Warms the same cache keys the home and shop screens read. Failures are ignored: the screens retry on their own. */
export async function prefetchStorefront(client: QueryClient): Promise<void> {
  await Promise.allSettled([
    client.prefetchQuery({ queryKey: ["collections"], queryFn: fetchCollections, staleTime: STALE }),
    client.prefetchQuery({ queryKey: ["products"], queryFn: fetchProducts, staleTime: STALE }),
    client.prefetchQuery({
      queryKey: ["collection-products", "home-best-sellers"],
      queryFn: () => fetchCollectionProducts("home-best-sellers"),
      staleTime: STALE,
    }),
  ]);
}
