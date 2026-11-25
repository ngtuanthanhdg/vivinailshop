import { cleanPhone } from '@/lib/format';
import { jsonError } from '@/lib/server/http';
import { readState } from '@/lib/server/store';

/** Tra cứu khách hàng theo đúng số điện thoại: điểm tích lũy + lịch sử đơn hàng. */
export async function GET(_request: Request, ctx: RouteContext<'/api/customers/[phone]'>) {
  try {
    const phone = cleanPhone(decodeURIComponent((await ctx.params).phone));
    if (phone.length < 9) {
      return Response.json({ customer: null, orders: [] });
    }
    const state = await readState();
    const orders = state.orders
      .filter((o) => cleanPhone(o.phone) === phone)
      .sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0));
    return Response.json({ customer: state.customers[phone] || null, orders });
  } catch (err) {
    return jsonError(err);
  }
}
