import { Product } from '../types';
import { GENDER_HINTS, GIFT_TRAITS, GiftTrait, PRODUCT_TYPES, ProductTypeHint } from '../data/traits';
import {
  BudgetRange,
  VIETNAMESE_HOLIDAYS,
  describeBudget,
  normalizeVietnamese,
  parseBudget,
} from './searchEngine';

/**
 * Chatbot gợi ý quà chạy 100% trên trình duyệt (không gọi API).
 * Quy trình: Phân tích câu hỏi → Gộp với ngữ cảnh cũ → Chấm điểm sản phẩm → Soạn câu trả lời.
 */

type Gender = 'female' | 'male';

export interface ChatContext {
  recipient?: string;
  gender?: Gender;
  occasion?: string;
  budget?: BudgetRange;
  traitIds: string[];
  productTypeIds: string[];
  /** Các món đã gợi ý trong cuộc trò chuyện (để "món khác" không lặp lại) */
  shownIds: string[];
  /** Các món của lượt trả lời gần nhất (để "rẻ hơn / xịn hơn" biết mốc giá) */
  lastShownIds: string[];
}

export interface BotRecommendation {
  productId: string;
  reasons: string[];
}

export interface BotReply {
  text: string;
  recommendations: BotRecommendation[];
  /** Câu hỏi lại, hiển thị SAU các thẻ sản phẩm */
  followUp?: string;
  quickReplies: string[];
  context: ChatContext;
}

export const EMPTY_CONTEXT: ChatContext = { traitIds: [], productTypeIds: [], shownIds: [], lastShownIds: [] };

export const SAMPLE_QUESTIONS = [
  'Người yêu tôi rất khó tính, muốn tặng quà kỷ niệm tầm 500k',
  'Quà 20/10 cho mẹ dưới 400k',
  'Sếp nam dân văn phòng, ngân sách 300k',
  'Bạn thân mê công nghệ, quà sinh nhật khoảng 400k',
];

const BUDGET_QUICK_REPLIES = ['Dưới 200k', '200k - 300k', '300k - 500k', 'Trên 500k'];
const RECIPIENT_QUICK_REPLIES = ['Người yêu', 'Bố mẹ', 'Đồng nghiệp / Sếp', 'Bạn thân'];
const ACTION_QUICK_REPLIES = ['Rẻ hơn chút', 'Món khác', 'Cao cấp hơn'];
const GENDER_QUICK_REPLIES: Record<string, string[]> = {
  'Người yêu (Nam/Nữ)': ['Bạn gái', 'Bạn trai'],
  'Bạn thân chí cốt': ['Bạn thân nữ', 'Bạn thân nam'],
};

const DEFAULT_RESULT_COUNT = 4;
const MAX_RESULT_COUNT = 6;

// ==================== TỪ ĐIỂN NHẬN DIỆN ====================

interface PatternGroup<T> {
  value: T;
  patterns: string[]; // có dấu
  plainPatterns: string[]; // không dấu
}

