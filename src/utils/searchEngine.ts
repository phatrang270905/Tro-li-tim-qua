import { Product } from '../types';

/**
 * Remove Vietnamese accents and normalize string for flexible fuzzy searching
 */
export function normalizeVietnamese(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^\w\s\d\/\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface BudgetRange {
  min?: number;
  max?: number;
  /** "tầm / khoảng X": ưu tiên sản phẩm có giá gần X nhất */
  target?: number;
}

const UNIT_THOUSAND = new Set(['k', 'nghin', 'ngan', 'ng', 'ngh']);
const UNIT_MILLION = new Set(['tr', 'trieu', 'cu', 'm']);
const UNIT_VND = new Set(['d', 'vnd', 'dong']);
const RANGE_SEPARATORS = new Set(['-', '~', 'den', 'toi']);
// Từ đứng ngay trước một số KHÔNG có đơn vị để coi số đó là tiền (VD: "tầm 500" → 500k)
const MONEY_CONTEXT = new Set(['tam', 'khoang', 'co', 'duoi', 'tren', 'gia', 'tu', 'den', 'toi', 'tien', 'sach', 'max', 'min', 'hon', 'qua', 'chi', 'xi', '<', '>']);
// Từ đứng ngay sau một số KHÔNG có đơn vị cho thấy đó không phải tiền (VD: "100 ngày", "5 món")
const NON_MONEY_NEXT = new Set(['ngay', 'nam', 'thang', 'tuan', 'tuoi', 'gio', 'phut', 'nguoi', 'mon', 'san', 'sp', 'cai', 'lan', 'goi', 'hop', 'chiec', 'mau', 'loai', 'g', 'kg', 'ml', 'cm']);

function parseNumberToken(raw: string): number {
  // "500.000" / "1.500.000" → dấu phân cách hàng nghìn; "1.5" / "1,5" → số thập phân
  if (/^\d{1,3}([.,]\d{3})+$/.test(raw)) return Number(raw.replace(/[.,]/g, ''));
  return Number(raw.replace(',', '.'));
}

/**
 * Đọc ngân sách từ câu tiếng Việt tự nhiên.
 * Hỗ trợ: "300k", "500 nghìn", "500.000đ", "1tr", "1tr5", "1,5 triệu", "2 củ",
 * "dưới / không quá / tối đa X", "trên / ít nhất X", "X trở lên", "X đổ lại",
 * "từ X đến Y", "200-400k", "tầm / khoảng X".
 * Bỏ qua ngày tháng ("20/10", "8-3") và số lượng ("100 ngày", "5 món").
 */
export function parseBudget(query: string): BudgetRange | undefined {
  const text = query.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd');
  const tokens = text.match(/\d+(?:[.,]\d+)*|[a-z]+|[\/\-~<>]/g) || [];
  const amounts: { value: number; index: number; end: number }[] = [];

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!/^\d/.test(token)) continue;
    const prev = tokens[i - 1];
    const next = tokens[i + 1];
    if (prev === '/' || next === '/') continue; // ngày tháng: 20/10, 8/3

    const n = parseNumberToken(token);
    if (!Number.isFinite(n)) continue;

    let value: number | null = null;
    let end = i;

    if (next && UNIT_THOUSAND.has(next)) {
      value = n * 1000;
      end = i + 1;
    } else if (next && UNIT_MILLION.has(next)) {
      value = n * 1_000_000;
      end = i + 1;
      // "1tr5" = 1.500.000, "1 triệu 200" = 1.200.000
      const tail = tokens[i + 2];
      const afterTail = tokens[i + 3];
      const tailIsStandalone =
        !afterTail || !(UNIT_THOUSAND.has(afterTail) || UNIT_MILLION.has(afterTail) || afterTail === '/' || NON_MONEY_NEXT.has(afterTail));
      if (tail && /^\d{1,3}$/.test(tail) && Number.isInteger(n) && tailIsStandalone) {
        value += Number(tail) * 10 ** (6 - tail.length);
        end = i + 2;
      }
    } else if (next && UNIT_VND.has(next)) {
      value = n >= 1000 ? n : n * 1000;
      end = i + 1;
    } else if (n >= 10_000) {
      value = n; // "500000"
    } else if (next && RANGE_SEPARATORS.has(next) && tokens[i + 2] && /^\d/.test(tokens[i + 2])) {
      // "200-400k", "từ 200 đến 400k": số đầu mượn đơn vị của số sau
      const unitAfter = tokens[i + 3];
      if (unitAfter && UNIT_THOUSAND.has(unitAfter)) value = n * 1000;
      else if (unitAfter && UNIT_MILLION.has(unitAfter)) value = n * 1_000_000;
      else if (MONEY_CONTEXT.has(prev ?? '') && n >= 10) value = n * 1000;
    } else if (n >= 10 && (MONEY_CONTEXT.has(prev ?? '') || MONEY_CONTEXT.has(tokens[i - 2] ?? '')) && !(next && NON_MONEY_NEXT.has(next))) {
      value = n * 1000; // "tầm 500" → 500k
    }

    if (value !== null && value >= 10_000 && value <= 1_000_000_000) {
      amounts.push({ value: Math.round(value), index: i, end });
      i = end;
    }
  }

  if (amounts.length === 0) return undefined;

  if (amounts.length >= 2) {
    const [a, b] = [amounts[0].value, amounts[1].value].sort((x, y) => x - y);
    return a === b ? { target: a, max: Math.round(a * 1.1) } : { min: a, max: b };
  }

  const { value, index, end } = amounts[0];
  const before = ` ${tokens.slice(Math.max(0, index - 4), index).join(' ')} `;
  const after = ` ${tokens.slice(end + 1, end + 3).join(' ')} `;
  const has = (s: string, phrases: string[]) => phrases.some((p) => s.includes(` ${p} `));

  if (has(after, ['tro xuong', 'do lai', 'tro lai', 'do xuong'])) return { max: value };
  if (has(after, ['tro len', 'do len'])) return { min: value };
  if (has(before, ['duoi', 'khong qua', 'toi da', 'max', '<', 'it hon', 'nho hon', 're hon', 'khong vuot', 'thap hon'])) return { max: value };
  if (has(before, ['tren', 'hon', 'toi thieu', 'it nhat', '>', 'tu', 'min'])) return { min: value };
  return { target: value, max: Math.round(value * 1.1) };
}

