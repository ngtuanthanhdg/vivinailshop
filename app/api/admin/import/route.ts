import { DEFAULT_SETTINGS } from '@/lib/constants';
import { cleanPhone } from '@/lib/format';
import { adminResponse } from '@/lib/server/admin';
import { jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { createImageUploader, externalizeProductImages, externalizeSettingsImages } from '@/lib/server/imagekit';
import { insertCustomers, insertOrders, insertProducts, mutate, readState, saveSettings } from '@/lib/server/store';
import { normalizeProduct, normalizeSettings } from '@/lib/shop';
import type { Customer, Order, Product } from '@/lib/types';

function uniqueBy<T>(list: T[], key: (item: T) => string): T[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const k = key(item);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Khôi phục từ file sao lưu JSON (tương thích file "ViViNailShop_Backup_*.json" và data/shop.json của bản cũ).
 * Chỉ thay những phần có trong file; phần nào thiếu thì giữ nguyên.
 * Ảnh base64 trong file được tự động đưa lên ImageKit.
 */
export async function POST(request: Request) {
  try {
    const role = requireRole(request, 'owner');
    const body = await readJsonBody<Record<string, unknown>>(request);
    const upload = createImageUploader(4);

    const categories =
      Array.isArray(body.categories) && body.categories.length ? body.categories.map(String).filter(Boolean) : null;

    let products: Product[] | null = null;
    if (Array.isArray(body.products)) {
      const normalized = uniqueBy(
        body.products.map((p, i) => normalizeProduct(p, `P${String(i + 1).padStart(3, '0')}`)).filter((p) => p.name),
        (p) => p.id,
      );
      products = await Promise.all(normalized.map((p) => externalizeProductImages(p, upload)));
    }

    const orders = Array.isArray(body.orders)
      ? uniqueBy(
          (body.orders as Order[])
            .filter((o) => o && typeof o === 'object' && o.id)
            .map((o) => ({ ...o, id: String(o.id), items: Array.isArray(o.items) ? o.items : [] })),
          (o) => o.id,
        )
      : null;

    const customers =
      body.customers && typeof body.customers === 'object'
        ? uniqueBy(
            Object.entries(body.customers as Record<string, Customer>)
              .filter(([, c]) => c && typeof c === 'object')
              .map(([key, c]) => ({ ...c, phone: cleanPhone(c.phone || key) })),
            (c) => c.phone,
          )
        : null;

    const settings =
      body.settings && typeof body.settings === 'object'
        ? await externalizeSettingsImages(normalizeSettings(body.settings, DEFAULT_SETTINGS), upload)
        : null;

    await mutate(async ({ exec }) => {
      if (categories) await exec('UPDATE shop_meta SET categories = $1::jsonb WHERE id = 1', [JSON.stringify(categories)]);
      if (settings) await saveSettings(exec, settings);
      if (products) {
        await exec('DELETE FROM products');
        await insertProducts(exec, products);
      }
      if (orders) {
        await exec('DELETE FROM orders');
        await insertOrders(exec, orders);
      }
      if (customers) {
        await exec('DELETE FROM customers');
        await insertCustomers(exec, customers);
      }
    });
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
