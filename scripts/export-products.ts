/**
 * Xuất danh sách quà ra file public/products.json để AI Agent trên n8n đọc được.
 * Tự chạy trước `npm run dev` và `npm run build` (xem "predev" / "prebuild" trong package.json).
 * Sau khi deploy, file có ở: https://tro-li-tim-qua.online/products.json
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRODUCTS } from '../src/data/products';

const outFile = resolve(dirname(fileURLToPath(import.meta.url)), '../public/products.json');

// Chỉ gửi những thông tin AI cần để chọn quà (không cần ảnh, link mua...)
const products = PRODUCTS.map((p) => ({
  id: p.id,
  title: p.title,
  price: p.price,
  priceLabel: p.priceLabel,
  category: p.category,
  recipientTypes: p.recipientTypes,
  occasions: p.occasions,
  vibes: p.vibes,
  insight: p.psychologicalInsight,
}));

mkdirSync(dirname(outFile), { recursive: true });
// Bọc trong object (không để mảng trần) để node HTTP Request của n8n trả về đúng 1 item
writeFileSync(outFile, JSON.stringify({ updatedAt: new Date().toISOString(), products }, null, 2) + '\n');
console.log(`✓ Đã xuất ${products.length} sản phẩm ra public/products.json`);
