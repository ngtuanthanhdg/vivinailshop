# ViVi NailShop (Next.js)

Bản dựng lại bằng **Next.js 16 + React 19 + Tailwind CSS 4** của file HTML `văn bản.txt`.
Giao diện, tính năng và luồng mua hàng giữ nguyên như bản cũ. Điểm khác lớn nhất: dữ liệu giờ nằm **trên máy chủ của chính bạn**,
thay vì phải đồng bộ qua các dịch vụ miễn phí bên ngoài (jsonblob, kvdb, ntfy…).

## Chạy thử trên máy

```bash
npm install
npm run dev          # mở http://localhost:3000
```

Chạy bản production:

```bash
npm run build
npm start            # mặc định cổng 3000, đổi bằng: npm start -- -p 8080
```

## Cấu hình (file `.env.local`)

Sao chép `.env.example` thành `.env.local` rồi sửa:

| Biến        | Mặc định        | Ý nghĩa                                   |
| ----------- | --------------- | ----------------------------------------- |
| `OWNER_PIN` | `8888`          | Mã PIN Chủ shop (toàn quyền)              |
| `STAFF_PIN` | `1234`          | Mã PIN Nhân viên (sản phẩm, đơn, quà)     |
| `DATA_DIR`  | `./data`        | Thư mục lưu dữ liệu cửa hàng              |

> **Nên đổi 2 mã PIN** trước khi đưa web lên mạng — mã mặc định ai cũng đoán được.

## Dữ liệu được lưu ở đâu?

Toàn bộ sản phẩm, đơn hàng, khách hàng, cài đặt nằm trong **một file `data/shop.json`** (tự tạo ở lần chạy đầu với 5 sản phẩm mẫu).

- Mọi điện thoại/máy tính mở web đều thấy cùng dữ liệu; trang tự cập nhật mỗi ~4 giây.
- Sao lưu: vào **Quản lý → Tab 1 → ⬇️ Sao lưu JSON**, hoặc chép file `data/shop.json`.
- **Chuyển dữ liệu từ bản HTML cũ:** trên trang cũ bấm *⬇️ Sao lưu JSON* → trên trang mới đăng nhập Chủ shop → *⬆️ Khôi phục* và chọn file vừa tải.

## Đưa lên mạng (deploy)

Vì dữ liệu lưu thành file, cần chỗ chạy có **ổ đĩa lưu lâu dài**:

- VPS (Ubuntu…) chạy `npm run build && npm start` (dùng pm2 để chạy nền), hoặc
- Railway / Render / Fly.io có gắn *volume*, đặt `DATA_DIR` trỏ vào volume đó.

⚠️ **Không** dùng được với Vercel/Netlify dạng serverless: ổ đĩa ở đó bị xoá sau mỗi lần chạy nên đơn hàng sẽ mất.

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
  server/store.ts          Đọc/ghi data/shop.json an toàn khi nhiều người đặt cùng lúc
```