// Giá trị phải trùng khớp chính xác với Product.recipientTypes
const RECIPIENT_GROUPS: PatternGroup<string>[] = [
  {
    value: 'Người yêu (Nam/Nữ)',
    patterns: ['người yêu', 'bạn gái', 'bạn trai', 'vợ', 'chồng', 'vợ yêu', 'chồng yêu', 'crush', 'em yêu', 'anh yêu', 'người thương', 'ny', 'gấu', 'bf', 'gf', 'nửa kia', 'bà xã', 'ông xã', 'hôn thê', 'hôn phu'],
    plainPatterns: ['nguoi yeu', 'ban gai', 'ban trai', 'vo yeu', 'chong yeu', 'crush', 'em yeu', 'anh yeu', 'nguoi thuong', 'nua kia', 'ba xa', 'ong xa'],
  },
  {
    value: 'Bố Mẹ / Gia đình',
    patterns: ['bố mẹ', 'ba mẹ', 'cha mẹ', 'bố', 'mẹ', 'cha', 'má', 'tía', 'ông bà', 'ông', 'bà', 'phụ huynh', 'gia đình', 'bố vợ', 'mẹ vợ', 'bố chồng', 'mẹ chồng', 'ông nội', 'bà nội', 'ông ngoại', 'bà ngoại'],
    plainPatterns: ['bo me', 'ba me', 'cha me', 'ong ba', 'phu huynh', 'gia dinh', 'bo vo', 'me vo', 'bo chong', 'me chong', 'ong noi', 'ba noi', 'ong ngoai', 'ba ngoai'],
  },
  {
    value: 'Đồng nghiệp / Sếp',
    patterns: ['đồng nghiệp', 'sếp', 'cấp trên', 'đối tác', 'khách hàng', 'nhân viên', 'thầy', 'cô giáo', 'thầy cô', 'thầy giáo', 'giáo viên', 'sếp nam', 'sếp nữ'],
    plainPatterns: ['dong nghiep', 'cap tren', 'doi tac', 'khach hang', 'nhan vien', 'co giao', 'thay co', 'thay giao', 'giao vien', 'sep nam', 'sep nu'],
  },
  {
    value: 'Bạn thân chí cốt',
    patterns: ['bạn thân', 'bạn bè', 'bạn học', 'tri kỷ', 'bestie', 'bff', 'hội bạn', 'bạn cùng phòng'],
    plainPatterns: ['ban be', 'ban hoc', 'tri ky', 'bestie', 'bff', 'hoi ban', 'ban cung phong'],
  },
  {
    value: 'Bé yêu / Em nhỏ',
    patterns: ['bé', 'em bé', 'con', 'con trai', 'con gái', 'cháu', 'em nhỏ', 'trẻ con', 'con nít', 'học sinh'],
    plainPatterns: ['em be', 'con trai', 'con gai', 'tre con', 'em nho', 'con nit', 'hoc sinh'],
  },
  {
    value: 'Tự thưởng bản thân',
    patterns: ['bản thân', 'tự thưởng', 'tự tặng'],
    plainPatterns: ['tu thuong', 'tu tang'],
  },
];

const RECIPIENT_LABELS: Record<string, string> = {
  'Người yêu (Nam/Nữ)': 'người yêu',
  'Bố Mẹ / Gia đình': 'bố mẹ / gia đình',
  'Đồng nghiệp / Sếp': 'đồng nghiệp / sếp',
  'Bạn thân chí cốt': 'bạn thân',
  'Bé yêu / Em nhỏ': 'bé / em nhỏ',
  'Tự thưởng bản thân': 'bản thân',
};

const GENDER_GROUPS: PatternGroup<Gender>[] = [
  {
    value: 'female',
    patterns: ['bạn gái', 'người yêu nữ', 'vợ', 'vợ yêu', 'bà xã', 'em yêu', 'cô ấy', 'nàng', 'chị', 'chị gái', 'em gái', 'mẹ', 'má', 'bà', 'mẹ vợ', 'mẹ chồng', 'bà nội', 'bà ngoại', 'cô giáo', 'con gái', 'gf', 'nữ', 'phụ nữ', 'sếp nữ', 'hôn thê'],
    plainPatterns: ['ban gai', 'nguoi yeu nu', 'vo yeu', 'ba xa', 'co ay', 'chi gai', 'em gai', 'me vo', 'me chong', 'ba noi', 'ba ngoai', 'co giao', 'con gai', 'phu nu', 'sep nu'],
  },
  {
    value: 'male',
    patterns: ['bạn trai', 'người yêu nam', 'chồng', 'chồng yêu', 'ông xã', 'anh yêu', 'anh ấy', 'chàng', 'anh trai', 'em trai', 'bố', 'cha', 'tía', 'ông', 'bố vợ', 'bố chồng', 'ông nội', 'ông ngoại', 'thầy', 'thầy giáo', 'con trai', 'bf', 'nam', 'đàn ông', 'nam giới', 'sếp nam', 'hôn phu'],
    plainPatterns: ['ban trai', 'nguoi yeu nam', 'chong yeu', 'ong xa', 'anh ay', 'anh trai', 'em trai', 'bo vo', 'bo chong', 'ong noi', 'ong ngoai', 'thay giao', 'con trai', 'dan ong', 'nam gioi', 'sep nam'],
  },
];

