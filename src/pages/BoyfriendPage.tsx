import React from 'react';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';

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
  const boyfriendProducts = products.filter((product) => product.category === 'boyfriend');

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
      </section>
    </div>
  );
};
