import React, { useEffect, useRef, useState } from 'react';
import { Product } from '../types';
import { trackBuyClick, trackChatbotMessage } from '../utils/analytics';
import { BotRecommendation, ChatContext, EMPTY_CONTEXT, answerQuestion, greetingReply } from '../utils/chatbotEngine';

interface GiftChatbotProps {
  products: Product[];
  onOpenDetail: (product: Product) => void;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'bot';
  text: string;
  recommendations?: BotRecommendation[];
  followUp?: string;
  quickReplies?: string[];
}

interface ChatSession {
  messages: ChatMessage[];
  context: ChatContext;
}

const STORAGE_KEY = 'gift_chatbot_session';
const TYPING_DELAY_MS = 450;

const createId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createWelcomeSession = (): ChatSession => {
  const welcome = greetingReply();
  return {
    messages: [{ id: createId(), role: 'bot', text: welcome.text, quickReplies: welcome.quickReplies }],
    context: welcome.context,
  };
};

// Lưu tạm trong phiên (đóng tab là mất) — không cần database
const loadSession = (): ChatSession => {
  try {
    const saved = sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as ChatSession;
      if (Array.isArray(parsed.messages) && parsed.messages.length && parsed.context) {
        return { messages: parsed.messages, context: { ...EMPTY_CONTEXT, ...parsed.context } };
      }
    }
  } catch {
    // sessionStorage không khả dụng (chế độ ẩn danh, bị chặn...) → bắt đầu phiên mới
  }
  return createWelcomeSession();
};

const formatVND = (amount: number) => new Intl.NumberFormat('vi-VN').format(amount) + 'đ';