// Alias của ngày lễ trùng với tên người nhận / tính cách → không dùng để đoán dịp
const OCCASION_ALIAS_BLACKLIST = new Set([
  'me', 'cha', 'bo me', 'ban trai', 'nguoi yeu nam', 'chong', 'nam gioi', 'phai manh',
  'tinh yeu', 'xuan', 'chua lanh', 'thay co', 'thay giao', 'co giao', 'do nang vui', 'bat ngo',
]);

const OCCASION_GENDER: Record<string, Gender> = { '20/10': 'female', '8/3': 'female', '19/11': 'male' };

const COMMANDS = {
  reset: ['lam lai', 'bat dau lai', 'reset', 'hoi lai tu dau', 'xoa het', 'cuoc moi', 'hoi moi'],
  cheaper: ['re hon', 'thap hon', 'it tien hon', 'mem hon', 'tiet kiem hon', 'bot tien'],
  pricier: ['dat hon', 'mac hon', 'cao cap hon', 'xin hon', 'sang hon', 'nhieu tien hon', 'tot hon'],
  other: ['mon khac', 'goi y khac', 'khac di', 'cai khac', 'lua chon khac', 'them mon', 'them goi y', 'con gi nua', 'con mon nao', 'them nua', 'khac', 'them'],
  thanks: ['cam on', 'thank', 'thanks', 'tks', 'cam ta'],
  greet: ['xin chao', 'chao', 'hello', 'hi', 'alo', 'hey'],
};

// ==================== HÀM TIỆN ÍCH KHỚP CHỮ ====================

/** Chữ thường, CÓ dấu, bỏ dấu câu, đệm khoảng trắng 2 đầu để khớp nguyên từ */
function toAccentedText(str: string): string {
  const cleaned = str
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{N}\s\/]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return ` ${cleaned} `;
}

function toPlainText(str: string): string {
  return ` ${normalizeVietnamese(str)} `;
}

function hasPhrase(paddedText: string, phrase: string): boolean {
  return paddedText.includes(` ${phrase} `);
}

function anyPhrase(paddedText: string, phrases: string[]): boolean {
  return phrases.some((p) => hasPhrase(paddedText, p));
}

interface PhraseMatch<T> {
  value: T;
  index: number;
  length: number;
  space: 'accented' | 'plain';
  phrase: string;
}

/**
 * Tìm mọi cụm từ khớp, rồi bỏ những cụm nằm gọn trong một cụm dài hơn
 * (VD: "mẹ vợ" thì không tính riêng "vợ").
 */
function findMatches<T>(accented: string, plain: string, groups: PatternGroup<T>[]): PhraseMatch<T>[] {
  const all: PhraseMatch<T>[] = [];
  const collect = (text: string, phrase: string, value: T, space: 'accented' | 'plain') => {
    const needle = ` ${phrase} `;
    let from = 0;
    while (true) {
      const idx = text.indexOf(needle, from);
      if (idx === -1) break;
      all.push({ value, index: idx, length: phrase.length, space, phrase });
      from = idx + 1;
    }
  };
  for (const group of groups) {
    group.patterns.forEach((p) => collect(accented, p, group.value, 'accented'));
    group.plainPatterns.forEach((p) => collect(plain, p, group.value, 'plain'));
  }
  return all.filter(
    (m) =>
      !all.some(
        (o) =>
          o !== m &&
          o.space === m.space &&
          o.length > m.length &&
          o.index <= m.index &&
          m.index + m.length <= o.index + o.length,
      ),
  );
}

// ==================== 1. PHÂN TÍCH CÂU HỎI ====================