export function formatBudgetAmount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} triệu`;
  }
  return `${Math.round(value / 1000)}k`;
}

export function describeBudget(budget: BudgetRange): string {
  if (budget.target) return `tầm ${formatBudgetAmount(budget.target)}`;
  if (budget.min && budget.max) return `${formatBudgetAmount(budget.min)} – ${formatBudgetAmount(budget.max)}`;
  if (budget.max) return `dưới ${formatBudgetAmount(budget.max)}`;
  if (budget.min) return `trên ${formatBudgetAmount(budget.min)}`;
  return '';
}

export interface ParsedSearchIntent {
  recipient?: string;
  occasion?: string;
  maxBudget?: number;
  minBudget?: number;
  vibe?: string;
  keywords: string[];
}

export interface SearchResultItem {
  product: Product;
  score: number;
  matchedReasons: string[];
}

// Synonyms and intents for Vietnamese holidays & gifting occasions
export const VIETNAMESE_HOLIDAYS = [
  {
    id: '20/10',
    name: '20/10 (Phụ nữ Việt Nam)',
    date: '20 tháng 10',
    shortName: '20/10',
    aliases: ['20/10', '20-10', '20.10', '20 10', 'phu nu viet nam', 'ngay phu nu', 'phu nu vn', 'ngay 20 10', '20 thang 10'],
    icon: '🌹',
    badgeText: 'Dịp 20/10 Hot',
    targetRecipients: ['Người yêu (Nam/Nữ)', 'Bạn thân chí cốt', 'Bố Mẹ / Gia đình', 'Đồng nghiệp / Sếp'],
    defaultVibes: ['Lãng mạn & Tinh tế', 'Chill & Chữa lành', 'Thực tế & Tiện ích']
  },
  {
    id: '8/3',
    name: '8/3 (Quốc tế Phụ nữ)',
    date: '8 tháng 3',
    shortName: '8/3',
    aliases: ['8/3', '8-3', '8.3', '8 3', 'quoc te phu nu', 'ngay 8 3', '8 thang 3', 'mung 8 thang 3'],
    icon: '🌷',
    badgeText: 'Dịp 8/3 Hot',
    targetRecipients: ['Người yêu (Nam/Nữ)', 'Bạn thân chí cốt', 'Bố Mẹ / Gia đình', 'Đồng nghiệp / Sếp'],
    defaultVibes: ['Lãng mạn & Tinh tế', 'Thực tế & Tiện ích']
  },
  {
    id: '19/11',
    name: '19/11 (Quốc tế Nam giới)',
    date: '19 tháng 11',
    shortName: '19/11',
    aliases: ['19/11', '19-11', '19.11', '19 11', 'quoc te nam gioi', 'ngay nam gioi', 'ngay dan ong', '19 thang 11', 'nam gioi', 'phai manh', 'ban trai', 'nguoi yeu nam', 'chong'],
    icon: '👔',
    badgeText: 'Dịp 19/11 Mới',
    targetRecipients: ['Người yêu (Nam/Nữ)', 'Bạn thân chí cốt', 'Bố Mẹ / Gia đình', 'Đồng nghiệp / Sếp', 'Tự thưởng bản thân'],
    defaultVibes: ['Thực tế & Tiện ích', 'Yêu công nghệ & Độc lạ']
  },
  {
    id: '20/11',
    name: '20/11 (Nhà giáo Việt Nam)',
    date: '20 tháng 11',
    shortName: '20/11',
    aliases: ['20/11', '20-11', '20.11', '20 11', 'nha giao viet nam', 'ngay nha giao', 'thay co', 'tri an thay co', 'thay giao', 'co giao', '20 thang 11', 'ngay nha giao'],
    icon: '📚',
    badgeText: 'Dịp 20/11 Tri Ân',
    targetRecipients: ['Đồng nghiệp / Sếp', 'Bố Mẹ / Gia đình'],
    defaultVibes: ['Thực tế & Tiện ích', 'Chill & Chữa lành']
  },
  {
    id: 'tet',
    name: 'Tết Nguyên Đán & Năm Mới',
    date: 'Tết Âm Lịch',
    shortName: 'Tết cổ truyền',
    aliases: ['tet', 'nam moi', 'tet nguyen dan', 'tet am lich', 'bieu tet', 'qua tet', 'xuan'],
    icon: '🧧',
    badgeText: 'Tết Sung Túc',
    targetRecipients: ['Bố Mẹ / Gia đình', 'Đồng nghiệp / Sếp'],
    defaultVibes: ['Thực tế & Tiện ích', 'Chill & Chữa lành']
  },
  {
    id: '14/2',
    name: '14/2 & 14/3 (Valentine Lễ Tình Nhân)',
    date: '14 tháng 2',
    shortName: 'Valentine',
    aliases: ['valentine', '14/2', '14-2', '14/3', '14-3', 'le tinh nhan', 'tinh yeu', 'ngay le tinh nhan'],
    icon: '💖',
    badgeText: 'Valentine Ngọt Ngào',
    targetRecipients: ['Người yêu (Nam/Nữ)'],
    defaultVibes: ['Lãng mạn & Tinh tế']
  },
  {
    id: 'vulan',
    name: 'Vu Lan Báo Hiếu & Ngày Bố Mẹ',
    date: 'Rằm tháng 7 / Ngày của Mẹ & Cha',
    shortName: 'Vu Lan Báo Hiếu',
    aliases: ['vu lan', 'bao hieu', 'ngay cua me', 'ngay cua cha', 'ram thang 7', 'me', 'cha', 'bo me'],
    icon: '🌸',
    badgeText: 'Báo Hiếu Bố Mẹ',
    targetRecipients: ['Bố Mẹ / Gia đình'],
    defaultVibes: ['Thực tế & Tiện ích', 'Chill & Chữa lành']
  },
  {
    id: 'birthday',
    name: 'Sinh nhật ý nghĩa',
    date: 'Mọi thời điểm',
    shortName: 'Sinh nhật',
    aliases: ['sinh nhat', 'sn', 'birthday', 'bday', 'mung tuoi moi'],
    icon: '🎂',
    badgeText: 'Sinh Nhật',
    targetRecipients: ['Người yêu (Nam/Nữ)', 'Bạn thân chí cốt', 'Bố Mẹ / Gia đình', 'Đồng nghiệp / Sếp', 'Bé yêu / Em nhỏ'],
    defaultVibes: ['Lãng mạn & Tinh tế', 'Thực tế & Tiện ích', 'Yêu công nghệ & Độc lạ']
  },
  {
    id: 'anniversary',
    name: 'Kỷ niệm ngày yêu / ngày cưới',
    date: 'Mọi thời điểm',
    shortName: 'Kỷ niệm ngày yêu',
    aliases: ['ky niem', 'ngay yeu', 'ngay cuoi', '100 ngay', '1 nam', 'anniversary'],
    icon: '💑',
    badgeText: 'Kỷ Niệm Ngày Yêu',
    targetRecipients: ['Người yêu (Nam/Nữ)'],
    defaultVibes: ['Lãng mạn & Tinh tế']
  },
  {
    id: 'noel',
    name: 'Giáng sinh / Noel',
    date: '24-25 tháng 12',
    shortName: 'Giáng sinh / Noel',
    aliases: ['giang sinh', 'noel', 'christmas', 'xmas', '24/12', '25/12'],
    icon: '🎄',
    badgeText: 'Giáng Sinh Ấm Áp',
    targetRecipients: ['Người yêu (Nam/Nữ)', 'Bạn thân chí cốt', 'Bé yêu / Em nhỏ', 'Đồng nghiệp / Sếp'],
    defaultVibes: ['Lãng mạn & Tinh tế', 'Chill & Chữa lành']
  },
  {
    id: 'career',
    name: 'Thăng tiến / Tốt nghiệp / Chia tay',
    date: 'Công sở & Học tập',
    shortName: 'Thăng tiến & Công sở',
    aliases: ['thang tien', 'chuc mung thang chuc', 'tot nghiep', 'chia tay dong nghiep', 'chuyen cong ty', 'onboarding', 'nhan viec'],
    icon: '💼',
    badgeText: 'Thăng Tiến & Công Sở',
    targetRecipients: ['Đồng nghiệp / Sếp', 'Bạn thân chí cốt'],
    defaultVibes: ['Thực tế & Tiện ích']
  },
  {
    id: 'random',
    name: 'Quà bất ngờ (Không dịp gì)',
    date: 'Bất ngờ ngẫu hứng',
    shortName: 'Bất ngờ không dịp gì',
    aliases: ['bat ngo', 'khong dip gi', 'ngau hung', 'do nang vui', 'chua lanh'],
    icon: '✨',
    badgeText: 'Bất Ngờ Tinh Tế',
    targetRecipients: ['Người yêu (Nam/Nữ)', 'Bạn thân chí cốt', 'Tự thưởng bản thân'],
    defaultVibes: ['Chill & Chữa lành', 'Lãng mạn & Tinh tế']
  }
];

/**
 * Intelligent Query Parser: extracts budget, recipient, occasion and keywords
 */
export function parseSearchIntent(query: string): ParsedSearchIntent {
  const norm = normalizeVietnamese(query);
  const intent: ParsedSearchIntent = { keywords: [] };

  // Detect budget: ưu tiên số tiền cụ thể ("tầm 450k", "1tr"), sau đó mới tới các cụm từ cố định
  const parsedBudget = parseBudget(query);
  if (parsedBudget) {
    intent.maxBudget = parsedBudget.max;
    intent.minBudget = parsedBudget.min;
  } else if (norm.includes('duoi 150k') || norm.includes('< 150k') || norm.includes('100k') || norm.includes('re') || norm.includes('tiet kiem')) {
    intent.maxBudget = 150000;
  } else if (norm.includes('duoi 200k') || norm.includes('tam 200k')) {
    intent.maxBudget = 200000;
  } else if (norm.includes('duoi 300k') || norm.includes('tam 300k') || norm.includes('150k - 300k') || norm.includes('vua van')) {
    intent.maxBudget = 300000;
  } else if (norm.includes('duoi 500k') || norm.includes('tam 500k') || norm.includes('300k - 500k') || norm.includes('chu dao')) {
    intent.maxBudget = 500000;
  } else if (norm.includes('tren 500k') || norm.includes('cao cap') || norm.includes('> 500k')) {
    intent.minBudget = 500000;
  }

  // Detect Recipient
  if (norm.includes('ban gai') || norm.includes('nguoi yeu') || norm.includes('crush') || norm.includes('vo') || norm.includes('em yeu')) {
    intent.recipient = 'Người yêu (Nam/Nữ)';
  } else if (norm.includes('ban trai') || norm.includes('nguoi yeu nam') || norm.includes('chong') || norm.includes('anh yeu')) {
    intent.recipient = 'Người yêu (Nam/Nữ)';
  } else if (norm.includes('bo me') || norm.includes('ba me') || norm.includes('gia dinh') || norm.includes('phu huynh') || norm.includes('me') || norm.includes('bo')) {
    intent.recipient = 'Bố Mẹ / Gia đình';
  } else if (norm.includes('dong nghiep') || norm.includes('sep') || norm.includes('cong ty') || norm.includes('van phong')) {
    intent.recipient = 'Đồng nghiệp / Sếp';
  } else if (norm.includes('ban than') || norm.includes('tri ky') || norm.includes('ban hoc')) {
    intent.recipient = 'Bạn thân chí cốt';
  } else if (norm.includes('be yeu') || norm.includes('con chau') || norm.includes('em nho')) {
    intent.recipient = 'Bé yêu / Em nhỏ';
  } else if (norm.includes('tu thuong') || norm.includes('ban than') || norm.includes('self reward')) {
    intent.recipient = 'Tự thưởng bản thân';
  }

  // Detect Occasion from VIETNAMESE_HOLIDAYS
  for (const holiday of VIETNAMESE_HOLIDAYS) {
    if (holiday.aliases.some((alias) => norm.includes(alias))) {
      intent.occasion = holiday.name;
      break;
    }
  }

  // Detect Vibe
  if (norm.includes('lang man') || norm.includes('tinh te') || norm.includes('ngot ngao') || norm.includes('tho')) {
    intent.vibe = 'Lãng mạn & Tinh tế';
  } else if (norm.includes('thuc te') || norm.includes('tien ich') || norm.includes('huu dung') || norm.includes('dung moi ngay')) {
    intent.vibe = 'Thực tế & Tiện ích';
  } else if (norm.includes('cong nghe') || norm.includes('doc la') || norm.includes('gadget') || norm.includes('trendy')) {
    intent.vibe = 'Yêu công nghệ & Độc lạ';
  } else if (norm.includes('chill') || norm.includes('chua lanh') || norm.includes('ngu ngon') || norm.includes('thu gian')) {
    intent.vibe = 'Chill & Chữa lành';
  }

  intent.keywords = norm.split(' ').filter((w) => w.length > 1 && !['tang', 'cho', 'qua', 'mon', 'va', 'la', 'nhung', 'cac'].includes(w));
  return intent;
}

/**
 * Intelligent Smart Search algorithm
 */
export function performSmartSearch(products: Product[], query: string): SearchResultItem[] {
  if (!query || !query.trim()) {
    return products.map((p) => ({
      product: p,
      score: 1,
      matchedReasons: ['Gợi ý thịnh hành']
    }));
  }

  const rawQuery = query.trim();
  const normQuery = normalizeVietnamese(rawQuery);
  const intent = parseSearchIntent(rawQuery);

  const results: SearchResultItem[] = [];

  for (const product of products) {
    let score = 0;
    const reasons: string[] = [];

    const normTitle = normalizeVietnamese(product.title);
    const normInsight = normalizeVietnamese(product.psychologicalInsight);
    const normRecipients = product.recipientTypes.map(normalizeVietnamese).join(' ');
    const normOccasions = product.occasions.map(normalizeVietnamese).join(' ');
    const normVibes = product.vibes.map(normalizeVietnamese).join(' ');
    const normFeatures = (product.features || []).map(normalizeVietnamese).join(' ');
    const normTag = normalizeVietnamese(product.highlightTag || '');
    const normBadge = normalizeVietnamese(product.badge || '');

    // 1. Direct exact or substring match in Title
    if (normTitle.includes(normQuery)) {
      score += 45;
      reasons.push('Khớp tên sản phẩm');
    }

    // 2. Holiday Occasion Match (Crucial for 20/10, 8/3, 19/11, 20/11, etc.)
    for (const holiday of VIETNAMESE_HOLIDAYS) {
      const isQueryAskingHoliday = holiday.aliases.some((alias) => normQuery.includes(alias));
      if (isQueryAskingHoliday) {
        // Check if product mentions this holiday or matches holiday theme
        const productHasHoliday = product.occasions.some((occ) => {
          const normOcc = normalizeVietnamese(occ);
          return holiday.aliases.some((a) => normOcc.includes(a));
        });

        if (productHasHoliday) {
          score += 35;
          reasons.push(`Chuẩn dịp ${holiday.shortName}`);
        } else if (
          (holiday.id === '20/10' || holiday.id === '8/3') &&
          (product.category === 'girlfriend' || normRecipients.includes('nguoi yeu') || normTitle.includes('son') || normTitle.includes('hoa') || normTitle.includes('den ngu') || normTitle.includes('nen thom'))
        ) {
          score += 25;
          reasons.push(`Quà phái đẹp dịp ${holiday.shortName}`);
        } else if (
          holiday.id === '19/11' &&
          (normTitle.includes('nam') || normTitle.includes('cao rau') || normTitle.includes('vi da') || normTitle.includes('but') || normTitle.includes('binh giu nhiet') || normTitle.includes('tai nghe') || product.category === 'colleague')
        ) {
          score += 28;
          reasons.push(`Quà phái mạnh dịp 19/11`);
        } else if (
          holiday.id === '20/11' &&
          (normTitle.includes('but ky') || normTitle.includes('tra') || normTitle.includes('khan') || normTitle.includes('binh giu nhiet') || product.category === 'colleague')
        ) {
          score += 28;
          reasons.push(`Quà tri ân Thầy Cô dịp 20/11`);
        } else if (
          (holiday.id === 'vulan' || holiday.id === 'tet') &&
          (product.category === 'parents' || normTitle.includes('massage') || normTitle.includes('ngam chan') || normTitle.includes('yen') || normTitle.includes('goi'))
        ) {
          score += 30;
          reasons.push(`Quà sức khỏe dịp ${holiday.shortName}`);
        }
      }
    }

    // 3. Keyword matching across attributes
    let matchedKeywordCount = 0;
    for (const kw of intent.keywords) {
      if (normTitle.includes(kw)) {
        score += 15;
        matchedKeywordCount++;
      } else if (normInsight.includes(kw)) {
        score += 8;
        matchedKeywordCount++;
      } else if (normFeatures.includes(kw) || normTag.includes(kw) || normBadge.includes(kw)) {
        score += 6;
        matchedKeywordCount++;
      }
    }
    if (matchedKeywordCount > 1 && !reasons.includes('Khớp tên sản phẩm')) {
      reasons.push(`Khớp ${matchedKeywordCount} từ khóa`);
    }

    // 4. Recipient Match
    if (intent.recipient) {
      const match = product.recipientTypes.some((r) => r.includes(intent.recipient!));
      if (match) {
        score += 18;
        reasons.push(`Đúng đối tượng ${intent.recipient.split('/')[0].trim()}`);
      }
    }

    // 5. Budget Match
    if (intent.maxBudget && product.price <= intent.maxBudget) {
      score += 12;
      reasons.push(`Phù hợp ngân sách (< ${(intent.maxBudget / 1000).toLocaleString('vi-VN')}k)`);
    } else if (intent.minBudget && product.price >= intent.minBudget) {
      score += 12;
      reasons.push(`Dòng quà cao cấp (> ${(intent.minBudget / 1000).toLocaleString('vi-VN')}k)`);
    }

    // 6. Vibe Match
    if (intent.vibe && product.vibes.includes(intent.vibe)) {
      score += 10;
      reasons.push(`Chuẩn gu: ${intent.vibe}`);
    }

    // 7. General search fallback (if score is 0, check broad substring)
    if (score === 0) {
      const fullText = `${normTitle} ${normInsight} ${normRecipients} ${normOccasions} ${normVibes} ${normFeatures}`;
      for (const kw of intent.keywords) {
        if (fullText.includes(kw)) {
          score += 5;
          reasons.push('Khớp ngữ cảnh liên quan');
          break;
        }
      }
    }

    if (score > 0) {
      // Prioritize high rating & review count for tie breakers
      score += product.rating;
      results.push({
        product,
        score,
        matchedReasons: reasons.slice(0, 3)
      });
    }
  }

  // Sort descending by score
  results.sort((a, b) => b.score - a.score);
  return results;
}
