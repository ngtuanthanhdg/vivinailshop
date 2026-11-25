'use client';

import { useRef, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { HANOI_DISTRICTS, PAYMENT_METHODS } from '@/lib/constants';
import { cleanPhone, formatVND } from '@/lib/format';
import { ikImage } from '@/lib/image';
import { computeCartTotals } from '@/lib/pricing';
import { cartItemImage } from '@/lib/shop';
import type { Customer, Order, ShippingMethod } from '@/lib/types';
import { useShop } from '../ShopProvider';
import { CloseButton, ModalOverlay } from './Modal';

const SHIPPING_OPTIONS: { id: ShippingMethod; label: string }[] = [
  { id: 'grab', label: '🟢 Grab Hà Nội' },
  { id: 'standard', label: '📦 Giao toàn quốc' },
  { id: 'pickup', label: '🏪 Lấy tại shop' },
];

const inputClass = 'px-3 py-2 rounded-xl border bg-white text-xs sm:text-sm';

export default function CartModal() {
  const { shop, cart, cartOpen, updateCartQty, clearCart, setCartOpen, openInvoice, toast, refreshAll } = useShop();
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState(PAYMENT_METHODS[0].value);
  const [coupon, setCoupon] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<ShippingMethod>('grab');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [returning, setReturning] = useState<{ digits: string; customer: Customer | null; orders: Order[] } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const lookupTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lookupSeq = useRef(0);

  const totals = computeCartTotals({
    items: cart,
    settings: shop.settings,
    shippingMethod: method,
    grabDistrict: district,
    grabWard: ward,
    coupon,
  });

  // Nhận diện khách quen qua số điện thoại → tự điền tên, địa chỉ & hiện đơn cũ.
  function onPhoneChange(value: string) {
    setPhone(value);
    const digits = cleanPhone(value);
    if (lookupTimer.current) clearTimeout(lookupTimer.current);
    const seq = ++lookupSeq.current;
    if (digits.length < 9) {
      setReturning(null);
      return;
    }
    lookupTimer.current = setTimeout(async () => {
      try {
        const data = await apiFetch<{ customer: Customer | null; orders: Order[] }>(`/api/customers/${digits}`);
        if (seq !== lookupSeq.current) return;
        if (!data.customer && !data.orders.length) {
          setReturning(null);
          return;
        }
        const lastOrder = data.orders[0];
        const foundName = data.customer?.name || lastOrder?.customerName || '';
        const foundAddr = data.customer?.lastAddress || lastOrder?.address || '';
        if (foundName) setName((n) => n || foundName);
        if (foundAddr && foundAddr !== 'Nhận tại cửa hàng') setAddress((a) => a || foundAddr);
        setReturning({ digits, ...data });
      } catch {
        // không tra cứu được thì bỏ qua
      }
    }, 300);
  }

  async function submitOrder() {
    if (submitting) return;
    if (!cart.length) {
      toast('⚠️ Giỏ hàng đang trống!');
      return;
    }
    if (!phone.trim() || !name.trim()) {
      toast('⚠️ Vui lòng nhập đầy đủ Tên và Số điện thoại!');
      return;
    }
    if (method === 'grab' && !district) {
      toast('⚠️ Vui lòng chọn Quận/Phường Hà Nội để giao Grab!');
      return;
    }
    if (method !== 'pickup' && !address.trim()) {
      toast('⚠️ Vui lòng nhập địa chỉ giao hàng!');
      return;
    }
    setSubmitting(true);
    try {
      const { order } = await apiFetch<{ order: Order }>('/api/orders', {
        method: 'POST',
        body: {
          customerName: name,
          phone,
          address,
          note,
          payment,
          coupon,
          shippingMethod: method,
          grabDistrict: district,
          grabWard: ward,
          items: cart.map((i) => ({ productId: i.productId, variantIdx: i.variantIdx, qty: i.qty })),
        },
      });
      clearCart();
      setCartOpen(false);
      openInvoice(order);
      toast(`🎉 Đặt đơn #${order.id} thành công! (+${order.earnedPoints} điểm)`);
      setReturning(null);
      void refreshAll();
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  const wards = district && HANOI_DISTRICTS[district] ? Object.keys(HANOI_DISTRICTS[district].wards) : [];
  const showReturning = returning && returning.digits === cleanPhone(phone);

  return (
    <ModalOverlay hidden={!cartOpen}>
      <div className="bg-white text-stone-800 rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base sm:text-lg font-extrabold flex items-center gap-2">🛒 Giỏ Hàng & Thanh Toán</h2>
          <CloseButton onClick={() => setCartOpen(false)} />
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {!cart.length ? (
            <div className="py-8 text-center text-xs text-stone-400">Giỏ hàng của bạn đang trống. Hãy chọn thêm sản phẩm nhé!</div>
          ) : (
            cart.map((item, idx) => (
              <div key={`${item.productId}-${item.variantIdx}`} className="flex items-center gap-2.5 p-2.5 rounded-2xl border bg-stone-50/70">
                <img
                  src={ikImage(cartItemImage(item, shop.products, 'https://placehold.co/100x100/FAF5EF/7C583A?text=SP'), 120)}
                  alt={item.name}
                  className="w-12 h-12 rounded-xl object-cover border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-stone-800 truncate">{item.name}</div>
                  {item.variantName && (
                    <div className="text-[11px] text-stone-500">
                      Phân loại: <b>{item.variantName}</b>
                    </div>
                  )}
                  <div className="text-xs font-extrabold mt-0.5" style={{ color: 'var(--accent-main)' }}>
                    {formatVND(item.unitPrice)} / SP
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button type="button" onClick={() => updateCartQty(idx, -1)} className="w-7 h-7 rounded-lg border bg-white font-bold text-xs">
                    −
                  </button>
                  <span className="w-6 text-center text-xs font-extrabold">{item.qty}</span>
                  <button type="button" onClick={() => updateCartQty(idx, 1)} className="w-7 h-7 rounded-lg border bg-white font-bold text-xs">
                    +
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Thông tin khách hàng */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border space-y-3">
          <div className="text-xs font-extrabold text-stone-700">📋 Thông tin nhận hàng (Nhập SĐT tự nhận diện khách quen):</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <input
              type="tel"
              value={phone}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="Số điện thoại nhận hàng *"
              className={inputClass}
            />
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Họ và tên khách hàng *" className={inputClass} />
          </div>

          {/* Khung nhận diện khách quen & đơn cũ */}
          {showReturning && (
            <ReturningCustomerBox
              phone={returning.digits}
              customer={returning.customer}
              orders={returning.orders}
              fallbackName={returning.orders[0]?.customerName}
              onOpenInvoice={openInvoice}
            />
          )}

          {/* Hình thức giao hàng */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-stone-700">🚚 Hình thức nhận hàng:</div>
            <div className="grid grid-cols-3 gap-2">
              {SHIPPING_OPTIONS.map((opt) => {
                const active = method === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setMethod(opt.id)}
                    className={`py-2 px-2 rounded-xl border text-[11px] sm:text-xs font-bold ${active ? 'text-white' : 'bg-white text-stone-800'}`}
                    style={active ? { backgroundColor: 'var(--accent-main)' } : undefined}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tính cước Grab Hà Nội theo Quận/Phường */}
          {method === 'grab' && (
            <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setWard('');
                  }}
                  className="px-2.5 py-2 rounded-xl border bg-white text-xs font-medium"
                >
                  <option value="">-- Chọn Quận Hà Nội --</option>
                  {Object.keys(HANOI_DISTRICTS).map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
                <select value={ward} onChange={(e) => setWard(e.target.value)} className="px-2.5 py-2 rounded-xl border bg-white text-xs font-medium">
                  <option value="">-- Chọn Phường/Xã --</option>
                  {wards.map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-[11px] text-emerald-900">
                {totals.subtotal > 0 && totals.grabEstimate
                  ? totals.grabEstimate.text
                  : 'Chọn Quận/Phường để tự động tính cước GrabExpress từ shop tới bạn.'}
              </div>
            </div>
          )}

          {method !== 'pickup' && (
            <div>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Số nhà, tên đường, tòa nhà nhận hàng *"
                className={`w-full ${inputClass}`}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <select value={payment} onChange={(e) => setPayment(e.target.value)} className={`${inputClass} font-medium`}>
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              placeholder="Mã giảm giá (VIVI20 / VIVI50)"
              className={`${inputClass} uppercase`}
            />
          </div>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Ghi chú cho shop (VD: Giao giờ hành chính...)"
            className={`w-full ${inputClass}`}
          />
        </div>

        {/* Tổng tiền */}
        <div className="p-3.5 rounded-2xl bg-stone-50 border space-y-1.5 text-xs sm:text-sm">
          <div className="flex justify-between text-stone-600">
            <span>Tạm tính tiền hàng:</span>
            <span className="font-bold">{formatVND(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-stone-600">
            <span>Phí giao hàng:</span>
            <span className="font-bold">{formatVND(totals.shipFee)}</span>
          </div>
          <div className="flex justify-between text-emerald-700">
            <span>Mã giảm giá:</span>
            <span className="font-bold">-{formatVND(totals.discount)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold pt-2 border-t" style={{ color: 'var(--accent-main)' }}>
            <span>TỔNG THANH TOÁN:</span>
            <span>{formatVND(totals.grandTotal)}</span>
          </div>
        </div>

        <button
          type="button"
          onClick={submitOrder}
          disabled={submitting}
          className="w-full py-3.5 rounded-2xl font-extrabold text-sm sm:text-base text-white shadow-lg hover:opacity-95 transition disabled:opacity-60"
          style={{ backgroundColor: 'var(--accent-main)' }}
        >
          {submitting ? '⏳ Đang gửi đơn hàng...' : '✅ Xác Nhận Đặt Hàng Ngay'}
        </button>
      </div>
    </ModalOverlay>
  );
}

function ReturningCustomerBox({
  phone,
  customer,
  orders,
  fallbackName,
  onOpenInvoice,
}: {
  phone: string;
  customer: Customer | null;
  orders: Order[];
  fallbackName?: string;
  onOpenInvoice: (o: Order) => void;
}) {
  const displayName = customer?.name || fallbackName || phone;
  return (
    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
      <div className="font-extrabold text-emerald-900">👋 Chào mừng khách quen {displayName}!</div>
      <div className="text-emerald-800 mt-0.5">
        ⭐ Điểm tích lũy hiện có: <b>{customer?.points || 0} điểm</b> • Đã đặt <b>{orders.length} đơn</b>
      </div>
      {orders.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {orders.slice(0, 3).map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => onOpenInvoice(o)}
              className="px-2 py-0.5 rounded-lg bg-white border border-emerald-300 text-[11px] font-bold text-emerald-900"
            >
              🧾 Đơn #{o.id} ({formatVND(o.total)})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
