/**
 * Đẩy dữ liệu cửa hàng từ file JSON (mặc định data/shop.json của bản cũ, hoặc file "Sao lưu JSON") lên Neon.
 *
 *   npm run db:push-local                      # dùng data/shop.json
 *   npm run db:push-local -- duong/dan/file.json
 *
 * - Danh mục, cài đặt, sản phẩm: THAY bằng dữ liệu trong file.
 * - Đơn hàng, khách hàng: chỉ THÊM những cái chưa có trong database (không xoá đơn thật đã phát sinh).
 * - Ảnh base64 và ảnh link ngoài (Unsplash…) được chép sang ImageKit, database chỉ lưu link ImageKit.
 */
import './load-env.mjs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { DEFAULT_SETTINGS } from '@/lib/constants';
import { cleanPhone } from '@/lib/format';
import { createImageUploader, externalizeProductImages, externalizeSettingsImages, imagekitEnabled } from '@/lib/server/imagekit';
import { insertCustomers, insertOrders, insertProducts, mutate, saveSettings } from '@/lib/server/store';
import { normalizeProduct, normalizeSettings } from '@/lib/shop';
import type { Customer, Order, Product } from '@/lib/types';

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('Chưa có DATABASE_URL trong .env / .env.local');
  const file = path.resolve(process.argv[2] || 'data/shop.json');
  const raw = JSON.parse(await readFile(file, 'utf8')) as Record<string, unknown>;
  console.log(`📄 Đọc ${path.relative(process.cwd(), file)}`);

  const upload = createImageUploader(4, { rehostRemote: true });
  if (!imagekitEnabled()) console.warn('⚠️ Chưa có IMAGEKIT_PRIVATE_KEY → ảnh giữ nguyên link cũ.');

  const categories = Array.isArray(raw.categories) ? raw.categories.map(String).filter(Boolean) : null;

  let products: Product[] | null = null;
  if (Array.isArray(raw.products)) {
    const seen = new Set<string>();
    const normalized = raw.products
      .map((p, i) => normalizeProduct(p, `P${String(i + 1).padStart(3, '0')}`))
      .filter((p) => p.name && !seen.has(p.id) && seen.add(p.id));
    console.log(`☁️  Đưa ảnh của ${normalized.length} sản phẩm lên ImageKit...`);
    products = await Promise.all(normalized.map((p) => externalizeProductImages(p, upload)));
  }

  const settings =
    raw.settings && typeof raw.settings === 'object'
      ? await externalizeSettingsImages(normalizeSettings(raw.settings, DEFAULT_SETTINGS), upload)
      : null;

  const orders = Array.isArray(raw.orders)
    ? (raw.orders as Order[]).filter((o) => o && o.id).map((o) => ({ ...o, id: String(o.id), items: Array.isArray(o.items) ? o.items : [] }))
    : [];
  const customers =
    raw.customers && typeof raw.customers === 'object'
      ? Object.entries(raw.customers as Record<string, Customer>).map(([key, c]) => ({ ...c, phone: cleanPhone(c.phone || key) })).filter((c) => c.phone)
      : [];

  const summary = await mutate(async ({ exec }) => {
    if (categories?.length) await exec('UPDATE shop_meta SET categories = $1::jsonb WHERE id = 1', [JSON.stringify(categories)]);
    if (settings) await saveSettings(exec, settings);
    if (products) {
      await exec('DELETE FROM products');
      await insertProducts(exec, products);
    }
    const existingOrders = new Set((await exec('SELECT id FROM orders')).map((r) => String(r.id)));
    const newOrders = orders.filter((o) => !existingOrders.has(o.id));
    await insertOrders(exec, newOrders);
    const existingCustomers = new Set((await exec('SELECT phone FROM customers')).map((r) => String(r.phone)));
    const newCustomers = [...new Map(customers.map((c) => [c.phone, c])).values()].filter((c) => !existingCustomers.has(c.phone));
    await insertCustomers(exec, newCustomers);
    return { newOrders: newOrders.length, newCustomers: newCustomers.length };
  });

  console.log('✅ Xong! Đã lưu lên Neon:');
  console.log(`   • Danh mục: ${categories?.length ?? 'giữ nguyên'}`);
  console.log(`   • Sản phẩm: ${products?.length ?? 'giữ nguyên'}`);
  console.log(`   • Cài đặt cửa hàng & quà tặng: ${settings ? `có (${settings.loyaltyGifts.length} quà)` : 'giữ nguyên'}`);
  console.log(`   • Đơn hàng mới thêm: ${summary.newOrders} / ${orders.length}`);
  console.log(`   • Khách hàng mới thêm: ${summary.newCustomers} / ${customers.length}`);
}

main().catch((err) => {
  console.error('❌ Lỗi:', err instanceof Error ? err.message : err);
  process.exit(1);
});
