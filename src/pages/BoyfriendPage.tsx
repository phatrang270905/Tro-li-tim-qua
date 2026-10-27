import React, { useState } from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { ProductFilterBar } from '../components/ProductFilterBar';
import {
  EMPTY_PRODUCT_FILTERS,
  matchesProductFilters,
  ProductFilters,
} from '../utils/productFilters';

interface BoyfriendPageProps {
  products: Product[];
  wishlistIds: Set<string>;
  onToggleWishlist: (product: Product) => void;
  onOpenDetail: (product: Product) => void;
}

export const BoyfriendPage: React.FC<BoyfriendPageProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onOpenDetail,
}) => {
  const [filters, setFilters] = useState<ProductFilters>(EMPTY_PRODUCT_FILTERS);
  const boyfriendCatalog = products.filter(
    (product) => product.category === 'boyfriend',
  );
  const boyfriendProducts = boyfriendCatalog.filter((product) =>
    matchesProductFilters(product, filters),
  );

  return (
    <div className="w-full">
      <section className="max-w-[1240px] mx-auto px-4 md:px-6 lg:px-8 pt-10 pb-6">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#ffdada]/60 text-[#b21e36] text-xs font-bold mb-4">
            <span className="material-symbols-outlined text-[16px]">card_giftcard</span>
            Gợi ý từ danh sách tham khảo
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#1e1b19] mb-3">
            Quà Tặng Người Yêu Nam
          </h1>
          <p className="text-sm md:text-base text-[#5a4041] leading-relaxed">
            Gợi ý phụ kiện, đồ chăm sóc cá nhân và sản phẩm công nghệ dành cho bạn trai.
          </p>
        </div>
      </section>

      <section className="max-w-[1240px] mx-auto px-4 md:px-6 lg:px-8 pb-12">
        <ProductFilterBar
          products={boyfriendCatalog}
          filters={filters}
          onChange={setFilters}
        />
        <p className="mb-4 text-sm text-[#5a4041]" aria-live="polite">
          Hiển thị <strong className="text-[#1e1b19]">{boyfriendProducts.length}</strong>/
          {boyfriendCatalog.length} sản phẩm
        </p>
        {boyfriendProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {boyfriendProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isWishlisted={wishlistIds.has(product.id)}
                onToggleWishlist={onToggleWishlist}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-[#e2bebe] bg-white px-5 py-10 text-center">
            <p className="font-bold text-[#1e1b19]">Chưa có quà phù hợp với bộ lọc này.</p>
            <button
              type="button"
              onClick={() => setFilters(EMPTY_PRODUCT_FILTERS)}
              className="mt-3 text-sm font-bold text-[#b21e36] underline-offset-2 hover:underline"
            >
              Xóa bộ lọc để xem tất cả quà
            </button>
          </div>
        )}
      </section>
    </div>
  );
};
