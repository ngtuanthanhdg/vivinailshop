import { CANCELLED_STATUS } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { jsonError, requireRole } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';

/** Tính lại "Đã bán" của mọi sản phẩm từ các đơn hàng không bị huỷ. */
export async function POST(request: Request) {
  try {
    const role = requireRole(request);
    const { state } = await updateState((draft) => {
      const soldMap: Record<string, number> = {};
      for (const o of draft.orders) {
        if (o.status === CANCELLED_STATUS) continue;
        for (const it of o.items || []) {
          if (!it.productId) continue;
          soldMap[it.productId] = (soldMap[it.productId] || 0) + Number(it.qty || 0);
        }
      }
      const now = Date.now();
      for (const p of draft.products) {
        p.sold = Number(soldMap[p.id] || 0);
        p.updatedAt = now;
      }
    });
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
