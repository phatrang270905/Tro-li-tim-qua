# 🎁 Trợ Lý Tìm Quà

Website gợi ý quà tặng (cho người yêu, bố mẹ, đồng nghiệp…) kèm link mua trên Shopee và TikTok Shop.
Trang có sẵn một **chatbot gợi ý quà** ở góc phải dưới màn hình. Chatbot chạy hoàn toàn miễn phí, không cần tài khoản hay khoá API nào.

🌐 **Web đang chạy tại:** https://tro-li-tim-qua.phatrang270905.workers.dev
📦 **Code trên GitHub:** https://github.com/phatrang270905/Tro-li-tim-qua

Tài liệu này hướng dẫn từng bước để bạn **tải code về máy và chạy website**. Bạn không cần biết lập trình, chỉ cần làm đúng theo thứ tự. Lần đầu mất khoảng 15–20 phút.
Nếu chỉ muốn xem web thì không cần làm gì cả, cứ mở link ở trên.

---

## Mục lục

1. [Cài 2 phần mềm cần thiết (chỉ làm 1 lần)](#bước-1--cài-2-phần-mềm-cần-thiết-chỉ-làm-1-lần)
2. [Tải code về máy](#bước-2--tải-code-về-máy)
3. [Mở cửa sổ dòng lệnh trong thư mục code](#bước-3--mở-cửa-sổ-dòng-lệnh-trong-thư-mục-code)
4. [Cài đặt thư viện (chỉ làm 1 lần)](#bước-4--cài-đặt-thư-viện-chỉ-làm-1-lần)
5. [Chạy website](#bước-5--chạy-website-)
6. [Những lần sau chạy lại thế nào?](#những-lần-sau-chạy-lại-thế-nào)
7. [Sửa sản phẩm, link mua và chatbot](#sửa-sản-phẩm-link-mua-và-chatbot)
8. [Cập nhật web đang chạy trên mạng](#cập-nhật-web-đang-chạy-trên-mạng)
9. [Gặp lỗi thì làm gì?](#gặp-lỗi-thì-làm-gì)
10. [(Dành cho người phụ trách) Cấu hình deploy](#dành-cho-người-phụ-trách-cấu-hình-deploy)

---

## Bước 1 — Cài 2 phần mềm cần thiết (chỉ làm 1 lần)

### 1.1. Node.js (bắt buộc)

Node.js là phần mềm giúp máy tính chạy được website này.

1. Vào trang **https://nodejs.org**
2. Bấm nút tải bản có chữ **LTS** (bản ổn định, khuyên dùng).
3. Mở file vừa tải và bấm **Next → Next → … → Install → Finish**, giữ nguyên mọi lựa chọn mặc định.

> ⚠️ Cần Node.js **phiên bản 22 trở lên**. Nếu tải bản LTS mới nhất từ trang chủ thì đã đủ.

### 1.2. Git (không bắt buộc, nên cài)

Git dùng để tải code về và cập nhật code mới sau này chỉ bằng một lệnh.
Nếu không muốn cài Git, bạn có thể bỏ qua và tải code dạng file ZIP ở bước 2 (cách A).

1. Vào trang **https://git-scm.com/downloads**
2. Chọn hệ điều hành của bạn (Windows / macOS) và tải về.
3. Cài đặt: bấm **Next** liên tục rồi **Install**, giữ nguyên mặc định.

### 1.3. Kiểm tra đã cài thành công chưa

Mở cửa sổ dòng lệnh:
- **Windows:** bấm phím `Windows`, gõ `cmd`, rồi bấm `Enter`.
- **macOS:** bấm `Cmd + Space`, gõ `Terminal`, rồi bấm `Enter`.

Gõ lần lượt từng dòng dưới đây, mỗi dòng xong thì bấm `Enter`:

```
node -v
npm -v
git --version
```

Nếu mỗi dòng hiện ra một con số phiên bản (ví dụ `v22.12.0`) là đã cài thành công ✅.
Nếu chỉ dòng `git` báo lỗi mà bạn không cài Git thì không sao, cứ đi tiếp.

> 💡 Nếu `node -v` báo *"không nhận ra lệnh"* ngay sau khi cài, hãy **tắt cửa sổ dòng lệnh rồi mở lại**. Vẫn chưa được thì khởi động lại máy.

---

## Bước 2 — Tải code về máy

Chọn **một trong hai cách** dưới đây.

### Cách A — Tải file ZIP (dễ nhất, không cần Git)

1. Mở trang GitHub của dự án: https://github.com/phatrang270905/Tro-li-tim-qua
2. Bấm nút màu xanh **`<> Code`** → chọn **Download ZIP**.
3. Tìm file ZIP vừa tải (thường nằm trong thư mục *Downloads*), bấm chuột phải → **Extract All… (Giải nén tất cả)**.
4. Chuyển thư mục vừa giải nén tới chỗ dễ tìm, ví dụ `D:\Tro-li-tim-qua`.

### Cách B — Dùng Git (dễ cập nhật về sau)

Trong cửa sổ dòng lệnh, gõ 2 lệnh sau:

```
cd Desktop
git clone https://github.com/phatrang270905/Tro-li-tim-qua.git Tro-li-tim-qua
```

Code sẽ được tải vào thư mục **Tro-li-tim-qua** trên màn hình Desktop.

---

## Bước 3 — Mở cửa sổ dòng lệnh trong thư mục code

Bạn cần mở cửa sổ dòng lệnh **ngay trong thư mục code** (thư mục có file `package.json`).

**Windows (cách nhanh):**
1. Mở thư mục code bằng File Explorer. Bạn sẽ thấy các file như `package.json`, `index.html` và thư mục `src`.
2. Bấm vào **thanh địa chỉ** ở phía trên cửa sổ, xoá hết chữ, gõ `cmd` rồi bấm `Enter`.
3. Cửa sổ dòng lệnh đen hiện ra, đã ở đúng thư mục ✅.

**macOS:**
1. Mở Terminal và gõ `cd ` (chữ `cd` rồi **một dấu cách**).
2. Kéo thả thư mục code từ Finder vào cửa sổ Terminal, rồi bấm `Enter`.

---

## Bước 4 — Cài đặt thư viện (chỉ làm 1 lần)

Trong cửa sổ dòng lệnh vừa mở, gõ:

```
npm install
```

Bấm `Enter` và **chờ 1–5 phút** (tuỳ tốc độ mạng). Máy sẽ tải các thư viện cần thiết về thư mục `node_modules`.

Khi dấu nhắc lệnh hiện lại và không có dòng chữ đỏ nào ghi `ERR!`, nghĩa là đã xong ✅.
Các dòng `WARN` (cảnh báo màu vàng) là bình thường, **không cần lo**.

---

## Bước 5 — Chạy website 🚀

Vẫn trong cửa sổ dòng lệnh đó, gõ:

```
npm run dev
```

Sau vài giây sẽ hiện ra dòng như sau:

```
  ➜  Local:   http://localhost:3000/
```

👉 Mở trình duyệt (Chrome, Edge, Cốc Cốc…) và vào địa chỉ **http://localhost:3000**

Website đã chạy trên máy bạn 🎉. Hãy thử bấm nút 🎁 màu đỏ ở góc phải dưới và hỏi chatbot, ví dụ:

> *Người yêu tôi rất khó tính, muốn tặng quà kỷ niệm tầm 500k*

### Lưu ý quan trọng
- **Không tắt cửa sổ dòng lệnh** khi đang xem web. Tắt nó đi thì web cũng dừng.
- Muốn **dừng web**: bấm vào cửa sổ dòng lệnh rồi nhấn `Ctrl + C`. Nếu máy hỏi `Terminate batch job (Y/N)?` thì gõ `Y` rồi bấm `Enter`.
- Địa chỉ `localhost` **chỉ mở được trên máy của bạn**, người khác không vào được. Muốn gửi web cho người khác xem, hãy dùng link https://tro-li-tim-qua.phatrang270905.workers.dev
- Những gì bạn sửa trên máy **chưa xuất hiện trên link web thật** cho tới khi bạn đẩy code lên GitHub (xem [Cập nhật web đang chạy trên mạng](#cập-nhật-web-đang-chạy-trên-mạng)).

---

## Những lần sau chạy lại thế nào?

Từ lần thứ hai trở đi, bạn chỉ cần làm 2 việc:

1. Mở cửa sổ dòng lệnh trong thư mục code (như [Bước 3](#bước-3--mở-cửa-sổ-dòng-lệnh-trong-thư-mục-code)).
2. Gõ `npm run dev` rồi vào **http://localhost:3000**

### Lấy code mới nhất

- **Nếu tải bằng Git (cách B):** trong thư mục code, gõ 2 lệnh sau:
  ```
  git pull
  npm install
  ```
- **Nếu tải bằng ZIP (cách A):** tải lại file ZIP mới, giải nén ra, rồi làm lại từ [Bước 3](#bước-3--mở-cửa-sổ-dòng-lệnh-trong-thư-mục-code).

---

## Sửa sản phẩm, link mua và chatbot

Bạn có thể sửa nội dung bằng bất kỳ trình soạn thảo nào. Khuyên dùng **Visual Studio Code** (miễn phí, tải ở https://code.visualstudio.com).
Khi đang chạy `npm run dev`, mỗi lần bạn **lưu file** (`Ctrl + S`) thì website sẽ tự cập nhật ngay.

| Muốn sửa gì | Mở file nào |
|---|---|
| Danh sách sản phẩm: tên, giá, ảnh, **link Shopee / TikTok** | `src/data/products.ts` |
| Tính cách và sở thích mà chatbot hiểu được (khó tính, mê công nghệ…) | `src/data/traits.ts` |
| Mẫu lời chúc | `src/data/cards.ts` |

**Ví dụ: đổi link mua của một sản phẩm.** Mở `src/data/products.ts`, tìm dòng:

```ts
shopeeUrl: 'https://shopee.vn',
```

Rồi thay phần trong dấu nháy đơn bằng link sản phẩm thật:

```ts
shopeeUrl: 'https://shopee.vn/link-san-pham-that-cua-ban',
```

> ⚠️ **Giữ nguyên dấu nháy đơn `' '` và dấu phẩy `,` ở cuối dòng.** Nếu xoá nhầm, website sẽ báo lỗi. Khi đó bấm `Ctrl + Z` để hoàn tác.

---

## Cập nhật web đang chạy trên mạng

Web thật được **Cloudflare** tự động cập nhật mỗi khi có code mới trên nhánh `main` của GitHub. Bạn không cần đăng nhập Cloudflare hay upload file gì cả.

> Phần này cần **Git** (Bước 1.2), và tài khoản GitHub của bạn phải có quyền đẩy code lên dự án.

**1. Kiểm tra trên máy trước.** Chạy `npm run dev` và xem web ở http://localhost:3000 đã đúng như ý chưa.

**2. Kiểm tra web có đóng gói được không.** Gõ:

```
npm run build
```

Nếu cuối cùng hiện dòng `✓ built in ...` là ổn ✅. Nếu có chữ đỏ báo lỗi thì **dừng lại và sửa trước**, vì nếu đẩy lên, Cloudflare cũng sẽ báo lỗi y như vậy.

**3. Đẩy code lên GitHub.** Gõ lần lượt 3 lệnh, thay phần trong ngoặc kép bằng mô tả ngắn về những gì bạn đã sửa:

```
git add .
git commit -m "Cập nhật link Shopee cho sản phẩm"
git push
```

**4. Chờ khoảng 1–2 phút** rồi mở lại https://tro-li-tim-qua.phatrang270905.workers.dev. Nếu chưa thấy thay đổi, nhấn `Ctrl + F5` để tải lại trang.

> 💡 Nếu sau 5 phút web vẫn chưa đổi, có thể bước đóng gói trên Cloudflare đã lỗi. Hãy báo người phụ trách kỹ thuật kiểm tra (xem [phần cuối](#dành-cho-người-phụ-trách-cấu-hình-deploy)). Trong lúc đó web vẫn chạy bản cũ, không bị sập.

---

## Gặp lỗi thì làm gì?

| Hiện tượng | Cách xử lý |
|---|---|
| `'node' is not recognized…` hoặc `'npm' is not recognized…` | Chưa cài Node.js, hoặc cần mở lại cửa sổ dòng lệnh. Làm lại [Bước 1.1](#11-nodejs-bắt-buộc), rồi khởi động lại máy. |
| Dùng PowerShell và gặp lỗi `npm.ps1 cannot be loaded because running scripts is disabled` | Chuyển sang dùng **cmd** (cách mở ở [Bước 3](#bước-3--mở-cửa-sổ-dòng-lệnh-trong-thư-mục-code)) thay cho PowerShell. |
| `npm install` báo lỗi `ENOENT … package.json` | Bạn đang mở cửa sổ dòng lệnh **sai thư mục**. Hãy mở đúng thư mục có file `package.json`. |
| `npm install` báo lỗi mạng, `ETIMEDOUT` hoặc `ECONNRESET` | Mạng chập chờn. Kiểm tra Internet rồi chạy lại `npm install`. |
| Báo lỗi liên quan phiên bản Node (`Unsupported engine`, `requires Node.js 20.19+`…) | Node.js quá cũ. Tải và cài lại bản **LTS** mới nhất từ https://nodejs.org |
| `Port 3000 is already in use` | Web đang chạy ở một cửa sổ dòng lệnh khác. Đóng cửa sổ đó (hoặc nhấn `Ctrl + C` trong đó) rồi chạy lại. |
| Vào `localhost:3000` thấy *"This site can't be reached"* | Lệnh `npm run dev` chưa chạy hoặc đã bị tắt. Mở lại cửa sổ dòng lệnh và chạy lại. |
| Trang hiện trắng tinh sau khi sửa file | Có thể bạn vừa sửa sai cú pháp. Xem dòng chữ đỏ trong cửa sổ dòng lệnh để biết file nào lỗi, hoặc bấm `Ctrl + Z` trong file vừa sửa. |
| `git push` báo `rejected` hoặc `fetch first` | Trên GitHub đã có code mới hơn máy bạn. Gõ `git pull` trước rồi `git push` lại. |
| `git push` báo `Permission denied` hoặc `403` | Tài khoản GitHub của bạn chưa có quyền đẩy code lên dự án. Nhờ chủ dự án thêm bạn làm cộng tác viên (*Collaborator*). |
| Đã `git push` nhưng web thật không đổi | Nhấn `Ctrl + F5` để tải lại. Vẫn không đổi thì báo người phụ trách kiểm tra log trên Cloudflare. |

Vẫn chưa xử lý được? Hãy **chụp màn hình cửa sổ dòng lệnh** (nhất là các dòng chữ đỏ) và gửi cho người phụ trách kỹ thuật.

---

## (Dành cho người phụ trách) Cấu hình deploy

Web là trang tĩnh (React + Vite) và được host **miễn phí** trên **Cloudflare Workers** (static assets), có kết nối Git với repo GitHub.
Web **không cần** khoá API hay file `.env` nào để chạy. Các file `.env.example` và `metadata.json` là phần thừa từ Google AI Studio, không được dùng tới.

| Mục | Giá trị |
|---|---|
| Link production | https://tro-li-tim-qua.phatrang270905.workers.dev |
| Quản lý ở | Cloudflare Dashboard → **Compute → Workers & Pages → `tro-li-tim-qua`** |
| Nhánh tự deploy | `main` (đẩy code lên nhánh khác sẽ tạo link xem thử riêng) |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy` |
| Thư mục kết quả | `dist/` |
| Phiên bản Node | 22 (khai báo trong file `.nvmrc`) |

Các file liên quan trong repo:
- **`wrangler.jsonc`**: cấu hình Cloudflare (tên Worker, thư mục `dist`, bật link `workers.dev` và link xem thử). Nếu thiếu file này, mỗi lần build Cloudflare sẽ tự cài thêm `wrangler` và `@cloudflare/vite-plugin`, chậm hơn và dễ lỗi hơn. **Không nên xoá.**
- **`.nvmrc`**: buộc máy build dùng Node 22, vì Vite 8 cần Node ≥ 20.19.

**Xem log hoặc quay lại bản cũ:** vào Cloudflare Dashboard → `tro-li-tim-qua` → tab **Deployments**. Mỗi lần deploy có log riêng. Nếu bản mới bị lỗi, chọn một bản cũ và bấm **Rollback**.

**Deploy thủ công từ máy** (khi không muốn chờ GitHub, hoặc để kiểm tra trước):

```
npm run build
npx wrangler deploy --dry-run   # chỉ kiểm tra cấu hình, không deploy
npx wrangler login              # lần đầu: đăng nhập Cloudflare qua trình duyệt
npx wrangler deploy             # deploy thật
```

**Gắn tên miền riêng:** Cloudflare Dashboard → `tro-li-tim-qua` → **Settings → Domains & Routes → Add → Custom domain**. HTTPS được cấp miễn phí.
