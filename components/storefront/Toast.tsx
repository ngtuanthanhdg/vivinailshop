'use client';

import { useShop } from '../ShopProvider';

export default function Toast() {
  const { toastState } = useShop();
  if (!toastState) return null;
  return (
    <div
      key={toastState.id}
      role="status"
      className="fixed top-16 left-1/2 -translate-x-1/2 z-[60] px-4 py-2.5 rounded-2xl bg-stone-900 text-white text-xs sm:text-sm font-bold shadow-xl text-center max-w-[90vw]"
    >
      {toastState.msg}
    </div>
  );
}
