import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { createImageUploader, externalizeSettingsImages } from '@/lib/server/imagekit';
import { mutate, readState, saveSettings } from '@/lib/server/store';
import { normalizeSettings } from '@/lib/shop';
import type { Settings } from '@/lib/types';

/**
 * Cập nhật một phần cài đặt cửa hàng.
 * Nhân viên chỉ được sửa danh sách quà tặng đổi điểm; các mục khác (thông tin shop, bot, giao diện) dành cho Chủ shop.
 */
export async function PATCH(request: Request) {
  try {
    const role = requireRole(request);
    const body = await readJsonBody<{ settings?: Partial<Settings> }>(request);
    const raw = body.settings && typeof body.settings === 'object' ? { ...body.settings } : {};
    if (role !== 'owner') {
      const keys = Object.keys(raw);
      if (keys.some((k) => k !== 'loyaltyGifts')) {
        throw new HttpError(403, '⛔ Chức năng này chỉ dành cho Chủ shop!');
      }
    }
    if ('shopName' in raw && !String(raw.shopName || '').trim()) raw.shopName = 'ViVi NailShop';

    // Logo / ảnh quà tặng dạng base64 → đưa lên ImageKit trước.
    const patch = await externalizeSettingsImages(raw, createImageUploader());

    await mutate(async ({ exec, meta }) => {
      await saveSettings(exec, normalizeSettings(patch, meta.settings));
    });
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
