import { CANCELLED_STATUS } from '@/lib/constants';
import { adminResponse } from '@/lib/server/admin';
import { jsonError, requireRole } from '@/lib/server/http';
import { mutate, readState } from '@/lib/server/store';
import type { CartItem } from '@/lib/types';

/** Tính lại "Đã bán" của mọi sản phẩm từ các đơn hàng không bị huỷ. */
export async function POST(request: Request) {
  try {
    const role = requireRole(request);
    await mutate(async ({ exec, now }) => {
      const orders = await exec('SELECT items FROM orders WHERE status <> $1', [CANCELLED_STATUS]);
      const soldMap: Record<string, number> = {};
      for (const o of orders) {
        for (const it of (Array.isArray(o.items) ? o.items : []) as CartItem[]) {
          if (!it?.productId) continue;
          soldMap[it.productId] = (soldMap[it.productId] || 0) + Number(it.qty || 0);
        }
      }
      const rows = Object.entries(soldMap).map(([id, sold]) => ({ id, sold: Math.max(0, Math.round(sold)) }));
      await exec(
        `UPDATE products p SET sold = COALESCE(x.sold, 0), updated_at = $2
         FROM products p2
         LEFT JOIN jsonb_to_recordset($1::jsonb) AS x(id text, sold integer) ON x.id = p2.id
         WHERE p.id = p2.id`,
        [JSON.stringify(rows), now],
      );
    });
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