interface ParsedMessage {
  recipient?: string;
  gender?: Gender;
  occasionId?: string;
  budget?: BudgetRange;
  traitIds: string[];
  productTypeIds: string[];
  requestedCount?: number;
  command?: keyof typeof COMMANDS;
}

function detectCommand(plain: string): ParsedMessage['command'] {
  const trimmed = plain.trim();
  if (anyPhrase(plain, COMMANDS.reset)) return 'reset';
  if (anyPhrase(plain, COMMANDS.cheaper)) return 'cheaper';
  if (anyPhrase(plain, COMMANDS.pricier)) return 'pricier';
  if (anyPhrase(plain, COMMANDS.other)) return 'other';
  if (anyPhrase(plain, COMMANDS.thanks)) return 'thanks';
  // Chỉ coi là lời chào khi câu ngắn (VD: "chào bạn"), tránh nhầm với câu hỏi dài
  if (trimmed.split(' ').length <= 3 && anyPhrase(plain, COMMANDS.greet)) return 'greet';
  return undefined;
}

export function parseMessage(message: string): ParsedMessage {
  const accented = toAccentedText(message);
  const plain = toPlainText(message);
  const parsed: ParsedMessage = { traitIds: [], productTypeIds: [] };

  // Người nhận: lấy cụm xuất hiện sớm nhất ("bố mẹ người yêu" → bố mẹ)
  const recipientMatches = findMatches(accented, plain, RECIPIENT_GROUPS).sort((a, b) => a.index - b.index);
  const recipientMatch = recipientMatches[0];
  if (recipientMatch) parsed.recipient = recipientMatch.value;

  // Giới tính: ưu tiên chính cụm từ chỉ người nhận ("bạn gái" → nữ), nếu không thì xét toàn câu
  const genderMatches = findMatches(accented, plain, GENDER_GROUPS);
  const fromRecipient = recipientMatch
    ? genderMatches.find((g) => g.space === recipientMatch.space && g.index === recipientMatch.index && g.phrase === recipientMatch.phrase)
    : undefined;
  if (fromRecipient) {
    parsed.gender = fromRecipient.value;
  } else {
    const genders = new Set(genderMatches.map((g) => g.value));
    if (genders.size === 1) parsed.gender = [...genders][0];
  }

  // Dịp tặng: lấy dịp xuất hiện sớm nhất
  let bestOccasion: { id: string; index: number } | undefined;
  for (const holiday of VIETNAMESE_HOLIDAYS) {
    for (const alias of holiday.aliases) {
      const normAlias = normalizeVietnamese(alias);
      if (OCCASION_ALIAS_BLACKLIST.has(normAlias)) continue;
      const idx = plain.indexOf(` ${normAlias} `);
      if (idx !== -1 && (!bestOccasion || idx < bestOccasion.index)) {
        bestOccasion = { id: holiday.id, index: idx };
      }
    }
  }
  parsed.occasionId = bestOccasion?.id;

  parsed.budget = parseBudget(message);

  parsed.traitIds = GIFT_TRAITS.filter(
    (t) => anyPhrase(accented, t.patterns) || anyPhrase(plain, t.plainPatterns),
  ).map((t) => t.id);

  parsed.productTypeIds = PRODUCT_TYPES.filter(
    (t) => anyPhrase(accented, t.patterns) || anyPhrase(plain, t.plainPatterns),
  ).map((t) => t.id);

  const countMatch = plain.match(/ (\d{1,2}) (mon|san pham|sp|goi y|lua chon|mau|cai) /);
  if (countMatch) {
    parsed.requestedCount = Math.min(MAX_RESULT_COUNT, Math.max(1, Number(countMatch[1])));
  }

  parsed.command = detectCommand(plain);
  // "Cao cấp hơn / xịn hơn" là yêu cầu đổi giá, không phải mô tả tính cách
  if (parsed.command === 'pricier') {
    parsed.traitIds = parsed.traitIds.filter((id) => id !== 'luxury');
  }
  return parsed;
}

