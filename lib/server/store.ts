import { createDefaultProducts, DEFAULT_SETTINGS } from '@/lib/constants';
import { cleanPhone } from '@/lib/format';
import { createInitialCategories, normalizeSettings, toPublicState } from '@/lib/shop';
import type { CartItem, Customer, Order, Product, PublicShopState, Settings, ShopState, Variant } from '@/lib/types';
import { readBatch, sql, withTransaction, type Exec, type Row } from './db';

/**
 * Kho dữ liệu cửa hàng trên Neon (PostgreSQL). Cấu trúc bảng: db/schema.sql
 *
 * - shop_meta  : 1 dòng gồm cài đặt, danh mục và `updated_at` (phiên bản dữ liệu để các thiết bị tự đồng bộ)
 * - products   : sản phẩm
 * - orders     : đơn hàng
 * - customers  : khách hàng tích điểm (khoá = số điện thoại chỉ gồm chữ số)
 *
 * Mọi thao tác ghi đi qua `mutate()`: khoá dòng shop_meta trong transaction nên các lượt ghi chạy lần lượt
 * (2 khách đặt cùng lúc không ghi đè nhau), xong thì tăng `updated_at`.
 */

// ======================== CHUYỂN ĐỔI DÒNG DB ⇄ ĐỐI TƯỢNG ========================
const num = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const money = (v: unknown): number => Math.max(0, Math.round(num(v)));
const str = (v: unknown): string => (v == null ? '' : String(v));
const arr = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

export function rowToProduct(r: Row): Product {
  return {
    id: str(r.id),
    name: str(r.name),
    category: str(r.category),
    price: num(r.price),
    oldPrice: num(r.old_price),
    comboPrice5: num(r.combo_price5),
    comboPrice10: num(r.combo_price10),
    inStock: r.in_stock !== false,
    isOrder: Boolean(r.is_order),
    sold: num(r.sold),
    description: str(r.description),
    images: arr<string>(r.images),
    variants: arr<Variant>(r.variants),
    updatedAt: num(r.updated_at),
  };
}

export function rowToOrder(r: Row): Order {
  return {
    id: str(r.id),
    customerName: str(r.customer_name),
    phone: str(r.phone),
    address: str(r.address),
    shippingMethod: str(r.shipping_method),
    paymentMethod: str(r.payment_method),
    note: str(r.note),
    items: arr<CartItem>(r.items),
    subtotal: num(r.subtotal),
    shipFee: num(r.ship_fee),
    discount: num(r.discount),
    total: num(r.total),
    earnedPoints: num(r.earned_points),
    status: str(r.status),
    createdAt: str(r.created_at),
    createdAtMs: num(r.created_at_ms),
  };
}

export function rowToCustomer(r: Row): Customer {
  const c: Customer = {
    phone: str(r.phone),
    name: str(r.name),
    points: num(r.points),
    totalSpent: num(r.total_spent),
    orderCount: num(r.order_count),
  };
  if (r.last_address != null) c.lastAddress = str(r.last_address);
  return c;
}

interface Meta {
  categories: string[];
  settings: Settings;
  updatedAt: number;
}

function rowToMeta(r: Row): Meta {
  const categories = arr<unknown>(r.categories).map(String).filter(Boolean);
  return {
    categories: categories.length ? categories : createInitialCategories(),
    settings: normalizeSettings(r.settings),
    updatedAt: num(r.updated_at),
  };
}

// ======================== GHI HÀNG LOẠT (dùng cho dữ liệu mẫu & khôi phục) ========================
export async function insertProducts(exec: Exec, products: Product[], sortStart = 0): Promise<void> {
  if (!products.length) return;
  const now = Date.now();
  const rows = products.map((p, i) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    price: money(p.price),
    old_price: money(p.oldPrice),
    combo_price5: money(p.comboPrice5),
    combo_price10: money(p.comboPrice10),
    in_stock: p.inStock !== false,
    is_order: Boolean(p.isOrder),
    sold: Math.max(0, Math.floor(num(p.sold))),
    description: p.description || '',
    images: p.images || [],
    variants: p.variants || [],
    sort_order: sortStart + i,
    updated_at: Math.round(num(p.updatedAt)) || now,
  }));
  await exec(
    `INSERT INTO products (id, name, category, price, old_price, combo_price5, combo_price10, in_stock, is_order,
                           sold, description, images, variants, sort_order, updated_at)
     SELECT id, name, category, price, old_price, combo_price5, combo_price10, in_stock, is_order,
            sold, description, images, variants, sort_order, updated_at
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, name text, category text, price bigint, old_price bigint, combo_price5 bigint, combo_price10 bigint,
       in_stock boolean, is_order boolean, sold integer, description text, images jsonb, variants jsonb,
       sort_order bigint, updated_at bigint)`,
    [JSON.stringify(rows)],
  );
}

