# 🤖 Hướng dẫn bật AI Agent (n8n) cho chatbot gợi ý quà

Chatbot ở góc phải màn hình có 2 "bộ não":

| | Khi nào dùng |
|---|---|
| **AI Agent trên n8n** (Google Gemini) | Khi đã dán link n8n vào `src/utils/n8nChat.ts` |
| **Bộ luật có sẵn** (chạy trên trình duyệt) | Khi chưa dán link, **hoặc** n8n lỗi / hết lượt / quá 30 giây không trả lời |

Nhờ vậy, n8n có trục trặc thì chatbot vẫn trả lời bằng bộ luật có sẵn, khách không thấy lỗi.

## Cách hoạt động

```
Website ──(tin nhắn + mã phiên)──▶ Webhook (n8n)
                                     │
                                     ▼
                         Tải danh sách quà  ◀── https://tro-li-tim-qua.online/products.json
                                     │
                                     ▼
                              AI Agent ◀── Google Gemini (bộ não)
                                     │  ◀── Bộ nhớ hội thoại (nhớ 10 lượt gần nhất)
                                     ▼
                              Xử lý kết quả (bỏ mã sản phẩm AI tự bịa)
                                     │
Website ◀──(lời nhắn + mã sản phẩm)──┘
```

- File `products.json` được **tự tạo** từ `src/data/products.ts` mỗi lần `npm run dev` / `npm run build`. Sửa sản phẩm trong `products.ts` rồi deploy là AI tự biết, **không cần sửa gì trên n8n**.
- AI chỉ trả về **mã sản phẩm**. Ảnh, giá và link Shopee / TikTok vẫn lấy từ `products.ts`, nên AI không thể bịa link.

---

## Bước 1: Deploy web để có file products.json

Đẩy code này lên GitHub (`git add .`, `git commit`, `git push`), chờ 1–2 phút rồi mở:
**https://tro-li-tim-qua.online/products.json**. Thấy danh sách sản phẩm dạng chữ là được ✅

> Lúc này chatbot vẫn chạy như cũ vì chưa dán link n8n.

## Bước 2: Lấy API key Gemini (miễn phí)

1. Vào **https://aistudio.google.com/apikey**, đăng nhập Google.
2. Bấm **Create API key** rồi copy chuỗi key (bắt đầu bằng `AIza...`).

> ⚠️ Không dán key này vào code website hay gửi cho ai. Key chỉ được dán vào n8n.

## Bước 3: Import workflow vào n8n

1. Đăng nhập n8n Cloud, bấm **Create Workflow** (hoặc **+**).
2. Bấm nút **⋯** ở góc trên bên phải, chọn **Import from File...**, rồi chọn file **`n8n/tro-li-tim-qua-agent.json`** trong thư mục code.
3. Bạn sẽ thấy chuỗi node: Webhook → Tải danh sách quà → Chuẩn bị dữ liệu → AI Agent → Xử lý kết quả → Trả kết quả cho web.

## Bước 4: Gắn API key vào node Gemini

1. Bấm đúp node **Google Gemini Chat Model**.
2. Ô **Credential to connect with**: chọn **Create new credential**, dán API key ở Bước 2 vào ô **API Key**, rồi bấm **Save**. Thấy báo xanh *Connection tested successfully* là đúng.
3. Ô **Model**: chọn một model **Flash** mới nhất trong danh sách (nhanh và rẻ). Mặc định là `gemini-2.5-flash`.
4. Đóng node, bấm **Save** (`Ctrl + S`) để lưu workflow.

## Bước 5: Chạy thử trên n8n

1. Bấm **Execute workflow** ở dưới màn hình. n8n sẽ chờ một tin nhắn thử.
2. Bấm đúp node **Webhook**, mở tab **Test URL** và copy link.
3. Mở PowerShell trên máy, dán lệnh sau (thay `LINK_TEST` bằng link vừa copy, giữ nguyên dấu nháy):
   ```powershell
   Invoke-RestMethod -Method Post -Uri "LINK_TEST" -ContentType "application/json" -Body '{"message":"qua sinh nhat cho me duoi 400k","sessionId":"thu-1"}'
   ```
