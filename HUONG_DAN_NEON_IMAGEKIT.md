# Hướng dẫn kết nối Neon (database) + ImageKit (ảnh)

Web cần **2 giá trị bí mật** để chạy thật:

| Biến trong `.env.local`  | Lấy ở đâu | Dùng để |
| ------------------------ | --------- | ------- |
| `DATABASE_URL`           | Neon Console | Lưu sản phẩm, đơn hàng, khách hàng, cài đặt |
| `IMAGEKIT_PRIVATE_KEY`   | ImageKit Dashboard | Máy chủ đưa ảnh lên ImageKit |

Làm lần lượt 5 bước dưới đây, mất khoảng 10–15 phút.

---

## Bước 1 — Tạo database trên Neon và lấy `DATABASE_URL`

1. Vào **https://console.neon.tech** → đăng nhập (Google/GitHub đều được).
2. Bấm **New Project**:
   - **Project name**: `vivi-nailshop` (tuỳ ý)
   - **Postgres version**: để mặc định
   - **Region**: chọn **AWS Asia Pacific (Singapore)**, gần Việt Nam nhất nên web chạy nhanh hơn
   - Bấm **Create project**
3. Trên trang tổng quan của project, bấm nút **Connect** (góc trên bên phải).
4. Trong hộp thoại *Connect to your database*:
   - **Branch**: `main` · **Database**: `neondb` · **Role**: `neondb_owner` (để mặc định)
   - Bật **Connection pooling** (chuỗi kết nối sẽ có chữ `-pooler`)
   - Bấm **Show password** rồi bấm biểu tượng **copy** cạnh chuỗi kết nối
5. Chuỗi copy được có dạng:

   ```
   postgresql://neondb_owner:AbC123xyz@ep-cool-name-a1b2c3-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
   ```

   Đây chính là `DATABASE_URL`. **Không chia sẻ chuỗi này cho ai**, vì nó chứa mật khẩu database.

> Nếu lỡ để lộ mật khẩu: Neon Console → **Roles** → chọn `neondb_owner` → **Reset password**, rồi lấy lại chuỗi kết nối mới.

---

## Bước 2 — Tạo tài khoản ImageKit và lấy `IMAGEKIT_PRIVATE_KEY`

1. Vào **https://imagekit.io** → **Sign up** (gói Free là đủ cho shop nhỏ).
   - Lúc đăng ký sẽ được hỏi **ImageKit ID**, ví dụ `vivinailshop`. Ảnh sẽ có link dạng `https://ik.imagekit.io/vivinailshop/...`
   - Chọn vùng lưu trữ gần nhất (Singapore / Asia nếu có)
