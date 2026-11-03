import { Product } from '../types';

export type ProductBudgetFilter =
  | 'all'
  | 'under-150'
  | '150-300'
  | '300-500'
  | 'over-500';

export const BUDGET_FILTER_OPTIONS: { value: ProductBudgetFilter; label: string }[] = [
  { value: 'all', label: 'Tất cả mức giá' },
  { value: 'under-150', label: 'Dưới 150.000đ' },
  { value: '150-300', label: '150.000đ – dưới 300.000đ' },
  { value: '300-500', label: '300.000đ – 500.000đ' },
  { value: 'over-500', label: 'Trên 500.000đ' },
];

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

export const matchesBudgetFilter = (
  product: Product,
  budget: ProductBudgetFilter,
): boolean =>
  budget === 'all' ||
  (budget === 'under-150' && product.price < 150_000) ||
  (budget === '150-300' &&
    product.price >= 150_000 &&
    product.price < 300_000) ||
  (budget === '300-500' &&
    product.price >= 300_000 &&
    product.price <= 500_000) ||
  (budget === 'over-500' && product.price > 500_000);

export const matchesProductFilters = (
  product: Product,
  filters: ProductFilters,
): boolean => {
  const matchesBudget = matchesBudgetFilter(product, filters.budget);

  const matchesVibe =
    filters.vibe === 'all' || product.vibes.includes(filters.vibe);
  const matchesOccasion =
    filters.occasion === 'all' || product.occasions.includes(filters.occasion);

  return matchesBudget && matchesVibe && matchesOccasion;
};