function hasCriteria(p: ParsedMessage): boolean {
  return Boolean(p.recipient || p.gender || p.occasionId || p.budget || p.traitIds.length || p.productTypeIds.length);
}

// ==================== 2. CHẤM ĐIỂM SẢN PHẨM ====================

function productGender(product: Product): Gender | undefined {
  const title = toAccentedText(product.title);
  const female = anyPhrase(title, GENDER_HINTS.female);
  const male = anyPhrase(title, GENDER_HINTS.male);
  if (female && !male) return 'female';
  if (male && !female) return 'male';
  return undefined;
}

function fitsBudget(price: number, budget?: BudgetRange): boolean {
  if (!budget) return true;
  if (budget.max !== undefined && price > budget.max) return false;
  if (budget.min !== undefined && price < budget.min) return false;
  return true;
}

function budgetDistance(price: number, budget: BudgetRange): number {
  if (budget.max !== undefined && price > budget.max) return price - budget.max;
  if (budget.min !== undefined && price < budget.min) return budget.min - price;
  return 0;
}

interface ScoredProduct {
  product: Product;
  score: number;
  reasons: string[];
  matchesType: boolean;
}

function scoreProduct(
  product: Product,
  ctx: ChatContext,
  traits: GiftTrait[],
  types: ProductTypeHint[],
  gender: Gender | undefined,
): ScoredProduct {
  let score = product.rating;
  const reasons: string[] = [];

  // Chưa biết giới tính người nhận → ưu tiên món dùng được cho cả nam lẫn nữ
  if (!gender && productGender(product)) score -= 60;
  const plainTitle = toPlainText(product.title);
  const plainText = toPlainText(
    [product.title, product.psychologicalInsight, product.highlightTag ?? '', ...(product.features ?? [])].join(' '),
  );

  if (ctx.recipient && product.recipientTypes.includes(ctx.recipient)) {
    score += 30;
    reasons.push(`Hợp tặng ${RECIPIENT_LABELS[ctx.recipient] ?? ctx.recipient}`);
  }

  const holiday = VIETNAMESE_HOLIDAYS.find((h) => h.id === ctx.occasion);
  if (holiday && product.occasions.includes(holiday.name)) {
    score += 20;
    reasons.push(`Chuẩn dịp ${holiday.shortName}`);
  }

  for (const trait of traits) {
    let traitScore = 0;
    if (trait.vibes.some((v) => product.vibes.includes(v))) traitScore += 10;
    const keywordHits = trait.keywords.filter((k) => hasPhrase(plainText, k)).length;
    traitScore += 6 * Math.min(keywordHits, 2);
    if (trait.preferHighRating) traitScore += Math.max(0, (product.rating - 4.7) * 60);
    if (traitScore > 0) {
      score += traitScore;
      reasons.push(trait.preferHighRating ? `Hợp người ${trait.label} (⭐ ${product.rating})` : `Hợp người ${trait.label}`);
    }
  }

  const matchesType = types.some((t) => t.titleKeywords.some((k) => hasPhrase(plainTitle, k)));
  if (matchesType) {
    score += 25;
    reasons.push('Đúng loại quà bạn tìm');
  }

  if (ctx.budget) {
    if (fitsBudget(product.price, ctx.budget)) reasons.push('Vừa ngân sách');
    if (ctx.budget.target) {
      const closeness = 1 - Math.abs(product.price - ctx.budget.target) / ctx.budget.target;
      score += Math.max(0, 15 * closeness);
    }
  }

  return { product, score, reasons: reasons.slice(0, 3), matchesType };
}

interface RecommendResult {
  items: ScoredProduct[];
  relaxedRecipient: boolean;
  relaxedBudget: boolean;
}