export const GiftChatbot: React.FC<GiftChatbotProps> = ({ products, onOpenDetail }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [session, setSession] = useState<ChatSession>(loadSession);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } catch (e) {
      console.warn('SessionStorage error:', e);
    }
  }, [session]);

  // Tự cuộn: bot vừa trả lời → cuộn tới ĐẦU câu trả lời (để đọc từ trên xuống), còn lại → cuộn xuống cuối
  useEffect(() => {
    const container = scrollRef.current;
    if (!isOpen || !container) return;
    const last = session.messages[session.messages.length - 1];
    const lastEl = last ? container.querySelector<HTMLElement>(`[data-message-id="${last.id}"]`) : null;
    if (!isTyping && last?.role === 'bot' && lastEl && session.messages.length > 1) {
      container.scrollTop = lastEl.offsetTop - 12;
    } else {
      container.scrollTop = container.scrollHeight;
    }
  }, [session.messages, isTyping, isOpen]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (typingTimer.current) clearTimeout(typingTimer.current);
    };
  }, []);

  const sendMessage = (rawText: string) => {
    const text = rawText.trim();
    if (!text || isTyping) return;
    trackChatbotMessage();

    const userMessage: ChatMessage = { id: createId(), role: 'user', text };
    setSession((prev) => ({ ...prev, messages: [...prev.messages, userMessage] }));
    setInput('');
    setIsTyping(true);

    typingTimer.current = setTimeout(() => {
      setSession((prev) => {
        const reply = answerQuestion(text, products, prev.context);
        const botMessage: ChatMessage = {
          id: createId(),
          role: 'bot',
          text: reply.text,
          recommendations: reply.recommendations,
          followUp: reply.followUp,
          quickReplies: reply.quickReplies,
        };
        return { messages: [...prev.messages, botMessage], context: reply.context };
      });
      setIsTyping(false);
    }, TYPING_DELAY_MS);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleClearChat = () => {
    if (typingTimer.current) clearTimeout(typingTimer.current);
    setIsTyping(false);
    setSession(createWelcomeSession());
  };

  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <>
      {/* Floating bubble */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-5 right-4 sm:right-6 z-40 w-14 h-14 rounded-full bg-[#b21e36] hover:bg-[#920024] text-white shadow-2xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer"
        title={isOpen ? 'Đóng trợ lý' : 'Hỏi trợ lý gợi ý quà'}
        aria-label={isOpen ? 'Đóng trợ lý' : 'Mở trợ lý gợi ý quà'}
      >
        <span className="material-symbols-outlined text-[28px]">{isOpen ? 'close' : 'redeem'}</span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#ff5722] border-2 border-white animate-pulse" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed z-40 bottom-24 right-4 sm:right-6 left-4 sm:left-auto sm:w-[400px] h-[min(620px,calc(100dvh-8rem))] bg-white rounded-3xl shadow-2xl border border-[#eee7e3] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Header */}
          <div className="px-4 py-3 bg-[#b21e36] text-white flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              </span>
              <div className="min-w-0">
                <h3 className="font-extrabold text-sm leading-tight">Trợ Lý Gợi Ý Quà</h3>
                <p className="text-[11px] text-white/80 truncate">Kể mình nghe: tặng ai, dịp gì, ngân sách bao nhiêu</p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleClearChat}
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
                title="Bắt đầu cuộc trò chuyện mới"
              >
                <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white/15 flex items-center justify-center transition-colors cursor-pointer"
                title="Đóng"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-[#fff8f5]">
            {session.messages.map((msg) => (
              <div
                key={msg.id}
                data-message-id={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={msg.role === 'user' ? 'max-w-[85%]' : 'w-full max-w-[95%]'}>
                  <div
                    className={`px-3.5 py-2.5 rounded-2xl text-[13px] leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-[#b21e36] text-white rounded-br-md'
                        : 'bg-white text-[#1e1b19] border border-[#eee7e3] rounded-bl-md'
                    }`}
                  >
                    {msg.text}
                  </div>

                  {msg.recommendations && msg.recommendations.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {msg.recommendations.map((rec) => {
                        const product = products.find((p) => p.id === rec.productId);
                        if (!product) return null;
                        return (
                          <div
                            key={rec.productId}
                            className="bg-white rounded-2xl border border-[#eee7e3] p-2.5 flex gap-2.5 hover:border-[#b21e36]/40 hover:shadow-md transition-all"
                          >
                            <button
                              type="button"
                              onClick={() => onOpenDetail(product)}
                              className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-[#f4ece8] cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <img
                                src={product.image}
                                alt={product.imageAlt || product.title}
                                className="w-full h-full object-cover"
                                loading="lazy"
                                referrerPolicy="no-referrer"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src =
                                    'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=500&auto=format&fit=crop&q=60';
                                }}
                              />
                            </button>
                            <div className="flex-1 min-w-0 flex flex-col">
                              <button
                                type="button"
                                onClick={() => onOpenDetail(product)}
                                className="text-left text-xs font-bold text-[#1e1b19] hover:text-[#b21e36] line-clamp-2 leading-snug cursor-pointer"
                              >
                                {product.title}
                              </button>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-sm font-extrabold text-[#b21e36]">{formatVND(product.price)}</span>
                                <span className="text-[10px] text-[#8a7273]">⭐ {product.rating}</span>
                              </div>
                              {rec.reasons.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {rec.reasons.map((reason) => (
                                    <span
                                      key={reason}
                                      className="px-1.5 py-0.5 rounded-md bg-[#ffdada]/60 text-[#920024] text-[10px] font-semibold"
                                    >
                                      {reason}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="flex gap-1.5 mt-2">
                                <a
                                  href={product.shopeeUrl}
                                  onClick={() => trackBuyClick(product, 'shopee', 'chatbot')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 px-2 rounded-full bg-[#ff5722] hover:bg-[#b02f00] text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px]">shopping_bag</span>
                                  Shopee
                                </a>
                                <a
                                  href={product.tiktokUrl}
                                  onClick={() => trackBuyClick(product, 'tiktok', 'chatbot')}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 py-1.5 px-2 rounded-full bg-[#f4ece8] hover:bg-[#eee7e3] text-[#1e1b19] text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[14px] text-[#ba0035]">bolt</span>
                                  TikTok
                                </a>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {msg.followUp && (
                    <div className="mt-2 px-3.5 py-2.5 rounded-2xl rounded-bl-md bg-white border border-[#eee7e3] text-[13px] leading-relaxed text-[#1e1b19]">
                      {msg.followUp}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start">
                <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-[#eee7e3] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b21e36] animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b21e36] animate-bounce [animation-delay:120ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-[#b21e36] animate-bounce [animation-delay:240ms]" />
                </div>
              </div>
            )}

            {/* Gợi ý trả lời nhanh — chỉ cho tin nhắn cuối của bot */}
            {!isTyping && lastMessage?.role === 'bot' && lastMessage.quickReplies && lastMessage.quickReplies.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {lastMessage.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => sendMessage(reply)}
                    className="px-3 py-1.5 rounded-full bg-white hover:bg-[#ffdada] border border-[#b21e36]/30 text-[#b21e36] text-xs font-semibold text-left transition-colors cursor-pointer"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-3 border-t border-[#eee7e3] bg-white flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="VD: Người yêu khó tính, quà kỷ niệm tầm 500k..."
              className="flex-1 min-w-0 px-3.5 py-2.5 rounded-full bg-[#f4ece8] focus:bg-white border-2 border-transparent focus:border-[#b21e36]/40 text-[13px] text-[#1e1b19] placeholder:text-[#8a7273] outline-none transition-colors"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="w-10 h-10 shrink-0 rounded-full bg-[#b21e36] hover:bg-[#920024] disabled:bg-[#e2bebe] text-white flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
              title="Gửi"
            >
              <span className="material-symbols-outlined text-[20px]">send</span>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