2. Sau khi vào Dashboard, mở menu trái **Developer options**
   (hoặc vào thẳng link **https://imagekit.io/dashboard/developer/api-keys**).
3. Ở mục **API keys** sẽ thấy 3 thông tin:

   | Thông tin      | Ví dụ                                  | Có cần không? |
   | -------------- | -------------------------------------- | ------------- |
   | URL-endpoint   | `https://ik.imagekit.io/vivinailshop`  | Không cần điền, chỉ để biết ảnh nằm ở đâu |
   | Public key     | `public_xxxxxxxx...`                   | Không cần |
   | **Private key**| `private_xxxxxxxx...`                  | **Cần**: bấm nút hiện/copy |

4. Copy **Private key**. Đây là `IMAGEKIT_PRIVATE_KEY`.
   ⚠️ Ai có Private key thì xoá/sửa được toàn bộ ảnh của bạn. Chỉ để trong `.env.local` / biến môi trường trên hosting, **không** dán vào code, không gửi qua chat.

> Ảnh do web tải lên sẽ nằm trong thư mục **`/vivi-nailshop`** (chia nhỏ `products`, `branding`, `gifts`).
> Muốn đổi tên thư mục: thêm `IMAGEKIT_FOLDER=/ten-thu-muc` vào `.env.local`.

---

## Bước 3 — Tạo file `.env.local`

Trong thư mục dự án, sao chép `.env.example` thành `.env.local` rồi điền:

```env
OWNER_PIN=mã-pin-chủ-shop-mới
STAFF_PIN=mã-pin-nhân-viên-mới

DATABASE_URL=postgresql://neondb_owner:...@ep-...-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
IMAGEKIT_PRIVATE_KEY=private_...
```

File `.env.local` đã nằm trong `.gitignore` nên sẽ **không** bị đẩy lên GitHub.

---

## Bước 4 — Tạo bảng trong database và chạy thử

```bash
npm install
npm run db:setup     # tạo 4 bảng: shop_meta, products, orders, customers
npm run dev          # mở http://localhost:3000
```

Thấy dòng `✅ Đã tạo/kiểm tra xong các bảng: customers, orders, products, shop_meta` là thành công.

> Cách khác nếu không chạy được lệnh: Neon Console → **SQL Editor** → dán toàn bộ nội dung file `db/schema.sql` → **Run**.

Lần đầu mở web, cửa hàng tự có 5 sản phẩm mẫu. Kiểm tra:

- **Neon Console → Tables**: thấy dữ liệu trong bảng `products`.
- Vào **Quản lý** → thêm 1 sản phẩm có ảnh → **ImageKit → Media Library → vivi-nailshop/products**: thấy ảnh vừa tải.
- Đặt thử 1 đơn → bảng `orders` và `customers` trên Neon có dòng mới.

---

## Bước 5 — Chuyển dữ liệu cũ sang (nếu có)

Dữ liệu cũ nằm ở file **`data/shop.json`** (bản Next.js chạy trước đây) hoặc file **`ViViNailShop_Backup_*.json`** (tải từ bản HTML cũ).

**Cách nhanh nhất: 1 lệnh**

```bash
npm run db:push-local                          # đẩy data/shop.json
npm run db:push-local -- ViViNailShop_Backup_2026-11-25.json   # hoặc file backup khác
```

Lệnh này thay danh mục, cài đặt, sản phẩm bằng dữ liệu trong file; đơn hàng và khách hàng chỉ **thêm** những cái chưa có, không xoá đơn thật. Mọi ảnh (base64 hoặc link ngoài như Unsplash) được chép sang ImageKit.

**Hoặc làm trên giao diện:**

1. Chạy web **trên máy của bạn** (`npm run dev`, đã điền `.env.local` như Bước 3).
2. Mở web → **Quản lý** → đăng nhập bằng **PIN Chủ shop**.
3. Tab sản phẩm → **⬆️ Khôi phục** → chọn file JSON ở trên → xác nhận.

Máy chủ sẽ tự **đưa mọi ảnh base64 trong file lên ImageKit** rồi ghi dữ liệu vào Neon. File nhiều ảnh có thể mất 1–2 phút, cứ để yên cho chạy xong.

> Vì sao nên khôi phục trên máy mình: hosting như Vercel giới hạn mỗi lần gửi tối đa ~4.5MB, file backup có ảnh base64 thường lớn hơn.

Nếu sau này vẫn còn ảnh cũ dạng base64 (VD: khôi phục lúc chưa điền ImageKit), bấm nút **☁️ Đưa ảnh lên ImageKit** trong tab sản phẩm. Bấm lại nhiều lần cũng không sao.

---

## Đưa web lên mạng (Vercel)

Giờ dữ liệu nằm trên Neon và ảnh nằm trên ImageKit, nên **dùng được Vercel** (miễn phí):

1. Đẩy code lên GitHub → vào **https://vercel.com** → **Add New → Project** → chọn repo.
2. Trước khi bấm Deploy, mở **Environment Variables** và thêm 4 biến:
   `DATABASE_URL`, `IMAGEKIT_PRIVATE_KEY`, `OWNER_PIN`, `STAFF_PIN` (giá trị như trong `.env.local`).
3. Bấm **Deploy**.
4. Sau khi deploy: **Settings → Functions → Function Region** → chọn **Singapore (sin1)**, đặt máy chủ web gần database Neon cho nhanh. Sau đó **Redeploy**.

Chạy trên VPS cũng được: `npm run build && npm start`, đặt các biến môi trường như trên.

---

## Lưu ý khi vận hành

- **Neon tự "ngủ"** khi không có ai truy cập vài phút. Lượt truy cập đầu tiên sau đó chậm hơn khoảng 1 giây rồi chạy bình thường.
- **Gói miễn phí có giới hạn** (giờ chạy database, dung lượng ảnh, băng thông). Web tự đồng bộ khi đang mở (trang khách ~10 giây/lần, trang quản lý ~4 giây/lần), nên nếu để một máy mở trang **24/7** thì database không bao giờ ngủ và tốn giờ chạy hơn. Xem mức dùng tại Neon Console → **Usage** và ImageKit → **Usage**.
- **Xoá sản phẩm không xoá ảnh trên ImageKit.** Thỉnh thoảng có thể dọn bớt trong Media Library nếu cần chỗ.
- **Sao lưu**: vẫn nên định kỳ bấm **⬇️ Sao lưu JSON** trong trang quản lý. Neon còn cho khôi phục database về thời điểm trước (mục **Branches / Restore** trong Console).
- **Xem/sửa dữ liệu trực tiếp**: Neon Console → **Tables**. Hạn chế sửa tay cột `items`, `images`, `variants` (dạng JSON) để tránh lỗi định dạng.

## Lỗi thường gặp

| Hiện tượng | Cách xử lý |
| ---------- | ---------- |
| `Thiếu biến môi trường DATABASE_URL` | Chưa có `.env.local`, hoặc đặt sai tên biến. Sửa xong thì tắt `npm run dev` và chạy lại. |
| Web báo *"Máy chủ chưa khởi tạo database"* | Chưa tạo bảng → chạy `npm run db:setup` (Bước 4). |
| `password authentication failed` | Copy thiếu mật khẩu trong chuỗi kết nối → lấy lại ở Neon → **Connect** → **Show password**. |
| *"Không tải được ảnh lên ImageKit (sai IMAGEKIT_PRIVATE_KEY?)"* | Copy nhầm Public key, hoặc key bị thiếu ký tự. Copy lại **Private key**. |
| Ảnh mới vẫn lưu base64, terminal báo `Chưa đặt IMAGEKIT_PRIVATE_KEY` | Thêm key vào `.env.local` (hoặc Environment Variables trên Vercel rồi Redeploy), sau đó bấm **☁️ Đưa ảnh lên ImageKit**. |
