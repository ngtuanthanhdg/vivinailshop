import { CANCELLED_STATUS } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { addSold, mutate, readState } from '@/lib/server/store';
import { ORDER_STATUSES, type CartItem } from '@/lib/types';

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

    await mutate(async ({ exec, now }) => {
      const [row] = await exec('SELECT status, items FROM orders WHERE id = $1 FOR UPDATE', [id]);
      if (!row) throw new HttpError(404, 'Không tìm thấy đơn hàng.');
      const prevStatus = String(row.status);
      if (prevStatus === newStatus) return;

      const direction =
        prevStatus !== CANCELLED_STATUS && newStatus === CANCELLED_STATUS ? -1
        : prevStatus === CANCELLED_STATUS && newStatus !== CANCELLED_STATUS ? 1
        : 0;
      if (direction) {
        const deltas: Record<string, number> = {};
        for (const it of (Array.isArray(row.items) ? row.items : []) as CartItem[]) {
          if (!it?.productId) continue;
          deltas[it.productId] = (deltas[it.productId] || 0) + direction * Number(it.qty || 0);
        }
        await addSold(exec, deltas, now);
      }
      await exec('UPDATE orders SET status = $2 WHERE id = $1', [id, newStatus]);
    });
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