export async function insertOrders(exec: Exec, orders: Order[]): Promise<void> {
  if (!orders.length) return;
  const rows = orders.map((o) => ({
    id: o.id,
    customer_name: str(o.customerName),
    phone: str(o.phone),
    phone_digits: cleanPhone(o.phone),
    address: str(o.address),
    shipping_method: str(o.shippingMethod),
    payment_method: str(o.paymentMethod),
    note: str(o.note),
    items: arr(o.items),
    subtotal: Math.round(num(o.subtotal)),
    ship_fee: Math.round(num(o.shipFee)),
    discount: Math.round(num(o.discount)),
    total: Math.round(num(o.total)),
    earned_points: Math.round(num(o.earnedPoints)),
    status: str(o.status) || 'Chờ xác nhận',
    created_at: str(o.createdAt),
    created_at_ms: Math.round(num(o.createdAtMs)),
  }));
  await exec(
    `INSERT INTO orders (id, customer_name, phone, phone_digits, address, shipping_method, payment_method, note, items,
                         subtotal, ship_fee, discount, total, earned_points, status, created_at, created_at_ms)
     SELECT id, customer_name, phone, phone_digits, address, shipping_method, payment_method, note, items,
            subtotal, ship_fee, discount, total, earned_points, status, created_at, created_at_ms
     FROM jsonb_to_recordset($1::jsonb) AS x(
       id text, customer_name text, phone text, phone_digits text, address text, shipping_method text,
       payment_method text, note text, items jsonb, subtotal bigint, ship_fee bigint, discount bigint, total bigint,
       earned_points integer, status text, created_at text, created_at_ms bigint)`,
    [JSON.stringify(rows)],
  );
}

export async function insertCustomers(exec: Exec, customers: Customer[]): Promise<void> {
  if (!customers.length) return;
  const rows = customers.map((c) => ({
    phone: c.phone,
    name: str(c.name),
    points: Math.max(0, Math.floor(num(c.points))),
    total_spent: Math.round(num(c.totalSpent)),
    order_count: Math.max(0, Math.floor(num(c.orderCount))),
    last_address: c.lastAddress ?? null,
  }));
  await exec(
    `INSERT INTO customers (phone, name, points, total_spent, order_count, last_address)
     SELECT phone, name, points, total_spent, order_count, last_address
     FROM jsonb_to_recordset($1::jsonb) AS x(
       phone text, name text, points integer, total_spent bigint, order_count integer, last_address text)`,
    [JSON.stringify(rows)],
  );
}

/** Lần chạy đầu tiên (bảng shop_meta trống): thêm cài đặt mặc định + 5 sản phẩm mẫu. */
async function ensureSeeded(exec: Exec): Promise<void> {
  const now = Date.now();
  const inserted = await exec(
    `INSERT INTO shop_meta (id, categories, settings, updated_at) VALUES (1, $1::jsonb, $2::jsonb, $3)
     ON CONFLICT (id) DO NOTHING RETURNING id`,
    [JSON.stringify(createInitialCategories()), JSON.stringify(DEFAULT_SETTINGS), now],
  );
  if (!inserted.length) return;
  const hasProducts = await exec('SELECT 1 FROM products LIMIT 1');
  if (!hasProducts.length) await insertProducts(exec, createDefaultProducts(now));
}

// ======================== ĐỌC ========================
const META_SQL = 'SELECT categories, settings, updated_at FROM shop_meta WHERE id = 1';
const PRODUCTS_SQL = 'SELECT * FROM products ORDER BY sort_order, id';
const ORDERS_SQL = 'SELECT * FROM orders ORDER BY created_at_ms DESC, id DESC';
const CUSTOMERS_SQL = 'SELECT * FROM customers ORDER BY phone';

