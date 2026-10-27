import { Product } from '../types';

export type ProductBudgetFilter =
  | 'all'
  | 'under-150'
  | '150-300'
  | '300-500'
  | 'over-500';

export interface ProductFilters {
  budget: ProductBudgetFilter;
  vibe: string;
  occasion: string;
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  budget: 'all',
  vibe: 'all',
  occasion: 'all',
};

export const matchesProductFilters = (
  product: Product,
  filters: ProductFilters,
): boolean => {
  const matchesBudget =
    filters.budget === 'all' ||
    (filters.budget === 'under-150' && product.price < 150_000) ||
    (filters.budget === '150-300' &&
      product.price >= 150_000 &&
      product.price < 300_000) ||
    (filters.budget === '300-500' &&
      product.price >= 300_000 &&
      product.price <= 500_000) ||
    (filters.budget === 'over-500' && product.price > 500_000);

  const matchesVibe =
    filters.vibe === 'all' || product.vibes.includes(filters.vibe);
  const matchesOccasion =
    filters.occasion === 'all' || product.occasions.includes(filters.occasion);

  return matchesBudget && matchesVibe && matchesOccasion;
};
