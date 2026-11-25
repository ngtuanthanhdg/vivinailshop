import { adminView } from '@/lib/server/admin';
import { HttpError, jsonError, requireRole } from '@/lib/server/http';
import {
  createImageUploader,
  externalizeProductImages,
  externalizeSettingsImages,
  imagekitEnabled,
  isInlineImage,
} from '@/lib/server/imagekit';
import { mutate, readState, saveSettings } from '@/lib/server/store';
import type { Product } from '@/lib/types';

function hasInlineImages(p: Product): boolean {
  return p.images.some(isInlineImage) || p.variants.some((v) => isInlineImage(v.image));
}

/**
 * Chuyển mọi ảnh còn lưu dạng base64 trong database (dữ liệu cũ) lên ImageKit, rồi thay bằng link.
 * Chạy lại nhiều lần không sao: ảnh đã là link thì bỏ qua.
 */
export async function POST(request: Request) {
  try {
    const role = requireRole(request);
    if (!imagekitEnabled()) {
      throw new HttpError(400, '⚠️ Máy chủ chưa cấu hình ImageKit (IMAGEKIT_PRIVATE_KEY)!');
    }
    const state = await readState();
    const upload = createImageUploader(4);

    const changedProducts = await Promise.all(
      state.products.filter(hasInlineImages).map((p) => externalizeProductImages(p, upload)),
    );
    const settingsHasInline =
      isInlineImage(state.settings.logoDataUrl) || state.settings.loyaltyGifts.some((g) => isInlineImage(g.image));
    const newImages = settingsHasInline
      ? await externalizeSettingsImages(
          { logoDataUrl: state.settings.logoDataUrl, loyaltyGifts: state.settings.loyaltyGifts },
          upload,
        )
      : null;

    const migrated = changedProducts.length + (newImages ? 1 : 0);
    if (migrated) {
      await mutate(async ({ exec, meta, now }) => {
        for (const p of changedProducts) {
          // Chỉ thay ảnh còn base64; ảnh admin vừa đổi trong lúc chờ upload thì giữ nguyên.
          await exec(
            `UPDATE products SET images = $2::jsonb, variants = $3::jsonb, updated_at = $4
             WHERE id = $1 AND images = $5::jsonb AND variants = $6::jsonb`,
            [
              p.id,
              JSON.stringify(p.images),
              JSON.stringify(p.variants),
              now,
              JSON.stringify(state.products.find((x) => x.id === p.id)?.images ?? []),
              JSON.stringify(state.products.find((x) => x.id === p.id)?.variants ?? []),
            ],
          );
        }
        if (newImages) {
          const s = { ...meta.settings };
          if (s.logoDataUrl === state.settings.logoDataUrl) s.logoDataUrl = newImages.logoDataUrl ?? s.logoDataUrl;
          const byId = new Map((newImages.loyaltyGifts || []).map((g) => [g.id, g.image]));
          s.loyaltyGifts = s.loyaltyGifts.map((g) => (isInlineImage(g.image) && byId.has(g.id) ? { ...g, image: byId.get(g.id)! } : g));
          await saveSettings(exec, s);
        }
      });
    }
    return Response.json({ ...adminView(await readState(), role), migrated });
  } catch (err) {
    return jsonError(err);
  }
}
