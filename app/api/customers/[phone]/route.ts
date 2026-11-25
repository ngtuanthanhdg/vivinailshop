import { cleanPhone } from '@/lib/format';
import { jsonError } from '@/lib/server/http';
import { readCustomerHistory } from '@/lib/server/store';

/** Tra cứu khách hàng theo đúng số điện thoại: điểm tích lũy + lịch sử đơn hàng. */
export async function GET(_request: Request, ctx: RouteContext<'/api/customers/[phone]'>) {
  try {
    const phone = cleanPhone(decodeURIComponent((await ctx.params).phone));
    if (phone.length < 9 || phone.length > 11) {
      return Response.json({ customer: null, orders: [] });
    }
    return Response.json(await readCustomerHistory(phone));
  } catch (err) {
    return jsonError(err);
  }
}
