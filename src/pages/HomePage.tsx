import React, { useState, useMemo } from 'react';
import { Product, QuizState, PageTab } from '../types';
import { ProductCard } from '../components/ProductCard';
import { SmartSearchBar } from '../components/SmartSearchBar';
import {
  performSmartSearch,
  VIETNAMESE_HOLIDAYS,
} from '../utils/searchEngine';

interface HomePageProps {
  products: Product[];
  wishlistIds: Set<string>;
  onToggleWishlist: (p: Product) => void;
  onOpenDetail: (p: Product) => void;
  onNavigateTab: (tab: PageTab) => void;
  onShowToast: (msg: string) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  products,
  wishlistIds,
  onToggleWishlist,
  onOpenDetail,
  onNavigateTab,
  onShowToast,
}) => {
  const [quizState, setQuizState] = useState<QuizState>({
    recipient: 'Người yêu (Nam/Nữ)',
    occasion: '20/10 (Phụ nữ Việt Nam)',
    budget: 'Vừa vặn (150k - 300k)',
    vibe: 'Lãng mạn & Tinh tế',
    searchQuery: '',
  });

  const [selectedHolidayFilter, setSelectedHolidayFilter] = useState<string | null>(null);
  const [activePersonaFilter, setActivePersonaFilter] = useState<string | null>(null);
  const [activeContextFilter, setActiveContextFilter] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [loadingMore, setLoadingMore] = useState(false);

  // Recipient options
  const recipientOptions = [
    { label: 'Người yêu', sub: 'Nam / Nữ / Crush', value: 'Người yêu (Nam/Nữ)', icon: 'favorite' },
    { label: 'Bạn thân', sub: 'Chí cốt / Tri kỷ', value: 'Bạn thân chí cốt', icon: 'diversity_1' },
    { label: 'Bố Mẹ', sub: 'Gia đình yêu thương', value: 'Bố Mẹ / Gia đình', icon: 'family_restroom' },
    { label: 'Đồng nghiệp', sub: 'Sếp / Đối tác', value: 'Đồng nghiệp / Sếp', icon: 'business_center' },
    { label: 'Bé yêu', sub: 'Con cháu / Em nhỏ', value: 'Bé yêu / Em nhỏ', icon: 'child_care' },
    { label: 'Tự thưởng', sub: 'Yêu thương bản thân', value: 'Tự thưởng bản thân', icon: 'self_improvement' },
  ];

  // Occasion options including comprehensive Vietnamese holidays
  const occasionOptions = [
    { label: '20/10 Phụ Nữ VN', icon: '🌹', value: '20/10 (Phụ nữ Việt Nam)', badge: 'Sắp tới', date: '20/10' },
    { label: '8/3 Quốc Tế Phụ Nữ', icon: '🌷', value: '8/3 (Quốc tế Phụ nữ)', badge: 'Hot', date: '08/03' },
    { label: '19/11 Nam Giới', icon: '👔', value: '19/11 (Quốc tế Nam giới)', badge: 'Mới', date: '19/11' },
    { label: '20/11 Tri Ân Thầy Cô', icon: '📚', value: '20/11 (Nhà giáo Việt Nam)', badge: 'Tri ân', date: '20/11' },
    { label: 'Tết Cổ Truyền', icon: '🧧', value: 'Tết Nguyên Đán & Năm Mới', badge: 'Sum vầy', date: 'Tháng 1-2' },
    { label: 'Valentine 14/2', icon: '💖', value: '14/2 & 14/3 (Valentine Lễ Tình Nhân)', badge: 'Tình yêu', date: '14/02' },
    { label: 'Vu Lan Báo Hiếu', icon: '🌸', value: 'Vu Lan Báo Hiếu & Ngày Bố Mẹ', badge: 'Sức khỏe', date: 'Tháng 7' },
    { label: 'Sinh nhật ý nghĩa', icon: '🎂', value: 'Sinh nhật ý nghĩa', badge: 'Quanh năm', date: 'Mọi ngày' },
    { label: 'Kỷ niệm ngày yêu', icon: '💑', value: 'Kỷ niệm ngày yêu / ngày cưới', badge: 'Lãng mạn', date: 'Riêng tư' },
    { label: 'Giáng sinh / Noel', icon: '🎄', value: 'Giáng sinh / Noel', badge: 'Mùa đông', date: '24-25/12' },
    { label: 'Thăng tiến / Chia tay', icon: '💼', value: 'Thăng tiến / Tốt nghiệp / Chia tay', badge: 'Công sở', date: 'Sự nghiệp' },
    { label: 'Quà bất ngờ', icon: '✨', value: 'Quà bất ngờ (Không dịp gì)', badge: 'Ngẫu hứng', date: 'Bất ngờ' },
  ];

  // Budget options
  const budgetOptions = [
    { name: 'Hạt dẻ', range: '< 150.000đ', badge: 'Tiết kiệm', value: 'Hạt dẻ (< 150k)' },
    { name: 'Vừa vặn', range: '150k - 300.000đ', badge: 'Phổ biến', value: 'Vừa vặn (150k - 300k)' },
    { name: 'Chu đáo', range: '300k - 500.000đ', badge: 'Trang trọng', value: 'Chu đáo (300k - 500k)' },
    { name: 'Cao cấp', range: '> 500.000đ', badge: 'VIP', value: 'Cao cấp (> 500k)' },
  ];

  // Vibe options
  const vibeOptions = [
    { title: 'Lãng mạn & Tinh tế', desc: 'Ấm áp, kỷ niệm, thơ', icon: 'sentiment_very_satisfied' },
    { title: 'Thực tế & Tiện ích', desc: 'Dùng mỗi ngày, đa năng', icon: 'handyman' },
    { title: 'Yêu công nghệ & Độc lạ', desc: 'Trendy, gadget, bắt mắt', icon: 'devices' },
    { title: 'Chill & Chữa lành', desc: 'Nến thơm, thảo mộc, thư giãn', icon: 'spa' },
  ];

  // Intelligent Search and Dynamic Filtering with performSmartSearch
  const searchResultsWithReasons = useMemo(() => {
    let effectiveQuery = quizState.searchQuery?.trim() || '';
    if (selectedHolidayFilter) {
      effectiveQuery = effectiveQuery ? `${effectiveQuery} ${selectedHolidayFilter}` : selectedHolidayFilter;
    }

    if (effectiveQuery) {
      const searchItems = performSmartSearch(products, effectiveQuery);
      return searchItems.map((item) => ({
        product: item.product,
        matchedReason: item.matchedReasons[0] || 'Phù hợp tìm kiếm'
      }));
    }

    // Default: Filter based on quiz selections
    const scoredList = products.map((p) => {
      let score = 0;
      let matchedReason = '';

      // Match recipient
      if (p.recipientTypes.includes(quizState.recipient)) {
        score += 30;
        matchedReason = `Hợp cho ${quizState.recipient.split('/')[0].trim()}`;
      }

      // Match occasion (especially Vietnamese holidays like 20/10, 8/3, 19/11, 20/11)
      if (p.occasions.includes(quizState.occasion)) {
        score += 35;
        matchedReason = `Chuẩn dịp ${quizState.occasion.split('(')[0].trim()}`;
      }

      // Match vibe
      if (p.vibes.includes(quizState.vibe)) {
        score += 15;
      }

      // Persona chip filter
      if (activePersonaFilter) {
        if (activePersonaFilter.includes('văn phòng') && p.category === 'colleague') score += 20;
        if (activePersonaFilter.includes('bỉm sữa') && p.recipientTypes.includes('Bố Mẹ / Gia đình')) score += 20;
      }

      // Context chip filter
      if (activeContextFilter) {
        if (activeContextFilter.includes('100 ngày') && p.category === 'girlfriend') score += 20;
        if (activeContextFilter.includes('chuyển việc') && p.category === 'colleague') score += 20;
      }

      return {
        product: p,
        score,
        matchedReason: matchedReason || p.badge || 'Gợi ý chuẩn gu'
      };
    });

    scoredList.sort((a, b) => b.score - a.score);
    return scoredList;
  }, [products, quizState, selectedHolidayFilter, activePersonaFilter, activeContextFilter]);

  const filteredProducts = useMemo(() => {
    return searchResultsWithReasons.map((item) => item.product);
  }, [searchResultsWithReasons]);

  const handleSmartSearchSubmit = (query: string) => {
    setQuizState((prev) => ({ ...prev, searchQuery: query }));
    if (query) {
      onShowToast(`🎯 Tìm kiếm thông minh: "${query}"`);
    }
    const el = document.getElementById('recommendations');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const applyQuickHoliday = (holidayName: string, recipient?: string) => {
    setQuizState((prev) => ({
      ...prev,
      occasion: holidayName,
      recipient: recipient || prev.recipient,
      searchQuery: '',
    }));
    setSelectedHolidayFilter(holidayName);
    onShowToast(`🌹 Đã chọn dịp: ${holidayName}`);
    const el = document.getElementById('recommendations');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const applyQuickTrend = (rec: string, occ: string, bud: string) => {
    setQuizState((prev) => ({
      ...prev,
      recipient: rec,
      occasion: occ,
      budget: bud,
      searchQuery: '',
    }));
    setSelectedHolidayFilter(null);
    onShowToast(`✨ Đã áp dụng gợi ý: ${rec} • ${occ}`);
    const el = document.getElementById('recommendations');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLoadMore = () => {
    setLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => prev + 4);
      setLoadingMore(false);
      onShowToast('Đã tải thêm các gợi ý quà tặng phù hợp!');
    }, 500);
  };

  return (
    <div className="w-full">
      {/* Top Ambient Glow Orb */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[820px] h-[360px] bg-gradient-to-b from-[#ffdada]/60 via-[#ffdbd1]/30 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />

        {/* Hero Section Container */}
        <div className="max-w-[1080px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-10 flex flex-col gap-10">
          {/* Hero Header */}
          <section className="flex flex-col items-center text-center gap-6">
            {/* Trust Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/80 shadow-xs border border-[#eee7e3] backdrop-blur-md">
              <span className="inline-flex w-2 h-2 rounded-full bg-[#ff5722] animate-ping" />
              <span className="inline-flex w-2 h-2 rounded-full bg-[#ff5722] -ml-4" />
              <span className="text-xs md:text-sm font-semibold text-[#1e1b19]">
                50,000+ quà tặng đã ghép đôi chuẩn gu
              </span>
              <span className="text-[#8e7070] font-bold">|</span>
              <span className="text-xs font-bold text-[#b21e36] uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px]">verified</span>
                Shopee Mall &amp; TikTok Shop
              </span>
            </div>

            {/* Main Headline */}
            <div className="flex flex-col gap-3 max-w-[850px]">
              <h1 className="text-3xl sm:text-4xl md:text-[46px] md:leading-[54px] font-extrabold tracking-tight text-[#1e1b19]">
                Không Còn Đau Đầu Nghĩ Mua Quà Gì — <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-[#b21e36] via-[#d53a4c] to-[#ff5722] bg-clip-text text-transparent">
                  Trợ Lý Ảo Gợi Ý Chuẩn Gu
                </span>{' '}
                Sau 30 Giây!
              </h1>
              <p className="text-sm md:text-base text-[#5a4041] max-w-[700px] mx-auto leading-relaxed">
                Hệ thống phân tích tâm lý người nhận thông minh, tự động lọc gian hàng chính hãng 4.8★+, so sánh mã giảm giá tức thì giúp bạn tặng quà trúng tim mà vẫn nhẹ ví.
              </p>
            </div>

            {/* AI Natural Prompt Smart Search Bar */}
            <div className="w-full max-w-[780px]">
              <SmartSearchBar
                products={products}
                onSelectProduct={onOpenDetail}
                onSearchSubmit={handleSmartSearchSubmit}
                initialQuery={quizState.searchQuery}
                placeholder="Tìm thông minh: dịp 20/10, 8/3, 19/11, bạn gái, sức khỏe bố mẹ..."
              />
            </div>

            {/* Vietnamese Holidays & Trending Quick Hints */}
            <div className="flex flex-col items-center gap-2.5 text-xs text-[#5a4041] w-full max-w-[850px]">
              <div className="flex flex-wrap justify-center items-center gap-1.5">
                <span className="text-[#8e7070] font-bold uppercase tracking-wider text-[11px] mr-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#b21e36]">celebration</span>
                  Dịp lễ Việt Nam:
                </span>
                <button
                  type="button"
                  onClick={() => applyQuickHoliday('20/10 (Phụ nữ Việt Nam)', 'Người yêu (Nam/Nữ)')}
                  className="px-3 py-1.5 rounded-full bg-[#ffdada] hover:bg-[#b21e36] text-[#b21e36] hover:text-white transition-all cursor-pointer font-bold shadow-2xs flex items-center gap-1"
                >
                  <span>🌹</span>
                  <span>20/10 Phụ Nữ VN</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickHoliday('8/3 (Quốc tế Phụ nữ)', 'Người yêu (Nam/Nữ)')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#ffdada] border border-[#eee7e3] text-[#1e1b19] hover:text-[#b21e36] transition-all cursor-pointer font-bold shadow-2xs flex items-center gap-1"
                >
                  <span>🌷</span>
                  <span>8/3 Quốc Tế Phụ Nữ</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickHoliday('19/11 (Quốc tế Nam giới)', 'Người yêu (Nam/Nữ)')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f4ece8] border border-[#eee7e3] text-[#1e1b19] hover:text-[#b21e36] transition-all cursor-pointer font-bold shadow-2xs flex items-center gap-1"
                >
                  <span>👔</span>
                  <span>19/11 Nam Giới</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickHoliday('20/11 (Nhà giáo Việt Nam)', 'Đồng nghiệp / Sếp')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f4ece8] border border-[#eee7e3] text-[#1e1b19] hover:text-[#b21e36] transition-all cursor-pointer font-bold shadow-2xs flex items-center gap-1"
                >
                  <span>📚</span>
                  <span>20/11 Thầy Cô</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickHoliday('Vu Lan Báo Hiếu & Ngày Bố Mẹ', 'Bố Mẹ / Gia đình')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f4ece8] border border-[#eee7e3] text-[#1e1b19] hover:text-[#b21e36] transition-all cursor-pointer font-bold shadow-2xs flex items-center gap-1"
                >
                  <span>🌸</span>
                  <span>Vu Lan Báo Hiếu</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyQuickHoliday('Tết Nguyên Đán & Năm Mới', 'Bố Mẹ / Gia đình')}
                  className="px-3 py-1.5 rounded-full bg-white hover:bg-[#f4ece8] border border-[#eee7e3] text-[#1e1b19] hover:text-[#b21e36] transition-all cursor-pointer font-bold shadow-2xs flex items-center gap-1"
                >
                  <span>🧧</span>
                  <span>Tết Cổ Truyền</span>
                </button>
              </div>
            </div>

            {/* ================= INTERACTIVE 30S QUIZ WIZARD ================= */}
            <div
              id="quizWizard"
              className="w-full bg-white rounded-3xl p-5 sm:p-7 md:p-8 shadow-xl shadow-black/5 mt-4 text-left border border-[#eee7e3]"
            >
              {/* Wizard Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 gap-2 border-b border-[#eee7e3]/60">
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-full bg-[#ffdada] flex items-center justify-center text-[#b21e36] font-extrabold text-sm">
                    30s
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base md:text-lg text-[#1e1b19]">
                      Bộ Trắc Nghiệm Tìm Quà Trúng Tim
                    </h3>
                    <p className="text-xs text-[#5a4041]">
                      Chọn 4 bước đơn giản để trợ lý phân tích chân dung &amp; lọc quà phù hợp
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 self-start sm:self-auto bg-[#faf2ee] px-3 py-1 rounded-full text-xs font-semibold text-[#b21e36]">
                  <span className="w-2 h-2 rounded-full bg-[#b21e36] animate-pulse" />
                  <span>Trắc nghiệm cá nhân hóa</span>
                </div>
              </div>

              {/* Step 1: Who is the recipient */}
              <div className="pt-6 space-y-6">
                <div>
                  <label className="flex items-center gap-1.5 text-sm md:text-base font-bold text-[#1e1b19] mb-2.5">
                    <span className="material-symbols-outlined text-[#b21e36] text-[20px]">
                      person_heart
                    </span>
                    1. Bạn muốn tặng quà cho ai?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                    {recipientOptions.map((opt) => {
                      const isSelected = quizState.recipient === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setQuizState((prev) => ({ ...prev, recipient: opt.value }))}
                          className={`flex flex-col items-center justify-center p-3 rounded-2xl transition-all cursor-pointer text-center group ${
                            isSelected
                              ? 'bg-[#ffdada] text-[#b21e36] ring-2 ring-[#b21e36] shadow-xs'
                              : 'bg-[#faf2ee] text-[#1e1b19] hover:bg-[#eee7e3]'
                          }`}
                        >
                          <span
                            className={`material-symbols-outlined text-[24px] mb-1 group-hover:scale-110 transition-transform ${
                              isSelected ? 'text-[#b21e36]' : 'text-[#5a4041]'
                            }`}
                          >
                            {opt.icon}
                          </span>
                          <span className="text-xs font-bold">{opt.label}</span>
                          <span className="text-[10px] text-[#8e7070] mt-0.5">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 2: Occasion */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <label className="flex items-center gap-1.5 text-sm md:text-base font-bold text-[#1e1b19]">
                      <span className="material-symbols-outlined text-[#ff5722] text-[20px]">
                        celebration
                      </span>
                      2. Dịp tặng quà này là gì?
                    </label>
                    <span className="text-[11px] text-[#b21e36] font-semibold bg-[#ffdada]/60 px-2 py-0.5 rounded-full">
                      Tích hợp đầy đủ ngày lễ Việt Nam
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                    {occasionOptions.map((occ) => {
                      const isSelected = quizState.occasion === occ.value;
                      return (
                        <button
                          key={occ.value}
                          type="button"
                          onClick={() => {
                            setQuizState((prev) => ({
                              ...prev,
                              occasion: occ.value,
                            }));
                            setSelectedHolidayFilter(null);
                          }}
                          className={`p-2.5 sm:p-3 rounded-2xl text-left transition-all cursor-pointer relative border ${
                            isSelected
                              ? 'bg-[#ffdada] text-[#b21e36] border-[#b21e36] ring-2 ring-[#b21e36] shadow-xs'
                              : 'bg-[#faf2ee] text-[#1e1b19] border-transparent hover:bg-[#eee7e3]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-xl">{occ.icon}</span>
                            {occ.badge && (
                              <span
                                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                                  isSelected
                                    ? 'bg-[#b21e36] text-white'
                                    : 'bg-white text-[#8e7070] border border-[#eee7e3]'
                                }`}
                              >
                                {occ.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-bold leading-tight">{occ.label}</div>
                          <div className="text-[10px] text-[#8e7070] mt-0.5">{occ.date}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 3: Budget */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm md:text-base font-bold text-[#1e1b19] mb-2.5">
                    <span className="material-symbols-outlined text-[#b21e36] text-[20px]">
                      payments
                    </span>
                    3. Ngân sách dự kiến bạn mong muốn?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {budgetOptions.map((bud) => {
                      const isSelected = quizState.budget === bud.value;
                      return (
                        <button
                          key={bud.value}
                          type="button"
                          onClick={() => setQuizState((prev) => ({ ...prev, budget: bud.value }))}
                          className={`p-3 rounded-2xl text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ffdada] text-[#b21e36] ring-2 ring-[#b21e36]'
                              : 'bg-[#faf2ee] text-[#1e1b19] hover:bg-[#eee7e3]'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-xs font-bold">{bud.name}</span>
                            <span className="text-[10px] bg-white/70 px-2 py-0.5 rounded-full font-medium">
                              {bud.badge}
                            </span>
                          </div>
                          <span className="text-xs font-extrabold text-[#b21e36]">
                            {bud.range}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Step 4: Vibe / Style */}
                <div>
                  <label className="flex items-center gap-1.5 text-sm md:text-base font-bold text-[#1e1b19] mb-2.5">
                    <span className="material-symbols-outlined text-[#ff5722] text-[20px]">
                      palette
                    </span>
                    4. Phong cách đặc trưng của người nhận?
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {vibeOptions.map((v) => {
                      const isSelected = quizState.vibe === v.title;
                      return (
                        <button
                          key={v.title}
                          type="button"
                          onClick={() => setQuizState((prev) => ({ ...prev, vibe: v.title }))}
                          className={`p-3 rounded-2xl text-center transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-[#ffdada] text-[#b21e36] ring-2 ring-[#b21e36]'
                              : 'bg-[#faf2ee] text-[#1e1b19] hover:bg-[#eee7e3]'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[#b21e36] block mx-auto mb-1 text-[22px]">
                            {v.icon}
                          </span>
                          <span className="text-xs font-bold block">{v.title}</span>
                          <span className="text-[10px] text-[#8e7070] block mt-0.5">{v.desc}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Wizard Submit Bar */}
              <div className="mt-8 pt-4 border-t border-[#eee7e3] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-[#5a4041] flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[#b21e36] text-[18px]">
                    verified_user
                  </span>
                  <span>100% link Shopee Mall &amp; TikTok Shop chính hãng có bảo hành</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('recommendations');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                    onShowToast('🎯 Đã làm mới danh sách gợi ý theo lựa chọn của bạn!');
                  }}
                  className="w-full sm:w-auto px-7 py-3 rounded-full bg-[#b21e36] hover:bg-[#d53a4c] text-white text-xs md:text-sm font-bold shadow-md shadow-[#b21e36]/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">magic_button</span>
                  <span>Nhận {filteredProducts.length} Gợi Ý Quà Chuẩn Gu Nhất</span>
                </button>
              </div>
            </div>
          </section>

          {/* ================= 2. RECOMMENDATION RESULTS ================= */}
          <section id="recommendations" className="scroll-mt-24 flex flex-col gap-6">
            {/* Header Filter Overview */}
            <div className="bg-[#faf2ee] rounded-3xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-[#eee7e3]">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5722]" />
                  <h2 className="text-lg md:text-xl font-extrabold text-[#1e1b19] tracking-tight">
                    Top Đề Xuất Quà Tuyển Chọn Dành Cho Bạn
                  </h2>
                </div>
                {/* Active Badges */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#5a4041]">
                  <span>Đang lọc theo:</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdada] text-[#b21e36] font-bold">
                    {quizState.recipient.split('(')[0].trim()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#1e1b19] font-medium border border-[#eee7e3]">
                    {quizState.occasion}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#ffdbd1] text-[#b02f00] font-bold">
                    {quizState.budget.split('(')[0].trim()}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-[#5a4041] font-medium border border-[#eee7e3]">
                    {quizState.vibe}
                  </span>
                  {quizState.searchQuery && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#1e1b19] text-white font-medium flex items-center gap-1">
                      "{quizState.searchQuery}"
                      <button
                        onClick={() => setQuizState((prev) => ({ ...prev, searchQuery: '' }))}
                        className="hover:text-red-400"
                      >
                        ×
                      </button>
                    </span>
                  )}
                  {selectedHolidayFilter && (
                    <span className="px-2.5 py-0.5 rounded-full bg-[#b21e36] text-white font-medium flex items-center gap-1">
                      {selectedHolidayFilter}
                      <button
                        onClick={() => setSelectedHolidayFilter(null)}
                        className="hover:text-amber-200"
                      >
                        ×
                      </button>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    const el = document.getElementById('quizWizard');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3.5 py-2 rounded-full bg-white hover:bg-[#eee7e3] text-[#1e1b19] text-xs font-semibold flex items-center gap-1 border border-[#eee7e3] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">tune</span>
                  Đổi tiêu chí
                </button>
                <div className="text-[11px] text-[#5a4041] bg-white px-3 py-2 rounded-full border border-[#eee7e3]">
                  ⚡ Cập nhật giá 5 phút trước
                </div>
              </div>
            </div>

            {/* Quick Holiday Filter Pills Above Grid */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
              <span className="text-xs font-bold text-[#8e7070] shrink-0 mr-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-[15px] text-[#b21e36]">filter_list</span>
                Lọc nhanh:
              </span>
              <button
                type="button"
                onClick={() => {
                  setSelectedHolidayFilter(null);
                  setQuizState((prev) => ({ ...prev, searchQuery: '' }));
                }}
                className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                  !selectedHolidayFilter && !quizState.searchQuery
                    ? 'bg-[#b21e36] text-white shadow-xs'
                    : 'bg-white text-[#5a4041] border border-[#eee7e3] hover:bg-[#ffdada]'
                }`}
              >
                Tất cả gợi ý ({products.length})
              </button>
              {VIETNAMESE_HOLIDAYS.map((h) => {
                const isSelected = selectedHolidayFilter === h.name || quizState.occasion === h.name;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => applyQuickHoliday(h.name)}
                    className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer transition-all flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-[#b21e36] text-white border-[#b21e36] shadow-xs'
                        : 'bg-white text-[#5a4041] border-[#eee7e3] hover:bg-[#ffdada] hover:text-[#b21e36]'
                    }`}
                  >
                    <span>{h.icon}</span>
                    <span>{h.shortName}</span>
                  </button>
                );
              })}
            </div>

            {/* Product Grid */}
            {searchResultsWithReasons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {searchResultsWithReasons.slice(0, visibleCount).map(({ product, matchedReason }) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    matchedReason={matchedReason}
                    isWishlisted={wishlistIds.has(product.id)}
                    onToggleWishlist={onToggleWishlist}
                    onOpenDetail={onOpenDetail}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-[#eee7e3]">
                <span className="material-symbols-outlined text-[48px] text-[#b21e36] mb-2">
                  search_off
                </span>
                <h3 className="font-extrabold text-lg text-[#1e1b19]">
                  Không tìm thấy món quà phù hợp
                </h3>
                <p className="text-xs sm:text-sm text-[#5a4041] mt-1 max-w-md mx-auto">
                  Hãy thử gõ từ khóa khác hoặc bấm chọn các dịp lễ đang hot dưới đây:
                </p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => applyQuickHoliday('20/10 (Phụ nữ Việt Nam)')}
                    className="px-3.5 py-1.5 rounded-full bg-[#ffdada] text-[#b21e36] text-xs font-bold cursor-pointer hover:bg-[#b21e36] hover:text-white transition-colors"
                  >
                    🌹 Quà 20/10
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickHoliday('19/11 (Quốc tế Nam giới)')}
                    className="px-3.5 py-1.5 rounded-full bg-[#f4ece8] text-[#1e1b19] text-xs font-bold cursor-pointer hover:bg-[#b21e36] hover:text-white transition-colors"
                  >
                    👔 Quà 19/11
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickHoliday('20/11 (Nhà giáo Việt Nam)')}
                    className="px-3.5 py-1.5 rounded-full bg-[#f4ece8] text-[#1e1b19] text-xs font-bold cursor-pointer hover:bg-[#b21e36] hover:text-white transition-colors"
                  >
                    📚 Quà 20/11
                  </button>
                </div>
              </div>
            )}

            {/* Load More Button */}
            {visibleCount < filteredProducts.length && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-8 py-3 rounded-full bg-[#f4ece8] hover:bg-[#eee7e3] text-[#1e1b19] text-xs md:text-sm font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {loadingMore ? (
                    <>
                      <span className="material-symbols-outlined text-[18px] animate-spin">
                        progress_activity
                      </span>
                      <span>Đang tải thêm quà chính hãng...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      <span>Xem thêm {filteredProducts.length - visibleCount} gợi ý khác</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </section>

          {/* ================= 3. ADVANCED INSIGHT FILTERS ================= */}
          <section className="bg-[#faf2ee] rounded-3xl p-5 md:p-8 flex flex-col gap-6 border border-[#eee7e3]">
            <div className="flex flex-col gap-1">
              <div className="inline-flex items-center gap-1.5 text-[#ff5722] font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]">filter_alt</span>
                Bộ Lọc Chuyên Sâu
              </div>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1e1b19]">
                Tìm Quà Theo Chân Dung &amp; Ngữ Cảnh Tế Nhị
              </h2>
              <p className="text-xs md:text-sm text-[#5a4041]">
                Chọn đúng tình huống cụ thể để chọn món quà không bị sượng hay dư thừa
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Persona Filter */}
              <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-xs border border-[#eee7e3]">
                <h4 className="font-bold text-sm text-[#1e1b19] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#b21e36] text-[20px]">
                    badge
                  </span>
                  Chân dung &amp; Thói quen người nhận
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    '🎓 Sinh viên tiết kiệm',
                    '💼 Dân văn phòng công sở',
                    '🎮 Gamer & Tín đồ công nghệ',
                    '📸 Thích decor & sống ảo',
                    '🐾 Hội con sen yêu mèo cún',
                    '🍼 Mẹ bỉm sữa hiện đại',
                  ].map((persona) => {
                    const isSelected = activePersonaFilter === persona;
                    return (
                      <button
                        key={persona}
                        type="button"
                        onClick={() => {
                          const next = isSelected ? null : persona;
                          setActivePersonaFilter(next);
                          if (next) onShowToast(`Đã lọc theo: ${persona}`);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#ffdada] text-[#b21e36] font-bold ring-1 ring-[#b21e36]'
                            : 'bg-[#faf2ee] hover:bg-[#eee7e3] text-[#1e1b19]'
                        }`}
                      >
                        {persona}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Context Filter */}
              <div className="bg-white rounded-2xl p-5 flex flex-col gap-3 shadow-xs border border-[#eee7e3]">
                <h4 className="font-bold text-sm text-[#1e1b19] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#ff5722] text-[20px]">
                    history_edu
                  </span>
                  Ngữ cảnh đặc biệt &amp; Khó chọn
                </h4>
                <div className="flex flex-wrap gap-2">
                  {[
                    '💌 Kỷ niệm 100 ngày / 1 năm yêu',
                    '❄️ Quà giữ ấm mùa đông Noel',
                    '👋 Chia tay đồng nghiệp chuyển việc',
                    '🥺 Quà xin lỗi làm lành ngọt ngào',
                    '🍵 Quà ra mắt phụ huynh người yêu',
                    '🏠 Quà tân gia nhà mới mang lại may mắn',
                  ].map((ctx) => {
                    const isSelected = activeContextFilter === ctx;
                    return (
                      <button
                        key={ctx}
                        type="button"
                        onClick={() => {
                          const next = isSelected ? null : ctx;
                          setActiveContextFilter(next);
                          if (next) onShowToast(`Đã lọc theo ngữ cảnh: ${ctx}`);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-[#ffdbd1] text-[#b02f00] font-bold ring-1 ring-[#ff5722]'
                            : 'bg-[#faf2ee] hover:bg-[#eee7e3] text-[#1e1b19]'
                        }`}
                      >
                        {ctx}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {/* ================= 4. HOW IT WORKS & TRANSPARENCY ================= */}
          <section className="flex flex-col gap-6">
            <div className="text-center max-w-[620px] mx-auto flex flex-col gap-1">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#b21e36]">
                Cơ chế bảo chứng
              </span>
              <h2 className="text-xl md:text-2xl font-extrabold text-[#1e1b19]">
                Quy Trình Tuyển Chọn Quà Minh Bạch &amp; Tin Cậy
              </h2>
              <p className="text-xs md:text-sm text-[#5a4041]">
                Không rác thông tin, không link lừa đảo — Trải nghiệm mua sắm an tâm tuyệt đối
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-3xl p-6 flex flex-col gap-3 shadow-xs border border-[#eee7e3] group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#ffdada] flex items-center justify-center text-[#b21e36] font-black text-xl">
                  1
                </div>
                <h3 className="font-extrabold text-base text-[#1e1b19]">
                  Khảo sát tâm lý 30 giây
                </h3>
                <p className="text-xs text-[#5a4041] leading-relaxed">
                  Trợ lý ứng dụng mô hình ghép nối quà tặng dựa trên mức độ thân thiết, độ tuổi và sở thích thực tế của đối phương.
                </p>
                <div className="text-xs text-[#b21e36] font-semibold flex items-center gap-1 mt-auto pt-2">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  Không hỏi thông tin riêng tư
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 flex flex-col gap-3 shadow-xs border border-[#eee7e3] group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#ffdbd1] flex items-center justify-center text-[#b02f00] font-black text-xl">
                  2
                </div>
                <h3 className="font-extrabold text-base text-[#1e1b19]">
                  Lọc thuật toán nghiêm ngặt
                </h3>
                <p className="text-xs text-[#5a4041] leading-relaxed">
                  Hệ thống loại bỏ 100% gian hàng kém chất lượng. Chỉ chọn sản phẩm có rating trên 4.8★ và tối thiểu 1,000 lượt bán xác thực.
                </p>
                <div className="text-xs text-[#ff5722] font-semibold flex items-center gap-1 mt-auto pt-2">
                  <span className="material-symbols-outlined text-[16px]">verified</span>
                  Chỉ Mall &amp; Verified Shop
                </div>
              </div>

              <div className="bg-white rounded-3xl p-6 flex flex-col gap-3 shadow-xs border border-[#eee7e3] group hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-[#eee7e3] flex items-center justify-center text-[#1e1b19] font-black text-xl">
                  3
                </div>
                <h3 className="font-extrabold text-base text-[#1e1b19]">
                  Mua tại sàn chính thức
                </h3>
                <p className="text-xs text-[#5a4041] leading-relaxed">
                  Bạn nhấn thẳng vào ứng dụng Shopee hoặc TikTok Shop quen thuộc, nhận đầy đủ chính sách đổi trả, hoàn tiền và bảo hành của sàn.
                </p>
                <div className="text-xs text-[#5a4041] font-semibold flex items-center gap-1 mt-auto pt-2">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Giá gốc minh bạch không kênh giá
                </div>
              </div>
            </div>
          </section>

          {/* ================= 5. FAST BOTTOM CALLOUT ================= */}
          <section className="bg-gradient-to-r from-[#b21e36] via-[#d53a4c] to-[#ff5722] rounded-3xl p-6 md:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-[#b21e36]/20">
            <div className="flex flex-col gap-2 text-center md:text-left max-w-[580px]">
              <span className="inline-flex items-center justify-center md:justify-start gap-1 text-xs text-[#ffdada] uppercase tracking-wider font-extrabold">
                <span className="material-symbols-outlined text-[16px]">bookmark_heart</span>
                Lưu Lại Trang Này Ngay
              </span>
              <h3 className="text-xl md:text-2xl font-black">
                Sắp Đến Ngày Sinh Nhật Hay Dịp Lễ Đặc Biệt?
              </h3>
              <p className="text-xs md:text-sm text-white/90">
                Lưu bookmark "Trợ Lý Tìm Quà" trên trình duyệt điện thoại để mở ra gợi ý tức thì bất kỳ lúc nào bạn cần quà gấp!
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('quizWizard');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3 rounded-full bg-white text-[#b21e36] hover:bg-[#faf2ee] text-xs md:text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all text-center cursor-pointer"
              >
                Làm Trắc Nghiệm Ngay
              </button>
              <button
                type="button"
                onClick={() => {
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(window.location.href);
                    onShowToast('📋 Đã copy link Trợ Lý Tìm Quà để gửi cho bạn bè!');
                  }
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-full bg-black/25 hover:bg-black/40 text-white text-xs md:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">share</span>
                <span>Chia sẻ bạn bè</span>
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
