import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';
import { trackSearch } from '../utils/analytics';
import { performSmartSearch, VIETNAMESE_HOLIDAYS, SearchResultItem } from '../utils/searchEngine';

interface SmartSearchBarProps {
  products: Product[];
  onSelectProduct: (p: Product) => void;
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  className?: string;
  initialQuery?: string;
  autoFocus?: boolean;
}

export const SmartSearchBar: React.FC<SmartSearchBarProps> = ({
  products,
  onSelectProduct,
  onSearchSubmit,
  placeholder = 'Tìm thông minh: dịp 20/10, 8/3, 19/11, bạn gái, dưới 300k...',
  className = '',
  initialQuery = '',
  autoFocus = false,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync initial query if changed
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute live instant search results
  const searchResults: SearchResultItem[] = React.useMemo(() => {
    if (!query.trim()) return [];
    return performSmartSearch(products, query.trim()).slice(0, 5);
  }, [products, query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackSearch(query);
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit(query.trim());
    }
  };

  const handleSelectQuickTag = (tagQuery: string) => {
    trackSearch(tagQuery);
    setQuery(tagQuery);
    if (onSearchSubmit) {
      onSearchSubmit(tagQuery);
    }
    setIsOpen(true);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleClear = () => {
    setQuery('');
    setIsOpen(false);
    if (onSearchSubmit) {
      onSearchSubmit('');
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form
        onSubmit={handleSubmit}
        className="relative flex items-center w-full rounded-2xl bg-white border border-[#eee7e3] shadow-xs hover:border-[#d53a4c]/50 focus-within:border-[#b21e36] focus-within:ring-2 focus-within:ring-[#b21e36]/15 transition-all pl-3.5 pr-1.5 py-1"
      >
        <div className="flex items-center pointer-events-none text-[#b21e36] mr-2 shrink-0">
          <span className="material-symbols-outlined text-[20px]">search</span>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="flex-1 min-w-0 py-2 text-xs sm:text-sm text-[#1e1b19] placeholder:text-[#8a7273] bg-transparent outline-none font-medium"
        />

        {/* Action Buttons: Clear "X" positioned to the left of the "Tìm" button */}
        <div className="flex items-center gap-1.5 shrink-0 ml-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="w-7 h-7 flex items-center justify-center text-[#8a7273] hover:text-[#b21e36] rounded-full hover:bg-[#f4ece8] active:scale-95 transition-colors cursor-pointer"
              title="Xóa tìm kiếm"
              aria-label="Xóa nội dung tìm kiếm"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          )}

          {/* Search Submit Icon Button */}
          <button
            type="submit"
            title="Tìm kiếm"
            className="px-3.5 py-1.5 rounded-xl bg-[#b21e36] hover:bg-[#d53a4c] text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 shadow-2xs"
          >
            <span className="hidden sm:inline">Tìm</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      </form>

      {/* Live Dropdown Results */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-[#eee7e3] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">
          {/* Quick Vietnamese Holidays Pills */}
          <div className="p-3 bg-[#fff8f5] border-b border-[#eee7e3]">
            <div className="flex items-center justify-between text-[11px] font-bold text-[#6b4b4e] mb-2 uppercase tracking-wider">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#b21e36]">calendar_month</span>
                Dịp lễ &amp; sự kiện tại Việt Nam:
              </span>
              <span className="text-[10px] text-[#8a7273] font-normal normal-case">Nhấn để lọc nhanh</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {VIETNAMESE_HOLIDAYS.slice(0, 6).map((h) => (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => handleSelectQuickTag(h.shortName)}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#ffdada] border border-[#e8d5cf] hover:border-[#b21e36]/30 text-xs text-[#5a4041] hover:text-[#b21e36] font-semibold transition-all flex items-center gap-1 cursor-pointer shadow-2xs"
                >
                  <span>{h.icon}</span>
                  <span>{h.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Results List */}
          {query.trim() && searchResults.length > 0 ? (
            <div className="divide-y divide-[#eee7e3] max-h-[380px] overflow-y-auto">
              <div className="px-4 py-2 bg-[#fbf6f3] text-[11px] font-semibold text-[#8a7273] flex items-center justify-between">
                <span>Tìm thấy {searchResults.length} món quà khớp nhất:</span>
                <span className="text-[#b21e36] font-bold">Tìm kiếm thông minh</span>
              </div>
              {searchResults.map(({ product, matchedReasons }) => (
                <div
                  key={product.id}
                  onClick={() => {
                    trackSearch(query);
                    onSelectProduct(product);
                    setIsOpen(false);
                  }}
                  className="p-3 hover:bg-[#fff5f5] transition-colors cursor-pointer flex items-center gap-3.5 group"
                >
                  <img
                    src={product.image}
                    alt={product.title}
                    className="w-13 h-13 rounded-xl object-cover shrink-0 border border-[#eee7e3] group-hover:scale-105 transition-transform"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      {matchedReasons.map((r, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 rounded-md bg-[#ffdada] text-[#b21e36] text-[10px] font-bold"
                        >
                          {r}
                        </span>
                      ))}
                      {product.badge && (
                        <span className="text-[10px] text-[#8a7273] font-medium truncate">
                          • {product.badge}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#1e1b19] group-hover:text-[#b21e36] transition-colors line-clamp-1">
                      {product.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs sm:text-sm font-black text-[#b21e36]">
                        {product.price.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[11px] text-[#8a7273] line-through">
                        {product.originalPrice.toLocaleString('vi-VN')}đ
                      </span>
                      <span className="text-[10px] text-[#5a4041] ml-auto flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[13px] text-amber-500 fill-amber-500">
                          star
                        </span>
                        {product.rating} ({product.soldCount})
                      </span>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-[18px] text-[#c4b5b6] group-hover:text-[#b21e36] group-hover:translate-x-0.5 transition-all">
                    chevron_right
                  </span>
                </div>
              ))}

              <div className="p-2.5 bg-[#fbf6f3] text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full py-2 rounded-xl bg-[#ffdada] hover:bg-[#b21e36] text-[#b21e36] hover:text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  Xem chi tiết tất cả kết quả cho &ldquo;{query}&rdquo; →
                </button>
              </div>
            </div>
          ) : query.trim() ? (
            <div className="p-6 text-center">
              <span className="material-symbols-outlined text-[36px] text-[#d53a4c] mb-2">
                sentiment_dissatisfied
              </span>
              <p className="text-sm font-bold text-[#1e1b19]">
                Không tìm thấy món quà hoàn toàn khớp &ldquo;{query}&rdquo;
              </p>
              <p className="text-xs text-[#8a7273] mt-1 max-w-sm mx-auto">
                Gợi ý: Thử tìm theo dịp như <b>20/10</b>, <b>8/3</b>, <b>19/11</b>, <b>20/11</b> hoặc mức giá như <b>dưới 300k</b>
              </p>
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                <button
                  type="button"
                  onClick={() => handleSelectQuickTag('20/10')}
                  className="px-2.5 py-1 rounded-full bg-[#ffdada] text-[#b21e36] text-xs font-bold cursor-pointer"
                >
                  🌹 Quà 20/10 Phụ Nữ VN
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickTag('19/11')}
                  className="px-2.5 py-1 rounded-full bg-[#f4ece8] text-[#1e1b19] text-xs font-bold cursor-pointer"
                >
                  👔 Quà 19/11 Nam Giới
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectQuickTag('20/11')}
                  className="px-2.5 py-1 rounded-full bg-[#f4ece8] text-[#1e1b19] text-xs font-bold cursor-pointer"
                >
                  📚 Quà 20/11 Thầy Cô
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4">
              <div className="text-[11px] font-bold text-[#8a7273] uppercase tracking-wider mb-2">
                Gợi ý tìm kiếm phổ biến:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
                {[
                  { q: 'Quà 20/10 cho bạn gái dưới 300k', icon: 'favorite' },
                  { q: 'Quà 19/11 cho bạn trai thiết thực', icon: 'male' },
                  { q: 'Quà 20/11 tri ân thầy cô giáo', icon: 'school' },
                  { q: 'Quà sức khỏe báo hiếu bố mẹ', icon: 'health_and_safety' },
                  { q: 'Quà sinh nhật độc lạ Gen Z', icon: 'cake' },
                  { q: 'Quà đồng nghiệp văn phòng chia tay', icon: 'business_center' },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectQuickTag(item.q)}
                    className="flex items-center gap-2 p-2 rounded-xl hover:bg-[#fff5f5] text-left text-[#5a4041] hover:text-[#b21e36] font-medium transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[16px] text-[#b21e36]">
                      {item.icon}
                    </span>
                    <span>{item.q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
