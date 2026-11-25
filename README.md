# ViVi NailShop (Next.js)

Bản dựng lại bằng **Next.js 16 + React 19 + Tailwind CSS 4** của file HTML `văn bản.txt`.
Giao diện, tính năng và luồng mua hàng giữ nguyên như bản cũ. Dữ liệu (sản phẩm, đơn hàng, khách hàng, cài đặt) lưu trên
**Neon (PostgreSQL)**, ảnh lưu trên **ImageKit**.

👉 **Lần đầu cài đặt: làm theo [HUONG_DAN_NEON_IMAGEKIT.md](HUONG_DAN_NEON_IMAGEKIT.md)** (lấy chuỗi kết nối Neon & khoá ImageKit).

## Chạy thử trên máy

```bash
npm install
cp .env.example .env.local   # rồi điền DATABASE_URL, IMAGEKIT_PRIVATE_KEY
npm run db:setup             # tạo bảng trong Neon (chỉ cần 1 lần)
npm run db:push-local        # (tuỳ chọn) đẩy dữ liệu cũ trong data/shop.json lên Neon + ảnh lên ImageKit
npm run dev                  # mở http://localhost:3000
```

Chạy bản production:

```bash
npm run build
npm start            # mặc định cổng 3000, đổi bằng: npm start -- -p 8080
```

## Cấu hình (file `.env.local`)

Sao chép `.env.example` thành `.env.local` rồi sửa:

| Biến                   | Bắt buộc | Ý nghĩa                                                 |
| ---------------------- | -------- | ------------------------------------------------------- |
| `DATABASE_URL`         | ✅       | Chuỗi kết nối Neon (bản có `-pooler`)                   |
| `IMAGEKIT_PRIVATE_KEY` | ✅       | Private key ImageKit, để máy chủ tải ảnh lên            |
| `IMAGEKIT_FOLDER`      |          | Thư mục ảnh trên ImageKit (mặc định `/vivi-nailshop`)   |
| `OWNER_PIN`            |          | Mã PIN Chủ shop (mặc định `8888`)                       |
| `STAFF_PIN`            |          | Mã PIN Nhân viên (mặc định `1234`)                      |

> **Nên đổi 2 mã PIN** trước khi đưa web lên mạng — mã mặc định ai cũng đoán được.

## Dữ liệu được lưu ở đâu?

- **Neon (PostgreSQL)**: 4 bảng `shop_meta` (cài đặt, danh mục), `products`, `orders`, `customers`. Cấu trúc ở `db/schema.sql`.
  Lần chạy đầu web tự thêm 5 sản phẩm mẫu.
- **ImageKit**: mọi ảnh sản phẩm, phân loại, logo, quà tặng. Trình duyệt nén ảnh → máy chủ tải lên ImageKit → database chỉ lưu link.
  Khi hiển thị, web xin ImageKit bản thu nhỏ đúng cỡ (`?tr=w-400`) nên trang tải nhanh.
- Mọi điện thoại/máy tính mở web đều thấy cùng dữ liệu; trang tự cập nhật (trang quản lý ~4 giây, khách xem shop ~10 giây).
- Đặt đơn, đổi quà, đổi trạng thái đơn chạy trong transaction nên nhiều người thao tác cùng lúc không ghi đè nhau.
- Sao lưu: **Quản lý → Tab 1 → ⬇️ Sao lưu JSON**. Khôi phục: **⬆️ Khôi phục** (nhận cả `data/shop.json` của bản trước và file backup bản HTML; ảnh base64 tự được đưa lên ImageKit).

## Đưa lên mạng (deploy)

Dùng được **Vercel** (hoặc bất kỳ hosting Node.js nào, kể cả VPS). Nhớ khai báo các biến môi trường ở trên.
Chi tiết từng bước: [HUONG_DAN_NEON_IMAGEKIT.md](HUONG_DAN_NEON_IMAGEKIT.md#đưa-web-lên-mạng-vercel).

## Khác với bản HTML cũ

- Mã PIN được kiểm tra trên máy chủ, không còn hiện sẵn trên màn hình đăng nhập.
- Token bot Telegram chỉ nằm trên máy chủ (khách xem web không lấy được); tin báo đơn do máy chủ gửi.
- Giá, phí ship, mã giảm giá, điểm thưởng do máy chủ tính lại khi đặt đơn → khách không sửa được số tiền.
- Khách chỉ tải được danh sách sản phẩm; tra cứu đơn/điểm cần nhập **đúng đủ 9–11 số** điện thoại.
- Giao Grab bắt buộc chọn quận và nhập địa chỉ; sản phẩm hết hàng không đặt được.
- Nhân viên không được *Khôi phục* dữ liệu, không sửa thông tin shop/giao diện (máy chủ chặn, không chỉ ẩn nút).
- Bỏ "mã đồng bộ"/"mã dữ liệu VNS1" vì không còn cần nữa.
- Xoá sản phẩm và khôi phục dữ liệu có hộp thoại xác nhận.

## Cấu trúc thư mục

```
app/
  page.tsx                 Trang cửa hàng (render sẵn trên máy chủ)
  api/shop                 Dữ liệu công khai
  api/orders               Đặt đơn
  api/customers/[phone]    Tra cứu đơn & điểm theo SĐT
  api/loyalty/redeem       Đổi quà
  api/admin/*              API quản trị (cần PIN)
components/
  ShopProvider.tsx         State dùng chung, giỏ hàng, đồng bộ máy chủ
  storefront/              Header, danh mục, lưới sản phẩm, icon rơi…
  modals/                  Chi tiết SP, giỏ hàng, hoá đơn, tra cứu, đổi quà
  admin/                   6 tab quản trị
lib/
  constants.ts             Dữ liệu mẫu, theme, hoạ tiết, toạ độ Hà Nội
  pricing.ts               Giá combo, cước Grab, mã giảm giá (dùng chung client & server)
  server/db.ts             Kết nối Neon (đọc qua HTTP, ghi bằng transaction)
  server/store.ts          Đọc/ghi các bảng sản phẩm, đơn hàng, khách hàng, cài đặt
  server/imagekit.ts       Tải ảnh lên ImageKit (Private key chỉ nằm trên máy chủ)
db/schema.sql              Cấu trúc bảng (chạy bằng npm run db:setup)
scripts/db-setup.mjs       Lệnh tạo bảng
```
