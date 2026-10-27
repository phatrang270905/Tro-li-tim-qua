import React from 'react';
import { Product } from '../types';
import {
  EMPTY_PRODUCT_FILTERS,
  ProductFilters,
} from '../utils/productFilters';

interface ProductFilterBarProps {
  products: Product[];
  filters: ProductFilters;
  onChange: (filters: ProductFilters) => void;
  showVibe?: boolean;
}

export const ProductFilterBar: React.FC<ProductFilterBarProps> = ({
  products,
  filters,
  onChange,
  showVibe = true,
}) => {
  const vibes = [...new Set(products.flatMap((product) => product.vibes))];
  const occasions = [...new Set(products.flatMap((product) => product.occasions))];
  const hasActiveFilters =
    filters.budget !== 'all' ||
    filters.vibe !== 'all' ||
    filters.occasion !== 'all';

  const selectClassName =
    'w-full rounded-xl border border-[#e2bebe] bg-white px-3 py-2.5 text-sm font-medium text-[#1e1b19] outline-none transition focus:border-[#b21e36] focus:ring-2 focus:ring-[#b21e36]/15';

  return (
    <div className="mb-6 rounded-2xl border border-[#eee7e3] bg-white p-4 shadow-xs sm:p-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px] text-[#b21e36]">
            filter_list
          </span>
          <h3 className="font-bold text-[#1e1b19]">Lọc quà phù hợp</h3>
        </div>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_PRODUCT_FILTERS)}
            className="text-xs font-bold text-[#b21e36] underline-offset-2 hover:underline"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className={`grid grid-cols-1 gap-3 ${showVibe ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#5a4041]">
          Ngân sách
          <select
            aria-label="Lọc theo ngân sách"
            className={selectClassName}
            value={filters.budget}
            onChange={(event) =>
              onChange({
                ...filters,
                budget: event.target.value as ProductFilters['budget'],
              })
            }
          >
            <option value="all">Tất cả mức giá</option>
            <option value="under-150">Dưới 150.000đ</option>
            <option value="150-300">150.000đ – dưới 300.000đ</option>
            <option value="300-500">300.000đ – 500.000đ</option>
            <option value="over-500">Trên 500.000đ</option>
          </select>
        </label>

        {showVibe && (
          <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#5a4041]">
            Phong cách
            <select
              aria-label="Lọc theo phong cách"
              className={selectClassName}
              value={filters.vibe}
              onChange={(event) =>
                onChange({ ...filters, vibe: event.target.value })
              }
            >
              <option value="all">Tất cả phong cách</option>
              {vibes.map((vibe) => (
                <option key={vibe} value={vibe}>
                  {vibe}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-[#5a4041]">
          Dịp tặng
          <select
            aria-label="Lọc theo dịp tặng"
            className={selectClassName}
            value={filters.occasion}
            onChange={(event) =>
              onChange({ ...filters, occasion: event.target.value })
            }
          >
            <option value="all">Tất cả dịp tặng</option>
            {occasions.map((occasion) => (
              <option key={occasion} value={occasion}>
                {occasion}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
};
