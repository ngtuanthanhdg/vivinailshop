'use client';

import { useState } from 'react';
import { formatVND } from '@/lib/format';
import { cartItemImage } from '@/lib/shop';
import { useShop } from '../ShopProvider';
import { Bone } from '../storefront/StorefrontSkeleton';
import { CloseButton, ModalOverlay } from './Modal';
import { useCustomerLookup } from './useCustomerLookup';

export default function TrackOrderModal() {
  const { shop, track, closeTrack, openInvoice } = useShop();
  const [phone, setPhone] = useState(track.phone);
  const [seenNonce, setSeenNonce] = useState(track.nonce);

  // Mở từ trang quản trị ("Xem đơn") → điền sẵn số điện thoại của khách.
  if (track.nonce !== seenNonce) {
    setSeenNonce(track.nonce);
    if (track.phone) setPhone(track.phone);
  }

  const { digits, loading, customer, orders } = useCustomerLookup(phone, track.open);
  const found = customer || orders.length > 0;
  const customerName = customer?.name || orders[0]?.customerName || digits;
  const customerAddr = customer?.lastAddress || orders[0]?.address || '';

  return (
    <ModalOverlay hidden={!track.open}>
      <div className="bg-white text-stone-800 rounded-3xl max-w-xl w-full max-h-[88vh] overflow-y-auto p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base sm:text-lg font-extrabold">📦 Tra Cứu Đơn Hàng & Hóa Đơn</h2>
          <CloseButton onClick={closeTrack} />
        </div>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Nhập số điện thoại của bạn để tìm đơn hàng..."
          className="w-full px-4 py-2.5 rounded-2xl border text-sm"
        />

        {found && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200">
            <div className="text-xs font-extrabold text-amber-950">
              👤 Khách hàng: {customerName} ({digits})
            </div>
            <div className="text-[11px] text-amber-900 mt-0.5">
              ⭐ Điểm tích lũy: <b>{customer?.points || 0} điểm</b> • Tổng đơn: <b>{orders.length} đơn</b>
            </div>
            {customerAddr && <div className="text-[11px] text-amber-800 mt-0.5">📍 Địa chỉ gần nhất: {customerAddr}</div>}
          </div>
        )}

        <div className="space-y-2.5">
          {digits.length < 9 ? (
            <div className="text-center py-6 text-xs text-stone-400">Nhập số điện thoại (9–11 số) để xem lịch sử đơn hàng và điểm tích lũy.</div>
          ) : loading ? (
            <div className="space-y-2.5" aria-busy="true" aria-label="Đang tìm đơn hàng">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-3 rounded-2xl border bg-stone-50 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 flex-1">
                    <Bone className="w-10 h-10 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Bone className="h-3 w-24 rounded-full" />
                      <Bone className="h-2.5 w-40 rounded-full" />
                    </div>
                  </div>
                  <Bone className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          ) : !orders.length ? (
            <div className="text-center py-6 text-xs text-stone-400">Không tìm thấy đơn hàng nào khớp với số điện thoại này.</div>
          ) : (
            orders.map((o) => (
              <div key={o.id} className="p-3 rounded-2xl border bg-stone-50 flex items-center justify-between gap-2.5">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div>
                    <div className="text-xs font-extrabold text-stone-900">
                      Đơn #{o.id} • <span className="text-amber-700">{o.status}</span>
                    </div>
                    <div className="text-[11px] text-stone-500">
                      {o.createdAt} • {o.items.length} sản phẩm
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {o.items.slice(0, 4).map((it, i) => (
                      <img
                        key={i}
                        src={cartItemImage(it, shop.products, 'https://placehold.co/80x80/FAF5EF/7C583A?text=SP')}
                        alt={it.name}
                        className="w-10 h-10 rounded-xl object-cover border bg-white shrink-0"
                      />
                    ))}
                    {o.items.length > 4 && (
                      <span className="w-10 h-10 rounded-xl border bg-white text-[11px] font-extrabold text-stone-600 flex items-center justify-center shrink-0">
                        +{o.items.length - 4}
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-extrabold" style={{ color: 'var(--accent-main)' }}>
                    {formatVND(o.total)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openInvoice(o)}
                  className="px-3 py-2 rounded-xl text-xs font-bold bg-white border shadow-xs shrink-0 hover:bg-stone-100"
                >
                  🧾 Xem hóa đơn
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </ModalOverlay>
  );
}