/** Đọc; nếu database còn trống thì tạo dữ liệu mẫu rồi đọc lại. */
async function readSeeded<T>(read: () => Promise<T | null>): Promise<T> {
  const first = await read();
  if (first !== null) return first;
  await withTransaction(ensureSeeded);
  const second = await read();
  if (second === null) throw new Error('Không khởi tạo được dữ liệu cửa hàng trong database.');
  return second;
}

/** Toàn bộ dữ liệu (cho trang quản trị). */
export function readState(): Promise<ShopState> {
  return readSeeded(async () => {
    const [meta, products, orders, customers] = await readBatch([[META_SQL], [PRODUCTS_SQL], [ORDERS_SQL], [CUSTOMERS_SQL]]);
    if (!meta[0]) return null;
    const customerMap: Record<string, Customer> = {};
    for (const r of customers) {
      const c = rowToCustomer(r);
      customerMap[c.phone] = c;
    }
    return {
      ...rowToMeta(meta[0]),
      products: products.map(rowToProduct),
      orders: orders.map(rowToOrder),
      customers: customerMap,
    };
  });
}

/** Dữ liệu công khai cho khách (không có đơn hàng, khách hàng, token bot). */
export function readPublicState(): Promise<PublicShopState> {
  return readSeeded(async () => {
    const [meta, products] = await readBatch([[META_SQL], [PRODUCTS_SQL]]);
    if (!meta[0]) return null;
    return toPublicState({ ...rowToMeta(meta[0]), products: products.map(rowToProduct), orders: [], customers: {} });
  });
}

/** Chỉ đọc "phiên bản" dữ liệu — câu truy vấn rất nhẹ cho vòng tự đồng bộ mỗi vài giây. */
export async function readVersion(): Promise<number | null> {
  const rows = (await sql().query('SELECT updated_at FROM shop_meta WHERE id = 1')) as Row[];
  return rows[0] ? num(rows[0].updated_at) : null;
}

/** Tra cứu khách theo SĐT (chỉ chữ số): điểm tích lũy + lịch sử đơn mới nhất trước. */
export async function readCustomerHistory(phoneDigits: string): Promise<{ customer: Customer | null; orders: Order[] }> {
  const [customers, orders] = await readBatch([
    ['SELECT * FROM customers WHERE phone = $1', [phoneDigits]],
    ['SELECT * FROM orders WHERE phone_digits = $1 ORDER BY created_at_ms DESC, id DESC', [phoneDigits]],
  ]);
  return { customer: customers[0] ? rowToCustomer(customers[0]) : null, orders: orders.map(rowToOrder) };
}

// ======================== GHI ========================
export interface WriteContext {
  exec: Exec;
  /** Cài đặt & danh mục hiện tại (đã khoá, không ai sửa được cho tới khi transaction xong). */
  meta: Meta;
  now: number;
}

/**
 * Chạy 1 lượt ghi trong transaction. Ném lỗi trong `fn` (VD: HttpError) để huỷ toàn bộ thay đổi.
 */
export function mutate<T>(fn: (ctx: WriteContext) => Promise<T>): Promise<T> {
  return withTransaction(async (exec) => {
    let rows = await exec(`${META_SQL} FOR UPDATE`);
    if (!rows[0]) {
      await ensureSeeded(exec);
      rows = await exec(`${META_SQL} FOR UPDATE`);
    }
    const now = Date.now();
    const result = await fn({ exec, meta: rowToMeta(rows[0]), now });
    await exec('UPDATE shop_meta SET updated_at = GREATEST($1::bigint, updated_at + 1) WHERE id = 1', [now]);
    return result;
  });
}

export async function saveSettings(exec: Exec, settings: Settings): Promise<void> {
  await exec('UPDATE shop_meta SET settings = $1::jsonb WHERE id = 1', [JSON.stringify(settings)]);
}

/** Cộng/trừ "Đã bán" cho nhiều sản phẩm cùng lúc (không để âm). */
export async function addSold(exec: Exec, deltas: Record<string, number>, now: number): Promise<void> {
  const rows = Object.entries(deltas)
    .filter(([id, qty]) => id && qty)
    .map(([id, qty]) => ({ id, qty: Math.round(qty) }));
  if (!rows.length) return;
  await exec(
    `UPDATE products p SET sold = GREATEST(0, p.sold + x.qty), updated_at = $2
     FROM jsonb_to_recordset($1::jsonb) AS x(id text, qty integer)
     WHERE p.id = x.id`,
    [JSON.stringify(rows), now],
  );
}
