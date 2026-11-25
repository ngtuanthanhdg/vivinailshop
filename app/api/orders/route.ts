import { after } from 'next/server';
import { HANOI_DISTRICTS, PAYMENT_METHODS } from '@/lib/constants';
import { cleanPhone } from '@/lib/format';
import { computeCartTotals, priceCartItems } from '@/lib/pricing';
import { HttpError, jsonError, readJsonBody } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';
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
    const requested = Array.isArray(body.items) ? body.items : [];

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

    const { state, result: order } = await updateState((draft) => {
      const items: CartItem[] = [];
      for (const req of requested) {
        const prod = draft.products.find((p) => p.id === req.productId);
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

      const pricedItems = priceCartItems(items, draft.products);
      const totals = computeCartTotals({
        items: pricedItems,
        settings: draft.settings,
        shippingMethod: method,
        grabDistrict,
        grabWard,
        coupon,
      });

      const nowMs = Date.now();
      let orderId = 'DH' + String(nowMs).slice(-6);
      for (let n = 1; draft.orders.some((o) => o.id === orderId); n++) {
        orderId = 'DH' + String(nowMs + n).slice(-6);
      }
      const earnedPoints = Math.floor(totals.subtotal / 10000);

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
      draft.orders.unshift(newOrder);

      // Cập nhật số lượng đã bán của từng sản phẩm
      for (const item of pricedItems) {
        const p = draft.products.find((x) => x.id === item.productId);
        if (p) {
          p.sold = Number(p.sold || 0) + item.qty;
          p.updatedAt = nowMs;
        }
      }

      // Cộng điểm tích lũy khách hàng
      const prev = draft.customers[phoneDigits] || { phone: phoneDigits, name: customerName, points: 0, totalSpent: 0, orderCount: 0 };
      draft.customers[phoneDigits] = {
        ...prev,
        phone: phoneDigits,
        name: customerName,
        lastAddress: fullAddress,
        points: (prev.points || 0) + earnedPoints,
        totalSpent: (prev.totalSpent || 0) + totals.grandTotal,
        orderCount: (prev.orderCount || 0) + 1,
      };
      return newOrder;
    });

    after(() => notifyShop(state.settings, buildOrderMessage(order, state.settings.shopName)));

    return Response.json({ order, customer: state.customers[phoneDigits] });
  } catch (err) {
    return jsonError(err);
  }
}
