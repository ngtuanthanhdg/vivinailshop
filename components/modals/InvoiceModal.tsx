'use client';

import { formatVND } from '@/lib/format';
import { cartItemImage } from '@/lib/shop';
import { useShop } from '../ShopProvider';
import { CloseButton, ModalOverlay } from './Modal';

export default function InvoiceModal() {
  const { shop, invoiceOrder: order, closeInvoice } = useShop();
  if (!order) return null;

  return (
    <ModalOverlay zIndex="z-50" dark>
      <div className="bg-white text-stone-800 rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 shadow-2xl relative">
        <CloseButton onClick={closeInvoice} className="absolute top-3.5 right-3.5" />
        <div className="space-y-3 text-xs">
          <div className="text-center border-b pb-3">
            <div className="text-base font-extrabold text-stone-900">{shop.settings.shopName}</div>
            <div className="text-[11px] text-stone-500">HÓA ĐƠN BÁN LẺ / XÁC NHẬN ĐƠN HÀNG</div>
            <div className="mt-1 font-bold text-amber-800">
              Mã đơn: #{order.id} • {order.createdAt}
            </div>
          </div>

          <div className="space-y-1 bg-stone-50 p-3 rounded-2xl border">
            <div>
              👤 Khách hàng: <b>{order.customerName}</b> — <b>{order.phone}</b>
            </div>
            <div>📍 Địa chỉ: {order.address}</div>
            <div>🚚 Giao hàng: {order.shippingMethod}</div>
            <div>💳 Thanh toán: {order.paymentMethod}</div>
            <div>
              📌 Trạng thái: <b>{order.status}</b>
            </div>
            {order.note && <div>📝 Ghi chú: {order.note}</div>}
          </div>

          <div className="space-y-2">
            <div className="font-extrabold text-stone-700">Chi tiết sản phẩm:</div>
            {order.items.map((it, i) => (
              <div key={i} className="flex items-center justify-between gap-2.5 py-1.5 border-b border-dashed">
                <img
                  src={cartItemImage(it, shop.products, 'https://placehold.co/96x96/FAF5EF/7C583A?text=SP')}
                  alt={it.name}
                  className="w-12 h-12 rounded-xl object-cover border bg-stone-50 shrink-0"
                />
                <div className="flex-1 min-w-0 pr-1">
                  <div className="font-bold text-stone-800 line-clamp-2 leading-snug">{it.name}</div>
                  {it.variantName && (
                    <div className="text-[10px] text-stone-500 mt-0.5">
                      PL: <b>{it.variantName}</b>
                    </div>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] text-stone-500">
                    {it.qty} x {formatVND(it.unitPrice)}
                  </div>
                  <div className="font-extrabold text-stone-900">{formatVND(it.qty * it.unitPrice)}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex justify-between">
              <span>Tạm tính:</span>
              <span>{formatVND(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Phí ship:</span>
              <span>{formatVND(order.shipFee)}</span>
            </div>
            <div className="flex justify-between text-emerald-700">
              <span>Giảm giá:</span>
              <span>-{formatVND(order.discount)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold pt-1.5 border-t" style={{ color: 'var(--accent-main)' }}>
              <span>TỔNG CỘNG:</span>
              <span>{formatVND(order.total)}</span>
            </div>
          </div>
        </div>
        <button type="button" onClick={closeInvoice} className="mt-4 w-full py-2.5 rounded-xl font-bold text-xs bg-stone-800 text-white">
          Đóng hóa đơn
        </button>
      </div>
    </ModalOverlay>
  );
}
