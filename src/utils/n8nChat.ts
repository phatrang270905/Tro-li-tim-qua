import { BotRecommendation } from './chatbotEngine';

/**
 * Kết nối chatbot với AI Agent chạy trên n8n (xem thư mục n8n/ và n8n/HUONG-DAN.md).
 *
 * Dán "Production URL" của node Webhook trong n8n vào N8N_CHAT_URL bên dưới.
 * (Hoặc đặt biến môi trường VITE_N8N_CHAT_URL, biến này được ưu tiên hơn.)
 * Để trống '' = tắt AI, chatbot dùng bộ luật có sẵn trên trình duyệt như cũ.
 */
const N8N_CHAT_URL = '';

export const AI_CHAT_URL: string = (import.meta.env.VITE_N8N_CHAT_URL as string | undefined)?.trim() || N8N_CHAT_URL;

const REQUEST_TIMEOUT_MS = 30_000;

export interface AiReply {
  text: string;
  recommendations: BotRecommendation[];
  followUp?: string;
  quickReplies: string[];
}

const asString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/** Gửi tin nhắn tới n8n. Lỗi mạng / quá giờ / dữ liệu sai → ném lỗi để chatbot chuyển sang bộ luật dự phòng. */
export async function askAiAgent(message: string, sessionId: string): Promise<AiReply> {
  if (!AI_CHAT_URL) throw new Error('Chưa cấu hình N8N_CHAT_URL');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(AI_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, sessionId }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`n8n trả về lỗi HTTP ${res.status}`);

    const data = (await res.json()) as Record<string, unknown>;
    const text = asString(data.reply);
    if (!text) throw new Error('n8n trả về câu trả lời rỗng');

    const recommendations: BotRecommendation[] = Array.isArray(data.recommendations)
      ? data.recommendations
          .map((r) => r as Record<string, unknown>)
          .filter((r) => asString(r?.id))
          .map((r) => ({ productId: asString(r.id), reasons: asString(r.reason) ? [asString(r.reason)] : [] }))
      : [];

    const quickReplies = Array.isArray(data.quickReplies) ? data.quickReplies.map(asString).filter(Boolean).slice(0, 4) : [];

    return { text, recommendations, followUp: asString(data.followUp) || undefined, quickReplies };
  } finally {
    clearTimeout(timer);
  }
}
