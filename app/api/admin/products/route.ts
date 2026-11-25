import { DEFAULT_PRODUCT_IMG, ORDER_CATEGORY } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';
import { normalizeProduct, normalizeVariant } from '@/lib/shop';
import type { Product } from '@/lib/types';

/** Thêm mới (không có id) hoặc cập nhật 1 sản phẩm từ form quản trị. */
export async function POST(request: Request) {
  try {
    const role = requireRole(request);
    const body = await readJsonBody<{ product?: Partial<Product> }>(request);
    const input = normalizeProduct(body.product, '');
    if (!input.name || input.price <= 0) {
      throw new HttpError(400, '⚠️ Vui lòng nhập Tên sản phẩm và Giá bán lẻ hợp lệ!');
    }
    const isOrder = input.isOrder || input.category === ORDER_CATEGORY;
    const category = isOrder ? ORDER_CATEGORY : input.category;
    const images = input.images.length ? input.images : [DEFAULT_PRODUCT_IMG];
    const editId = String(body.product?.id || '').trim();

    const { state } = await updateState((draft) => {
      const now = Date.now();
      const fields = {
        name: input.name,
        category,
        price: input.price,
        oldPrice: input.oldPrice,
        comboPrice5: input.comboPrice5,
        comboPrice10: input.comboPrice10,
        inStock: input.inStock,
        isOrder,
        description: input.description,
        images,
        variants: input.variants,
        updatedAt: now,
      };
      const idx = editId ? draft.products.findIndex((p) => p.id === editId) : -1;
      if (idx >= 0) {
        const saved: Product = { ...draft.products[idx], ...fields, id: editId };
        draft.products[idx] = saved;
        return saved;
      }
      let id = editId || 'P' + String(now).slice(-6);
      for (let n = 1; draft.products.some((p) => p.id === id); n++) id = 'P' + String(now + n).slice(-6);
      const saved: Product = { ...fields, id, sold: 0 };
      draft.products.unshift(saved);
      return saved;
    });

    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}

/** Cập nhật nhanh nhiều sản phẩm: còn/hết hàng, số đã bán, ảnh (sau khi nén). */
export async function PATCH(request: Request) {
  try {
    const role = requireRole(request);
    const body = await readJsonBody<{ updates?: Array<Partial<Product> & { id: string }> }>(request);
    const updates = Array.isArray(body.updates) ? body.updates : [];
    if (!updates.length) throw new HttpError(400, 'Không có thay đổi nào.');

    const { state } = await updateState((draft) => {
      const now = Date.now();
      for (const u of updates) {
        const p = draft.products.find((x) => x.id === u.id);
        if (!p) continue;
        if (typeof u.inStock === 'boolean') p.inStock = u.inStock;
        if (u.sold !== undefined) p.sold = Math.max(0, Math.floor(Number(u.sold) || 0));
        if (Array.isArray(u.images)) p.images = u.images.map(String).filter(Boolean);
        if (Array.isArray(u.variants)) p.variants = u.variants.map(normalizeVariant).filter((v) => v.name);
        p.updatedAt = now;
      }
    });
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