function recommend(
  products: Product[],
  ctx: ChatContext,
  count: number,
  excludeIds: Set<string>,
  allowRelax: boolean,
): RecommendResult {
  const traits = GIFT_TRAITS.filter((t) => ctx.traitIds.includes(t.id));
  const types = PRODUCT_TYPES.filter((t) => ctx.productTypeIds.includes(t.id));
  const occasionGender = ctx.occasion ? OCCASION_GENDER[ctx.occasion] : undefined;
  const gender = ctx.gender ?? occasionGender;

  // Loại cứng: món đã gợi ý (khi hỏi "món khác") và món sai giới tính
  const pool = products.filter((p) => {
    if (excludeIds.has(p.id)) return false;
    const g = productGender(p);
    return !(gender && g && g !== gender);
  });

  const forRecipient = (p: Product) => !ctx.recipient || p.recipientTypes.includes(ctx.recipient);
  const byScore = (list: Product[]) =>
    list.map((p) => scoreProduct(p, ctx, traits, types, gender)).sort((a, b) => b.score - a.score);

  // Nới dần điều kiện: đúng người + đúng giá → đúng người (giá gần nhất) → đúng giá (người khác)
  let candidates = pool.filter((p) => forRecipient(p) && fitsBudget(p.price, ctx.budget));
  if (candidates.length > 0) {
    return { items: byScore(candidates).slice(0, count), relaxedRecipient: false, relaxedBudget: false };
  }
  if (!allowRelax) return { items: [], relaxedRecipient: false, relaxedBudget: false };

  candidates = pool.filter(forRecipient);
  if (candidates.length > 0 && ctx.budget) {
    const budget = ctx.budget;
    const nearest = candidates
      .map((p) => scoreProduct(p, ctx, traits, types, gender))
      .sort((a, b) => budgetDistance(a.product.price, budget) - budgetDistance(b.product.price, budget) || b.score - a.score);
    return { items: nearest.slice(0, count), relaxedRecipient: false, relaxedBudget: true };
  }

  candidates = pool.filter((p) => fitsBudget(p.price, ctx.budget));
  if (candidates.length > 0 && ctx.recipient) {
    return { items: byScore(candidates).slice(0, count), relaxedRecipient: true, relaxedBudget: false };
  }

  return { items: [], relaxedRecipient: false, relaxedBudget: false };
}

// ==================== 3. GỘP NGỮ CẢNH & SOẠN CÂU TRẢ LỜI ====================

export function greetingReply(ctx: ChatContext = EMPTY_CONTEXT): BotReply {
  return {
    text:
      'Chào bạn 👋 Mình là trợ lý gợi ý quà tặng!\n' +
      'Hãy kể cho mình: tặng ai, dịp gì, ngân sách bao nhiêu, người đó tính cách / sở thích thế nào. Mình sẽ chọn những món hợp nhất kèm link mua.',
    recommendations: [],
    quickReplies: SAMPLE_QUESTIONS,
    context: ctx,
  };
}

function describeContext(ctx: ChatContext): string {
  const parts: string[] = [];
  if (ctx.recipient) {
    const genderLabel = GENDER_QUICK_REPLIES[ctx.recipient] && ctx.gender ? (ctx.gender === 'female' ? ' (nữ)' : ' (nam)') : '';
    parts.push(`tặng ${RECIPIENT_LABELS[ctx.recipient] ?? ctx.recipient}${genderLabel}`);
  }
  const holiday = VIETNAMESE_HOLIDAYS.find((h) => h.id === ctx.occasion);
  if (holiday) parts.push(`dịp ${holiday.shortName}`);
  if (ctx.budget) parts.push(`ngân sách ${describeBudget(ctx.budget)}`);
  const traits = GIFT_TRAITS.filter((t) => ctx.traitIds.includes(t.id));
  if (traits.length) parts.push(`người ${traits.map((t) => t.label).join(', ')}`);
  const types = PRODUCT_TYPES.filter((t) => ctx.productTypeIds.includes(t.id));
  if (types.length) parts.push(`tìm ${types.map((t) => t.label).join(', ')}`);
  return parts.join(' · ');
}

/**
 * Hàm chính: nhận câu hỏi + ngữ cảnh trước đó, trả về câu trả lời + ngữ cảnh mới.
 */
