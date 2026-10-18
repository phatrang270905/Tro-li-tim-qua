import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { trackSearch } from '../utils/analytics';
import { performSmartSearch, VIETNAMESE_HOLIDAYS, SearchResultItem } from '../utils/searchEngine';

interface SmartSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onShowAllResults?: (query: string) => void;
}

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onShowAllResults,
}) => {
  const [query, setQuery] = useState('');
  const [activeHoliday, setActiveHoliday] = useState<string | null>(null);

  // Keyboard shortcut listener: Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute live search results
  const searchResults: SearchResultItem[] = React.useMemo(() => {
    let effectiveQuery = query.trim();
    if (activeHoliday) {
      effectiveQuery = effectiveQuery ? `${effectiveQuery} ${activeHoliday}` : activeHoliday;
    }
    return performSmartSearch(products, effectiveQuery);
  }, [products, query, activeHoliday]);

  if (!isOpen) return null;

  const handleSelectHoliday = (holidayName: string) => {
    if (activeHoliday === holidayName) {
      setActiveHoliday(null);
    } else {
      setActiveHoliday(holidayName);
    }
  };

  const handleClearAll = () => {
    setQuery('');
    setActiveHoliday(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-16 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-[#eee7e3] overflow-hidden z-10 flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
        {/* Header / Search Input */}
        <div className="p-4 sm:p-5 border-b border-[#eee7e3] bg-[#fff8f5]">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-full bg-[#ffdada] text-[#b21e36] flex items-center justify-center font-bold">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              </span>
              <div>
                <h3 className="font-extrabold text-base text-[#1e1b19] leading-tight">
                  Tìm Kiếm Quà Tặng Thông Minh
                </h3>
                <p className="text-[11px] text-[#5a4041]">
                  Gõ dịp lễ (20/10, 8/3, 19/11...), đối tượng, hoặc ngân sách
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-[#f4ece8] hover:bg-[#ffdada] text-[#5a4041] hover:text-[#b21e36] flex items-center justify-center transition-colors cursor-pointer"
              title="Đóng"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>

          {/* Large Search Input */}
          <div className="relative flex items-center rounded-2xl bg-white border-2 border-[#b21e36]/30 focus-within:border-[#b21e36] shadow-sm transition-all px-3.5 py-1">
            <span className="material-symbols-outlined text-[22px] text-[#b21e36] mr-2">
              search
            </span>
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="VD: Quà 20/10 bạn gái, quà 19/11 cho chàng, quà 20/11..."
              className="w-full py-2.5 text-sm sm:text-base text-[#1e1b19] placeholder:text-[#8a7273] bg-transparent outline-none font-semibold"
            />
            {(query || activeHoliday) && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-xs text-[#8a7273] hover:text-[#b21e36] font-bold px-2 py-1 rounded-lg hover:bg-[#f4ece8] transition-colors cursor-pointer whitespace-nowrap"
              >
                Xóa lọc
              </button>
            )}
          </div>

          {/* Quick Vietnamese Holidays Pills */}
          <div className="mt-3">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#6b4b4e] mb-1.5 flex items-center gap-1">
              <span className="material-symbols-outlined text-[13px] text-[#b21e36]">
                celebration
              </span>
              Lọc theo ngày lễ Việt Nam:
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-18 overflow-y-auto pr-1">
              {VIETNAMESE_HOLIDAYS.map((h) => {
                const isSelected = activeHoliday === h.name;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => handleSelectHoliday(h.name)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer border ${
                      isSelected
                        ? 'bg-[#b21e36] text-white border-[#b21e36] shadow-xs'
                        : 'bg-white hover:bg-[#ffdada] text-[#5a4041] border-[#eee7e3]'
                    }`}
                  >
                    <span>{h.icon}</span>
                    <span>{h.shortName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 divide-y divide-[#eee7e3]/70">
          <div className="flex items-center justify-between pb-3 text-xs font-bold text-[#5a4041]">
            <span>
              Tìm thấy <strong className="text-[#b21e36]">{searchResults.length}</strong> món quà phù hợp
            </span>
            <span className="text-[11px] text-[#8a7273] font-normal">
              Sắp xếp theo độ chuẩn gu
            </span>
          </div>

          {searchResults.length > 0 ? (
            <div className="space-y-3 pt-3">
              {searchResults.map(({ product, matchedReasons }) => (
                <div
                  key={product.id}
                  onClick={() => {
                    trackSearch(query || activeHoliday || '');
                    onSelectProduct(product);
                    onClose();
                  }}
                  className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#fff8f5]/60 hover:bg-[#ffdada]/30 border border-[#eee7e3] hover:border-[#b21e36]/30 transition-all cursor-pointer group"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover shrink-0 border border-[#eee7e3] group-hover:scale-102 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      {matchedReasons.map((reason, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-full bg-[#ffdada] text-[#b21e36] text-[10px] font-bold"
                        >
                          {reason}
                        </span>
                      ))}
                      {product.badge && (
                        <span className="text-[10px] font-bold text-[#2e7d32] bg-[#e8f5e9] px-2 py-0.5 rounded-full">
                          {product.badge}
                        </span>
                      )}
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-[#1e1b19] group-hover:text-[#b21e36] transition-colors line-clamp-1">
                      {product.title}
                    </h4>

                    <p className="text-[11px] text-[#5a4041] line-clamp-1 mt-0.5 hidden sm:block">
                      {product.psychologicalInsight}
                    </p>

                    <div className="flex items-center gap-3 mt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-sm sm:text-base font-black text-[#b21e36]">
                          {product.price.toLocaleString('vi-VN')}đ
                        </span>
                        <span className="text-[11px] text-[#8a7273] line-through">
                          {product.originalPrice.toLocaleString('vi-VN')}đ
                        </span>
                      </div>
                      <span className="text-[11px] text-[#5a4041] flex items-center gap-0.5 ml-auto">
                        <span className="material-symbols-outlined text-[13px] text-amber-500 fill-amber-500">
                          star
                        </span>
                        {product.rating} ({product.soldCount})
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 p-2 rounded-xl bg-white group-hover:bg-[#b21e36] text-[#b21e36] group-hover:text-white transition-colors shadow-2xs">
                    <span className="material-symbols-outlined text-[18px]">
                      visibility
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[48px] text-[#d53a4c] mb-2">
                sentiment_dissatisfied
              </span>
              <h4 className="font-extrabold text-base text-[#1e1b19]">
                Chưa tìm thấy món quà phù hợp với bộ lọc hiện tại
              </h4>
              <p className="text-xs text-[#5a4041] mt-1 max-w-md mx-auto">
                Hãy thử tìm kiếm với từ khóa ngắn gọn hơn hoặc chọn nhanh các ngày lễ nổi bật dưới đây.
              </p>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveHoliday('20/10 (Phụ nữ Việt Nam)');
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#ffdada] text-[#b21e36] text-xs font-bold hover:bg-[#b21e36] hover:text-white transition-colors cursor-pointer"
                >
                  🌹 Xem quà 20/10
                </button>
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveHoliday('19/11 (Quốc tế Nam giới)');
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#f4ece8] text-[#1e1b19] text-xs font-bold hover:bg-[#b21e36] hover:text-white transition-colors cursor-pointer"
                >
                  👔 Xem quà 19/11
                </button>
                <button
                  onClick={() => {
                    setQuery('');
                    setActiveHoliday('20/11 (Nhà giáo Việt Nam)');
                  }}
                  className="px-3 py-1.5 rounded-full bg-[#f4ece8] text-[#1e1b19] text-xs font-bold hover:bg-[#b21e36] hover:text-white transition-colors cursor-pointer"
                >
                  📚 Xem quà 20/11
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-[#fbf6f3] border-t border-[#eee7e3] flex items-center justify-between text-[11px] text-[#8a7273]">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-[#2e7d32]">verified</span>
            Liên kết trực tiếp tới Shopee Mall &amp; TikTok Shop chính hãng
          </span>
          {onShowAllResults && searchResults.length > 0 && (
            <button
              onClick={() => {
                trackSearch(query || activeHoliday || '');
                onShowAllResults(query || activeHoliday || '');
                onClose();
              }}
              className="font-bold text-[#b21e36] hover:underline cursor-pointer"
            >
              Xem trên trang chính →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