4. Kết quả đúng sẽ có dạng `reply: ...`, `recommendations: {@{id=...; reason=...}}`. Trên n8n, các node chuyển sang màu xanh.

## Bước 6: Bật workflow (Production)

1. Bấm **Publish** (hoặc gạt nút **Inactive → Active**) ở góc trên bên phải.
2. Bấm đúp node **Webhook**, mở tab **Production URL** và copy link. Link có dạng:
   `https://TEN-CUA-BAN.app.n8n.cloud/webhook/tro-li-tim-qua-chat`

> Phải dùng link **Production**. Link **Test** chỉ chạy khi bạn đang bấm Execute trên n8n.

## Bước 7: Dán link vào website

1. Mở file **`src/utils/n8nChat.ts`** và tìm dòng:
   ```ts
   const N8N_CHAT_URL = '';
   ```
2. Dán link Production vào giữa 2 dấu nháy:
   ```ts
   const N8N_CHAT_URL = 'https://TEN-CUA-BAN.app.n8n.cloud/webhook/tro-li-tim-qua-chat';
   ```
3. Chạy `npm run dev`, mở http://localhost:3000 và chat thử. Trên n8n, tab **Executions** sẽ hiện từng lượt chat.
4. Ổn rồi thì `git add .`, `git commit -m "Bật AI Agent n8n"`, `git push`.

---

## Sửa tính cách / cách trả lời của AI

Bấm đúp node **AI Agent**, kéo xuống phần **Options → System Message**. Đây là "bản hướng dẫn" cho AI, viết bằng tiếng Việt. Sửa xong thì **Save**. Nếu workflow đang Active, có thể cần bấm **Publish** lại. Website không cần deploy lại.

⚠️ **Giữ nguyên** phần *ĐỊNH DẠNG TRẢ LỜI* và dòng `{{ $json.catalog }}` ở cuối. Website cần đúng định dạng JSON đó, còn dòng kia là chỗ chèn danh sách quà.

## Giới hạn cần biết

- **Lượt chạy n8n:** mỗi tin nhắn tính là 1 *execution*. Gói n8n Cloud có giới hạn execution mỗi tháng (xem ở **Settings → Usage and plan**). Hết lượt thì chatbot tự quay về bộ luật có sẵn.
- **Gemini miễn phí** bị giới hạn số lượt mỗi phút / mỗi ngày. Vượt giới hạn thì chatbot cũng tự quay về bộ luật có sẵn. Cần nhiều hơn thì bật trả phí trong Google AI Studio.
- **Link webhook là công khai:** ai xem mã nguồn web cũng thấy link. Workflow đã giới hạn tin nhắn dài tối đa 500 ký tự. Nếu thấy lượt chạy tăng bất thường, hãy tắt workflow (**Inactive**) để chặn.
- **Muốn đổi sang OpenAI / Claude:** xoá node Gemini, bấm dấu **+** dưới chữ *Chat Model* của AI Agent và chọn model khác.

## Gặp lỗi thì làm gì?

| Hiện tượng | Cách xử lý |
|---|---|
| Chatbot vẫn trả lời kiểu cũ | Nhấn `F12` → tab **Console**, tìm dòng *"AI Agent (n8n) không phản hồi"* và đọc lỗi bên cạnh. |
| Console báo **CORS** | Mở node **Webhook** → **Options** → **Allowed Origins (CORS)**: để `*`, hoặc ghi `https://tro-li-tim-qua.online,https://www.tro-li-tim-qua.online,http://localhost:3000`. |
| Console báo **404** | Workflow chưa **Active**, hoặc bạn đang dán link **Test** thay vì **Production**. |
| Console báo **500** | Xem tab **Executions** trên n8n, mở lượt bị đỏ để biết node nào lỗi. Hay gặp nhất: API key Gemini sai, hoặc model không còn (chọn model khác ở Bước 4). |
| Node *Tải danh sách quà* lỗi 404 | Web chưa deploy bản có `products.json` (xem Bước 1). |
| AI gợi ý sai ngân sách / sai người | Sửa System Message (xem phần trên), ví dụ thêm quy tắc rõ hơn. |
