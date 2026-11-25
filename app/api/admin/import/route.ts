import { DEFAULT_SETTINGS } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';
import { normalizeProduct, normalizeSettings } from '@/lib/shop';
import type { Customer, Order } from '@/lib/types';

/**
 * Khôi phục từ file sao lưu JSON (tương thích file "ViViNailShop_Backup_*.json" của bản HTML cũ).
 * Chỉ thay những phần có trong file; phần nào thiếu thì giữ nguyên.
 */
export async function POST(request: Request) {
  try {
    const role = requireRole(request, 'owner');
    const body = await readJsonBody<Record<string, unknown>>(request);

    const { state } = await updateState((draft) => {
      if (Array.isArray(body.categories) && body.categories.length) {
        draft.categories = body.categories.map(String).filter(Boolean);
      }
      if (Array.isArray(body.products)) {
        draft.products = body.products.map((p, i) => normalizeProduct(p, `P${String(i + 1).padStart(3, '0')}`));
      }
      if (Array.isArray(body.orders)) {
        draft.orders = (body.orders as Order[])
          .filter((o) => o && typeof o === 'object' && o.id)
          .map((o) => ({ ...o, items: Array.isArray(o.items) ? o.items : [] }));
      }
      if (body.customers && typeof body.customers === 'object') {
        draft.customers = body.customers as Record<string, Customer>;
      }
      if (body.settings && typeof body.settings === 'object') {
        draft.settings = normalizeSettings(body.settings, DEFAULT_SETTINGS);
      }
    });
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
