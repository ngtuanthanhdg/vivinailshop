import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';
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
    const patch = body.settings && typeof body.settings === 'object' ? { ...body.settings } : {};
    if (role !== 'owner') {
      const keys = Object.keys(patch);
      if (keys.some((k) => k !== 'loyaltyGifts')) {
        throw new HttpError(403, '⛔ Chức năng này chỉ dành cho Chủ shop!');
      }
    }
    if ('shopName' in patch && !String(patch.shopName || '').trim()) patch.shopName = 'ViVi NailShop';

    const { state } = await updateState((draft) => {
      draft.settings = normalizeSettings(patch, draft.settings);
    });
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
