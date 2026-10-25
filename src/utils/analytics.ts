import { PageTab, Product } from '../types';

const GA_MEASUREMENT_ID = 'G-SVRJLXB4BQ';

export type BuyPlatform = 'shopee' | 'tiktok';
export type BuySource = 'product_card' | 'product_detail' | 'chatbot' | 'wishlist';

// Virtual page paths reported to GA. The app switches tabs without changing the URL,
// so each tab needs its own name here. Missing tabs fall back to "/<tab id>".
const PAGE_INFO: Partial<Record<PageTab, { path: string; title: string }>> = {
  home: { path: '/', title: 'Trang chủ' },
  girlfriend: { path: '/nguoi-yeu', title: 'Quà cho người yêu' },
  boyfriend: { path: '/qua-cho-ban-trai', title: 'Quà cho người yêu nam' },
  colleague: { path: '/dong-nghiep', title: 'Quà cho đồng nghiệp' },
  parents: { path: '/bo-me', title: 'Quà cho bố mẹ' },
};

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

// Only collect data on the deployed site, never from `npm run dev` / `npm run preview` on localhost.
const isEnabled =
  import.meta.env.PROD && !['localhost', '127.0.0.1'].includes(window.location.hostname);

let lastPageLocation: string | null = null;

function gtag(...args: unknown[]) {
  if (isEnabled) window.gtag(...args);
}

export function initAnalytics() {
  if (!isEnabled) return;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    // gtag.js expects the raw `arguments` object, not an array
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  // Page views are sent manually from trackPageView on every tab change
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

export function trackPageView(tab: PageTab) {
  const page = PAGE_INFO[tab] ?? { path: `/${tab}`, title: tab };
  const pageLocation = window.location.origin + page.path;
  const pageParams = {
    page_location: pageLocation,
    page_title: page.title,
    ...(lastPageLocation ? { page_referrer: lastPageLocation } : {}),
  };
  // `set` makes later events (click_buy, search...) report the current tab as their page too
  gtag('set', pageParams);
  gtag('event', 'page_view', pageParams);
  lastPageLocation = pageLocation;
}

export function trackBuyClick(product: Product, platform: BuyPlatform, source: BuySource) {
  gtag('event', 'click_buy', {
    platform,
    source,
    product_id: product.id,
    product_name: product.title,
    price: product.price,
  });
}

export function trackAddToWishlist(product: Product) {
  gtag('event', 'add_to_wishlist', {
    currency: 'VND',
    value: product.price,
    items: [{ item_id: product.id, item_name: product.title, price: product.price }],
  });
}

export function trackSearch(searchTerm: string) {
  const term = searchTerm.trim();
  if (!term) return;
  gtag('event', 'search', { search_term: term });
}

// Only counts messages; the chat text itself is never sent because users may type personal details.
export function trackChatbotMessage() {
  gtag('event', 'chatbot_message');
}
