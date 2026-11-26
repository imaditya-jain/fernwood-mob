/** Same domain shapes as the website's `src/lib/types.ts`. */
export type Collection = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  image: string;
};

export type ProductBadge = "Sale" | "Bestseller" | "New";

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: string;
  price: number;
  compareAtPrice?: number;
  image: string;
  badge?: ProductBadge;
  light: string;
  size: string;
  inStock: boolean;
  variantId?: string;
  collectionSlugs: string[];
  /** Occasions this product suits (from `occasion-*` tags). */
  occasions?: string[];
};
