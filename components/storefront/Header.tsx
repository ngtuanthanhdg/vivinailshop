'use client';

import { useShop } from '../ShopProvider';

export default function Header() {
  const { shop, openTrack, setLoyaltyOpen, setCartOpen, setAdminOpen } = useShop();
  const { settings } = shop;

  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-white/90 border-b shadow-sm" style={{ borderColor: 'var(--border-soft)' }}>
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {settings.logoDataUrl ? (
            <img
              src={settings.logoDataUrl}
              alt="Logo"
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl object-cover border shrink-0"
              style={{ borderColor: 'var(--border-soft)' }}
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center text-white font-extrabold text-lg shadow shrink-0"
              style={{ backgroundColor: 'var(--accent-main)' }}
            >
              💅
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-extrabold tracking-tight truncate text-stone-900">
              {settings.shopName || 'ViVi NailShop'}
            </h1>
            <p className="text-[11px] sm:text-xs text-stone-500 truncate">{settings.tagline}</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            type="button"
            onClick={() => openTrack()}
            className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border bg-white hover:bg-stone-50 text-stone-800 transition flex items-center gap-1"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <span>📦</span>
            <span className="hidden sm:inline">Đơn hàng</span>
          </button>
          <button
            type="button"
            onClick={() => setLoyaltyOpen(true)}
            className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold border bg-white hover:bg-stone-50 text-stone-800 transition flex items-center gap-1"
            style={{ borderColor: 'var(--border-soft)' }}
          >
            <span>🎁</span>
            <span className="hidden sm:inline">Đổi quà</span>
          </button>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="px-2.5 sm:px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition flex items-center gap-1"
            style={{ backgroundColor: 'var(--accent-main)' }}
          >
            <span>🛒</span>
            <span>Giỏ hàng</span>
          </button>
          <button
            type="button"
            onClick={() => setAdminOpen(true)}
            className="px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold bg-stone-800 text-white hover:bg-stone-700 transition flex items-center gap-1"
          >
            <span>⚙️</span>
            <span className="hidden sm:inline">Quản lý</span>
          </button>
        </div>
      </div>
    </header>
  );
}
