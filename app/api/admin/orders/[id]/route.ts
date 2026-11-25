import { CANCELLED_STATUS } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';
import { ORDER_STATUSES } from '@/lib/types';

/** Đổi trạng thái đơn. Huỷ đơn → trừ lại "Đã bán"; mở lại đơn đã huỷ → cộng lại. */
export async function PATCH(request: Request, ctx: RouteContext<'/api/admin/orders/[id]'>) {
  try {
    const role = requireRole(request);
    const { id } = await ctx.params;
    const { status } = await readJsonBody<{ status?: string }>(request);
    if (!ORDER_STATUSES.includes(status as (typeof ORDER_STATUSES)[number])) {
      throw new HttpError(400, 'Trạng thái đơn không hợp lệ.');
    }
    const newStatus = String(status);

    const { state } = await updateState((draft) => {
      const o = draft.orders.find((x) => x.id === id);
      if (!o) throw new HttpError(404, 'Không tìm thấy đơn hàng.');
      const prevStatus = o.status;
      if (prevStatus === newStatus) return;

      const direction =
        prevStatus !== CANCELLED_STATUS && newStatus === CANCELLED_STATUS ? -1
        : prevStatus === CANCELLED_STATUS && newStatus !== CANCELLED_STATUS ? 1
        : 0;
      if (direction) {
        const now = Date.now();
        for (const it of o.items || []) {
          const p = draft.products.find((x) => x.id === it.productId);
          if (p) {
            p.sold = Math.max(0, Number(p.sold || 0) + direction * Number(it.qty || 0));
            p.updatedAt = now;
          }
        }
      }
      o.status = newStatus;
    });
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
