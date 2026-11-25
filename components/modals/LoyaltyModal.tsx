'use client';

import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import type { Customer } from '@/lib/types';
import { useShop } from '../ShopProvider';
import { Bone } from '../storefront/StorefrontSkeleton';
import { CloseButton, ModalOverlay } from './Modal';
import { useCustomerLookup } from './useCustomerLookup';

export default function LoyaltyModal() {
  const { shop, loyaltyOpen, setLoyaltyOpen, toast } = useShop();
  const [phone, setPhone] = useState('');
  const [redeeming, setRedeeming] = useState('');
  const { digits, ready, customer, setCustomer } = useCustomerLookup(phone, loyaltyOpen);
  const gifts = shop.settings.loyaltyGifts || [];

  async function redeem(giftId: string) {
    if (digits.length < 9 || !customer) {
      toast('⚠️ Vui lòng nhập số điện thoại thành viên có điểm trước!');
      return;
    }
    if (redeeming) return;
    setRedeeming(giftId);
    try {
      const res = await apiFetch<{ customer: Customer; gift: { name: string } }>('/api/loyalty/redeem', {
        method: 'POST',
        body: { phone: digits, giftId },
      });
      setCustomer(res.customer);
      toast(`🎉 Đổi thành công quà "${res.gift.name}"! Shop sẽ gửi kèm đơn hoặc liên hệ bạn.`);
    } catch (err) {
      toast((err as Error).message);
    } finally {
      setRedeeming('');
    }
  }

  return (
    <ModalOverlay hidden={!loyaltyOpen}>
      <div className="bg-white text-stone-800 rounded-3xl max-w-xl w-full max-h-[88dvh] overflow-y-auto overscroll-contain p-4 sm:p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <h2 className="text-base sm:text-lg font-extrabold">🎁 Tích Điểm Đổi Quà Thành Viên</h2>
          <CloseButton onClick={() => setLoyaltyOpen(false)} />
        </div>
        <p className="text-xs text-stone-500">
          Mỗi <b>10.000đ</b> mua hàng = <b>+1 điểm tích lũy</b>. Nhập SĐT để kiểm tra điểm và đổi quà miễn phí!
        </p>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Nhập số điện thoại thành viên..."
          className="w-full px-4 py-2.5 rounded-2xl border text-sm"
        />
        <div className="p-3 rounded-2xl bg-stone-50 border text-xs text-stone-700">
          {digits.length < 9 ? (
            'Nhập đủ số điện thoại (9–11 số) để xem số điểm tích lũy hiện tại.'
          ) : !ready ? (
            <span className="flex items-center gap-2" aria-busy="true">
              <Bone className="h-3 w-40 rounded-full" />
              <Bone className="h-3 w-16 rounded-full" />
            </span>
          ) : !customer ? (
            <>
              SĐT <b>{digits}</b> hiện có <b>0 điểm</b>. Hãy đặt đơn để tích điểm tự động nhé!
            </>
          ) : (
            <>
              🎉 Xin chào <b>{customer.name}</b> • Điểm khả dụng: <b className="text-sm text-amber-800">{customer.points || 0} điểm</b>
            </>
          )}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {gifts.map((g) => (
            <div key={g.id} className="p-2.5 rounded-2xl border bg-stone-50 flex flex-col justify-between text-center">
              <div>
                <img
                  src={g.image || 'https://placehold.co/200x200/FAF5EF/7C583A?text=Qua'}
                  alt={g.name}
                  className="w-full aspect-square object-cover rounded-xl mb-2"
                />
                <div className="text-xs font-bold text-stone-800 line-clamp-2">{g.name}</div>
              </div>
              <div className="mt-2 space-y-1.5">
                <div className="text-xs font-extrabold text-amber-800">⭐ {g.points} điểm</div>
                <button
                  type="button"
                  onClick={() => redeem(g.id)}
                  disabled={Boolean(redeeming)}
                  className="w-full py-1.5 rounded-xl text-xs font-bold text-white disabled:opacity-60"
                  style={{ backgroundColor: 'var(--accent-main)' }}
                >
                  {redeeming === g.id ? 'Đang đổi...' : 'Đổi quà ngay'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ModalOverlay>
  );
}
