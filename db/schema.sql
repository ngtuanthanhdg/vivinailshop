-- =====================================================================
-- Cấu trúc database của ViVi NailShop (Neon / PostgreSQL)
--
-- Cách chạy (chọn 1):
--   1) npm run db:setup          (đọc DATABASE_URL trong .env.local)
--   2) Dán toàn bộ file này vào Neon Console → SQL Editor → Run
--
-- Chạy lại nhiều lần không sao: mọi lệnh đều là "IF NOT EXISTS".
-- Dữ liệu mẫu (5 sản phẩm, cài đặt mặc định) được web tự thêm ở lần chạy đầu.
-- =====================================================================

-- Một dòng duy nhất: cài đặt cửa hàng, danh mục, và "phiên bản" dữ liệu
-- (updated_at tăng sau mỗi lần ghi để các thiết bị biết khi nào cần tải lại).
CREATE TABLE IF NOT EXISTS shop_meta (
  id          smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  categories  jsonb    NOT NULL DEFAULT '[]'::jsonb,
  settings    jsonb    NOT NULL DEFAULT '{}'::jsonb,
  updated_at  bigint   NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id             text    PRIMARY KEY,
  name           text    NOT NULL,
  category       text    NOT NULL,
  price          bigint  NOT NULL CHECK (price >= 0),
  old_price      bigint  NOT NULL DEFAULT 0 CHECK (old_price >= 0),
  combo_price5   bigint  NOT NULL DEFAULT 0 CHECK (combo_price5 >= 0),
  combo_price10  bigint  NOT NULL DEFAULT 0 CHECK (combo_price10 >= 0),
  in_stock       boolean NOT NULL DEFAULT true,
  is_order       boolean NOT NULL DEFAULT false,
  sold           integer NOT NULL DEFAULT 0 CHECK (sold >= 0),
  description    text    NOT NULL DEFAULT '',
  images         jsonb   NOT NULL DEFAULT '[]'::jsonb,   -- ["https://ik.imagekit.io/..."]
  variants       jsonb   NOT NULL DEFAULT '[]'::jsonb,   -- [{ name, price, image }]
  sort_order     bigint  NOT NULL DEFAULT 0,             -- nhỏ hơn = hiện trước
  updated_at     bigint  NOT NULL                        -- mili-giây
);
CREATE INDEX IF NOT EXISTS products_sort_idx ON products (sort_order, id);

CREATE TABLE IF NOT EXISTS orders (
  id               text    PRIMARY KEY,                 -- VD: DH123456
  customer_name    text    NOT NULL,
  phone            text    NOT NULL,                    -- như khách nhập
  phone_digits     text    NOT NULL,                    -- chỉ chữ số, dùng để tra cứu
  address          text    NOT NULL DEFAULT '',
  shipping_method  text    NOT NULL DEFAULT '',
  payment_method   text    NOT NULL DEFAULT '',
  note             text    NOT NULL DEFAULT '',
  items            jsonb   NOT NULL DEFAULT '[]'::jsonb, -- [{ productId, name, variantIdx, variantName, qty, image, unitPrice }]
  subtotal         bigint  NOT NULL DEFAULT 0,
  ship_fee         bigint  NOT NULL DEFAULT 0,
  discount         bigint  NOT NULL DEFAULT 0,
  total            bigint  NOT NULL DEFAULT 0,
  earned_points    integer NOT NULL DEFAULT 0,
  status           text    NOT NULL,
  created_at       text    NOT NULL DEFAULT '',         -- chuỗi hiển thị (giờ Việt Nam)
  created_at_ms    bigint  NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders (created_at_ms DESC);
CREATE INDEX IF NOT EXISTS orders_phone_idx   ON orders (phone_digits, created_at_ms DESC);

CREATE TABLE IF NOT EXISTS customers (
  phone         text    PRIMARY KEY,                    -- chỉ chữ số
  name          text    NOT NULL DEFAULT '',
  points        integer NOT NULL DEFAULT 0 CHECK (points >= 0),
  total_spent   bigint  NOT NULL DEFAULT 0,
  order_count   integer NOT NULL DEFAULT 0,
  last_address  text
);
