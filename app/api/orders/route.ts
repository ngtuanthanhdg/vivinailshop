import { after } from 'next/server';
import { HANOI_DISTRICTS, PAYMENT_METHODS } from '@/lib/constants';
import { cleanPhone } from '@/lib/format';
import { computeCartTotals, priceCartItems } from '@/lib/pricing';
import { HttpError, jsonError, readJsonBody } from '@/lib/server/http';
import { addSold, insertOrders, mutate, rowToCustomer, rowToProduct } from '@/lib/server/store';
import { buildOrderMessage, notifyShop } from '@/lib/server/telegram';
import type { CartItem, Order, ShippingMethod } from '@/lib/types';

interface OrderRequest {
  customerName?: string;
  phone?: string;
  address?: string;
  note?: string;
  payment?: string;
  coupon?: string;
  shippingMethod?: ShippingMethod;
  grabDistrict?: string;
  grabWard?: string;
  items?: { productId?: string; variantIdx?: number; qty?: number }[];
}

/** Không chép ảnh base64 (rất nặng) vào đơn hàng: hoá đơn sẽ tự lấy ảnh từ sản phẩm. */
function storableImage(src: string | undefined): string {
  return src && !src.startsWith('data:') ? src : '';
}

/** Đặt đơn: máy chủ tự tính lại giá, phí ship, mã giảm giá để khách không sửa được số tiền. */
export async function POST(request: Request) {
  try {
    const body = await readJsonBody<OrderRequest>(request);
    const customerName = String(body.customerName || '').trim().slice(0, 120);
    const phone = String(body.phone || '').trim().slice(0, 20);
    const phoneDigits = cleanPhone(phone);
    const rawAddr = String(body.address || '').trim().slice(0, 300);
    const note = String(body.note || '').trim().slice(0, 500);
    const coupon = String(body.coupon || '').trim().slice(0, 30);
    const payment = PAYMENT_METHODS.some((p) => p.value === body.payment) ? String(body.payment) : PAYMENT_METHODS[0].value;
    const method: ShippingMethod = body.shippingMethod === 'standard' || body.shippingMethod === 'pickup' ? body.shippingMethod : 'grab';
    const grabDistrict = HANOI_DISTRICTS[String(body.grabDistrict || '')] ? String(body.grabDistrict) : '';
    const grabWard = grabDistrict && HANOI_DISTRICTS[grabDistrict].wards[String(body.grabWard || '')] ? String(body.grabWard) : '';
    const requested = Array.isArray(body.items) ? body.items.slice(0, 200) : [];

    if (!requested.length) throw new HttpError(400, '⚠️ Giỏ hàng đang trống!');
    if (!customerName || !phone) throw new HttpError(400, '⚠️ Vui lòng nhập đầy đủ Tên và Số điện thoại!');
    if (phoneDigits.length < 9 || phoneDigits.length > 11) throw new HttpError(400, '⚠️ Số điện thoại phải có 9–11 chữ số!');

    let fullAddress = 'Nhận tại cửa hàng';
    let shipLabel = 'Nhận tại shop';
    if (method === 'grab') {
      if (!grabDistrict) throw new HttpError(400, '⚠️ Vui lòng chọn Quận/Phường Hà Nội để giao Grab!');
      if (!rawAddr) throw new HttpError(400, '⚠️ Vui lòng nhập địa chỉ giao hàng!');
      fullAddress = [rawAddr, grabWard, grabDistrict, 'Hà Nội'].filter(Boolean).join(', ');
      shipLabel = `GrabExpress Hà Nội (${grabDistrict})`;
    } else if (method === 'standard') {
      if (!rawAddr) throw new HttpError(400, '⚠️ Vui lòng nhập địa chỉ giao hàng!');
      fullAddress = rawAddr;
      shipLabel = 'Giao hàng toàn quốc';
    }

    const { order, customer, settings } = await mutate(async ({ exec, meta, now: nowMs }) => {
      // Khoá các sản phẩm trong giỏ để giá / tình trạng hàng không đổi giữa chừng.
      const ids = [...new Set(requested.map((r) => String(r.productId || '')))];
      const products = (await exec('SELECT * FROM products WHERE id = ANY($1::text[]) FOR UPDATE', [ids])).map(rowToProduct);

      const items: CartItem[] = [];
      for (const req of requested) {
        const prod = products.find((p) => p.id === req.productId);
        if (!prod) throw new HttpError(409, '⚠️ Có sản phẩm trong giỏ không còn tồn tại, vui lòng xoá khỏi giỏ!');
        if (prod.inStock === false) throw new HttpError(409, `⚠️ "${prod.name}" hiện đang tạm hết hàng!`);
        const qty = Math.floor(Number(req.qty || 0));
        if (qty < 1 || qty > 9999) throw new HttpError(400, '⚠️ Số lượng sản phẩm không hợp lệ!');
        const hasVariants = Array.isArray(prod.variants) && prod.variants.length > 0;
        const variantIdx = hasVariants ? Math.floor(Number(req.variantIdx)) : -1;
        const variant = hasVariants ? prod.variants[variantIdx] : undefined;
        if (hasVariants && !variant) throw new HttpError(400, `⚠️ Vui lòng chọn phân loại cho "${prod.name}"!`);

        const existing = items.find((it) => it.productId === prod.id && it.variantIdx === variantIdx);
        if (existing) {
          existing.qty += qty;
          continue;
        }
        items.push({
          productId: prod.id,
          name: prod.name,
          variantIdx,
          variantName: variant?.name || '',
          qty,
          image: storableImage(variant?.image || prod.images?.[0]),
          unitPrice: prod.price,
        });
      }

      const pricedItems = priceCartItems(items, products);
      const totals = computeCartTotals({
        items: pricedItems,
        settings: meta.settings,
        shippingMethod: method,
        grabDistrict,
        grabWard,
        coupon,
      });
      const earnedPoints = Math.floor(totals.subtotal / 10000);

      // Mã đơn = DH + 6 số cuối thời gian; trùng thì lấy số kế tiếp.
      let orderId = '';
      for (let n = 0; !orderId; n++) {
        const candidate = 'DH' + String(nowMs + n).slice(-6);
        if (!(await exec('SELECT 1 FROM orders WHERE id = $1', [candidate])).length) orderId = candidate;
      }

      const newOrder: Order = {
        id: orderId,
        customerName,
        phone,
        address: fullAddress,
        shippingMethod: shipLabel,
        paymentMethod: payment,
        note,
        items: pricedItems,
        subtotal: totals.subtotal,
        shipFee: totals.shipFee,
        discount: totals.discount,
        total: totals.grandTotal,
        earnedPoints,
        status: 'Chờ xác nhận',
        createdAt: new Date(nowMs).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        createdAtMs: nowMs,
      };
      await insertOrders(exec, [newOrder]);

      // Cập nhật số lượng đã bán của từng sản phẩm
      const soldDeltas: Record<string, number> = {};
      for (const item of pricedItems) soldDeltas[item.productId] = (soldDeltas[item.productId] || 0) + item.qty;
      await addSold(exec, soldDeltas, nowMs);

      // Cộng điểm tích lũy khách hàng
      const [customerRow] = await exec(
        `INSERT INTO customers (phone, name, points, total_spent, order_count, last_address)
         VALUES ($1, $2, $3, $4, 1, $5)
         ON CONFLICT (phone) DO UPDATE SET
           name         = EXCLUDED.name,
           last_address = EXCLUDED.last_address,
           points       = customers.points + EXCLUDED.points,
           total_spent  = customers.total_spent + EXCLUDED.total_spent,
           order_count  = customers.order_count + 1
         RETURNING *`,
        [phoneDigits, customerName, earnedPoints, Math.round(totals.grandTotal), fullAddress],
      );
      return { order: newOrder, customer: rowToCustomer(customerRow), settings: meta.settings };
    });

    after(() => notifyShop(settings, buildOrderMessage(order, settings.shopName)));

    return Response.json({ order, customer });
  } catch (err) {
    return jsonError(err);
  }
}
