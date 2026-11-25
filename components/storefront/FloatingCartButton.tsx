'use client';

import { formatVND } from '@/lib/format';
import { useShop } from '../ShopProvider';

export default function FloatingCartButton() {
  const { cart, setCartOpen } = useShop();
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  const totalAmt = cart.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  if (totalQty <= 0) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md">
      <button
        type="button"
        onClick={() => setCartOpen(true)}
        className="w-full py-3 px-5 rounded-2xl text-white font-bold shadow-xl flex items-center justify-between transition active:scale-95"
        style={{ backgroundColor: 'var(--accent-main)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">🛒</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs bg-white/20">{totalQty} món</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm sm:text-base font-extrabold">{formatVND(totalAmt)}</span>
          <span className="text-xs underline">Xem giỏ →</span>
        </div>
      </button>
    </div>
  );
}
