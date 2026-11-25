import { DEFAULT_PRODUCT_IMG, ORDER_CATEGORY } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { createImageUploader, externalizeProductImages } from '@/lib/server/imagekit';
import { insertProducts, mutate, readState } from '@/lib/server/store';
import { normalizeProduct, normalizeVariant } from '@/lib/shop';
import type { Product, Variant } from '@/lib/types';

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
    const editId = String(body.product?.id || '').trim();

    // Đưa ảnh mới (base64) lên ImageKit TRƯỚC khi mở transaction để không giữ khoá DB lâu.
    const withUrls = await externalizeProductImages(input, createImageUploader());
    const images = withUrls.images.length ? withUrls.images : [DEFAULT_PRODUCT_IMG];
    const variants = withUrls.variants;

    await mutate(async ({ exec, now }) => {
      const params = [
        input.name, category, Math.round(input.price), Math.round(input.oldPrice), Math.round(input.comboPrice5),
        Math.round(input.comboPrice10), input.inStock, isOrder, input.description, JSON.stringify(images),
        JSON.stringify(variants), now,
      ];
      if (editId) {
        const updated = await exec(
          `UPDATE products SET name = $2, category = $3, price = $4, old_price = $5, combo_price5 = $6, combo_price10 = $7,
                  in_stock = $8, is_order = $9, description = $10, images = $11::jsonb, variants = $12::jsonb, updated_at = $13
           WHERE id = $1 RETURNING id`,
          [editId, ...params],
        );
        if (updated.length) return;
      }
      let id = editId || 'P' + String(now).slice(-6);
      for (let n = 1; (await exec('SELECT 1 FROM products WHERE id = $1', [id])).length; n++) {
        id = 'P' + String(now + n).slice(-6);
      }
      // Sản phẩm mới hiện lên đầu danh sách.
      const [{ first }] = await exec('SELECT COALESCE(MIN(sort_order), 0) - 1 AS first FROM products');
      const product: Product = { ...input, id, category, isOrder, images, variants, sold: 0, updatedAt: now };
      await insertProducts(exec, [product], Number(first));
    });

    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}

/** Cập nhật nhanh nhiều sản phẩm: còn/hết hàng, số đã bán, ảnh. */
export async function PATCH(request: Request) {
  try {
    const role = requireRole(request);
    const body = await readJsonBody<{ updates?: Array<Partial<Product> & { id: string }> }>(request);
    const updates = Array.isArray(body.updates) ? body.updates.slice(0, 500) : [];
    if (!updates.length) throw new HttpError(400, 'Không có thay đổi nào.');

    const upload = createImageUploader();
    const prepared = await Promise.all(
      updates.map(async (u) => {
        const id = String(u.id || '');
        const images = Array.isArray(u.images)
          ? await Promise.all(u.images.map(String).filter(Boolean).map((img, i) => upload(img, `${id}-${i + 1}`, 'products')))
          : null;
        const variants: Variant[] | null = Array.isArray(u.variants)
          ? await Promise.all(
              u.variants
                .map(normalizeVariant)
                .filter((v) => v.name)
                .map(async (v) => ({ ...v, image: v.image ? await upload(v.image, `${id}-${v.name}`, 'products') : '' })),
            )
          : null;
        return {
          id,
          inStock: typeof u.inStock === 'boolean' ? u.inStock : null,
          sold: u.sold !== undefined ? Math.max(0, Math.floor(Number(u.sold) || 0)) : null,
          images: images ? JSON.stringify(images) : null,
          variants: variants ? JSON.stringify(variants) : null,
        };
      }),
    );

    await mutate(async ({ exec, now }) => {
      for (const u of prepared) {
        await exec(
          `UPDATE products SET
             in_stock   = COALESCE($2::boolean, in_stock),
             sold       = COALESCE($3::integer, sold),
             images     = COALESCE($4::jsonb, images),
             variants   = COALESCE($5::jsonb, variants),
             updated_at = $6
           WHERE id = $1`,
          [u.id, u.inStock, u.sold, u.images, u.variants, now],
        );
      }
    });
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
