import { useQuery } from "@tanstack/react-query";

import { fetchCollectionProducts, fetchCollections, fetchProduct, fetchProducts } from "./catalog";

const FIVE_MINUTES = 5 * 60 * 1000;
const options = { staleTime: FIVE_MINUTES } as const;

export const useCollections = () =>
  useQuery({ queryKey: ["collections"], queryFn: fetchCollections, ...options });

export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: fetchProducts, ...options });

export const useProduct = (handle: string) =>
  useQuery({ queryKey: ["product", handle], queryFn: () => fetchProduct(handle), ...options });

/** Home best sellers: the `home-best-sellers` collection, exactly as on the website. */
export const useBestSellers = () =>
  useQuery({
    queryKey: ["collection-products", "home-best-sellers"],
    queryFn: () => fetchCollectionProducts("home-best-sellers"),
    ...options,
  });