export function answerQuestion(question: string, products: Product[], prevContext: ChatContext = EMPTY_CONTEXT): BotReply {
  const parsed = parseMessage(question);

  if (parsed.command === 'reset') {
    return greetingReply({ ...EMPTY_CONTEXT });
  }
  if (!hasCriteria(parsed) && parsed.command === 'greet') {
    return greetingReply(prevContext);
  }
  if (!hasCriteria(parsed) && parsed.command === 'thanks') {
    return {
      text: 'Không có gì ạ 🥰 Chúc bạn chọn được món quà ưng ý! Cần gợi ý thêm cứ hỏi mình nhé.',
      recommendations: [],
      quickReplies: ['Món khác', 'Làm lại từ đầu'],
      context: prevContext,
    };
  }

  // Gộp ngữ cảnh: thông tin mới ghi đè thông tin cũ
  let ctx: ChatContext = { ...prevContext };
  const lastShown = products.filter((p) => prevContext.lastShownIds.includes(p.id));

  if (parsed.recipient && prevContext.recipient && parsed.recipient !== prevContext.recipient) {
    // Đổi người nhận ("thế còn cho mẹ?") → bỏ các đặc điểm của người cũ, giữ dịp & ngân sách
    ctx = { ...ctx, gender: undefined, traitIds: [], productTypeIds: [] };
    // Bỏ dịp không hợp với người nhận mới (VD: "Kỷ niệm ngày yêu" khi chuyển sang tặng mẹ)
    const holiday = VIETNAMESE_HOLIDAYS.find((h) => h.id === ctx.occasion);
    if (holiday && !parsed.occasionId && !holiday.targetRecipients.includes(parsed.recipient)) {
      ctx.occasion = undefined;
    }
  }
  if (parsed.recipient) ctx.recipient = parsed.recipient;
  if (parsed.gender) ctx.gender = parsed.gender;
  else if (parsed.recipient && parsed.recipient !== prevContext.recipient) ctx.gender = undefined;
  if (parsed.occasionId) ctx.occasion = parsed.occasionId;
  if (parsed.traitIds.length) ctx.traitIds = [...new Set([...ctx.traitIds, ...parsed.traitIds])];
  if (parsed.productTypeIds.length) ctx.productTypeIds = parsed.productTypeIds;

  let adjustNote = '';
  if (parsed.budget) {
    ctx.budget = parsed.budget;
  } else if (parsed.command === 'cheaper') {
    if (lastShown.length) {
      ctx.budget = { max: Math.min(...lastShown.map((p) => p.price)) - 1 };
      adjustNote = `Ok, mình tìm món rẻ hơn (${describeBudget(ctx.budget)}) nhé.`;
    } else if (ctx.budget?.max) {
      ctx.budget = { max: Math.round(ctx.budget.max * 0.8) };
    }
  } else if (parsed.command === 'pricier') {
    if (lastShown.length) {
      ctx.budget = { min: Math.max(...lastShown.map((p) => p.price)) + 1 };
      adjustNote = `Ok, mình tìm món cao cấp hơn (${describeBudget(ctx.budget)}) nhé.`;
    } else if (ctx.budget?.max) {
      ctx.budget = { min: ctx.budget.max };
    }
  }

  const understoodSomething = hasCriteria(parsed) || ['cheaper', 'pricier', 'other'].includes(parsed.command ?? '');
  if (!understoodSomething) {
    return {
      text:
        'Mình chưa hiểu rõ lắm 😅 Bạn thử mô tả giúp mình: tặng ai, dịp gì, ngân sách bao nhiêu và người đó tính cách thế nào nhé.\n' +
        'Ví dụ: "Người yêu tôi rất khó tính, muốn tặng quà kỷ niệm tầm 500k".',
      recommendations: [],
      quickReplies: SAMPLE_QUESTIONS,
      context: prevContext,
    };
  }

  // "Món khác" → loại các món đã gợi ý; đổi tiêu chí → bắt đầu danh sách mới
  const isMoreRequest = parsed.command === 'other' && !hasCriteria(parsed);
  const excludeIds = new Set(isMoreRequest ? ctx.shownIds : []);
  if (!isMoreRequest) ctx.shownIds = [];

  const count = parsed.requestedCount ?? DEFAULT_RESULT_COUNT;
  const result = recommend(products, ctx, count, excludeIds, !isMoreRequest);

  const lines: string[] = [];
  if (adjustNote) lines.push(adjustNote);
  const summary = describeContext(ctx);
  if (summary) lines.push(`📝 Mình hiểu là: ${summary}.`);

  const traits = GIFT_TRAITS.filter((t) => parsed.traitIds.includes(t.id));
  traits.slice(0, 2).forEach((t) => lines.push(`💡 ${t.advice}`));

  if (result.items.length === 0) {
    lines.push(
      isMoreRequest
        ? '🙏 Mình đã gợi ý hết các món phù hợp với tiêu chí này rồi. Bạn thử đổi ngân sách hoặc mô tả thêm sở thích nhé!'
        : '🙏 Hiện chưa có món nào phù hợp với tiêu chí này. Bạn thử đổi ngân sách hoặc người nhận nhé!',
    );
  } else {
    if (result.relaxedBudget && ctx.budget) {
      lines.push(`⚠️ Chưa có món nào đúng ngân sách ${describeBudget(ctx.budget)}, đây là các món có giá gần nhất:`);
    } else if (result.relaxedRecipient && ctx.recipient) {
      lines.push(`⚠️ Chưa có món dành riêng cho ${RECIPIENT_LABELS[ctx.recipient] ?? ctx.recipient} trong ngân sách này, bạn tham khảo các món sau:`);
    } else {
      lines.push(`🎁 Đây là ${result.items.length} món hợp nhất${isMoreRequest ? ' tiếp theo' : ''} (bấm vào thẻ để xem chi tiết):`);
    }
    const types = PRODUCT_TYPES.filter((t) => ctx.productTypeIds.includes(t.id));
    if (types.length && !result.items.some((i) => i.matchesType)) {
      lines.push(`(Hiện chưa có ${types.map((t) => t.label).join(', ')} phù hợp, mình gợi ý món tương tự.)`);
    }
  }

  // Hỏi lại thông tin còn thiếu (ưu tiên: người nhận → giới tính → ngân sách)
  const quickReplies: string[] = [];
  let followUp: string | undefined;
  const knownGender = ctx.gender ?? (ctx.occasion ? OCCASION_GENDER[ctx.occasion] : undefined);
  if (!ctx.recipient) {
    followUp = '👉 Bạn định tặng cho ai ạ? Mình sẽ chọn sát hơn.';
    quickReplies.push(...RECIPIENT_QUICK_REPLIES);
  } else if (!knownGender && GENDER_QUICK_REPLIES[ctx.recipient]) {
    followUp = '👉 Người ấy là nam hay nữ ạ? Mình sẽ gợi ý chuẩn hơn (hiện đang ưu tiên món hợp cả hai).';
    quickReplies.push(...GENDER_QUICK_REPLIES[ctx.recipient]);
  } else if (!ctx.budget) {
    followUp = '👉 Bạn dự định chi khoảng bao nhiêu ạ?';
    quickReplies.push(...BUDGET_QUICK_REPLIES);
  }
  if (result.items.length) quickReplies.push(...ACTION_QUICK_REPLIES);
  else if (ctx.budget) quickReplies.push(...BUDGET_QUICK_REPLIES.filter((q) => !quickReplies.includes(q)));
  quickReplies.push('Làm lại từ đầu');

  const shownNow = result.items.map((i) => i.product.id);
  ctx.lastShownIds = shownNow.length ? shownNow : ctx.lastShownIds;
  ctx.shownIds = [...new Set([...ctx.shownIds, ...shownNow])];

  return {
    text: lines.join('\n'),
    recommendations: result.items.map((i) => ({ productId: i.product.id, reasons: i.reasons })),
    followUp,
    quickReplies,
    context: ctx,
  };
}
