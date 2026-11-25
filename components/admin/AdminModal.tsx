'use client';

import { useState } from 'react';
import { CloseButton, ModalOverlay } from '../modals/Modal';
import { useShop } from '../ShopProvider';
import AnalyticsTab from './AnalyticsTab';
import AppearanceTab from './AppearanceTab';
import BrandingTab from './BrandingTab';
import CustomersTab from './CustomersTab';
import OrdersTab from './OrdersTab';
import ProductsTab from './ProductsTab';

type TabId = 'products' | 'customers' | 'orders' | 'branding' | 'appearance' | 'analytics';

const TABS: { id: TabId; label: string; ownerOnly?: boolean }[] = [
  { id: 'products', label: '1. Sản phẩm & Kho' },
  { id: 'customers', label: '2. Khách hàng & Quà' },
  { id: 'orders', label: '3. Đơn hàng' },
  { id: 'branding', label: '4. Shop & Bot Tele', ownerOnly: true },
  { id: 'appearance', label: '5. Theme Cute & Nền', ownerOnly: true },
  { id: 'analytics', label: '6. Doanh thu & Đơn SP' },
];

export default function AdminModal() {
  const { adminOpen, setAdminOpen, admin, adminState } = useShop();
  if (!adminOpen) return null;

  return (
    <ModalOverlay dark padding="p-2 sm:p-4">
      <div className="bg-white text-stone-800 rounded-3xl max-w-4xl w-full max-h-[94dvh] overflow-y-auto overscroll-contain p-3.5 sm:p-6 shadow-2xl relative">
        <CloseButton onClick={() => setAdminOpen(false)} className="absolute top-3.5 right-3.5" />
        {admin && adminState ? <Dashboard /> : <LoginBox />}
      </div>
    </ModalOverlay>
  );
}

function LoginBox() {
  const { loginAdmin } = useShop();
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (busy || !pin.trim()) return;
    setBusy(true);
    const ok = await loginAdmin(pin.trim());
    setBusy(false);
    if (ok) setPin('');
  }

  return (
    <div className="max-w-sm mx-auto py-8 text-center space-y-4">
      <div className="text-3xl">🔐</div>
      <h2 className="text-lg font-extrabold">Đăng Nhập Quản Lý Shop</h2>
      <p className="text-xs text-stone-500">Nhập mã PIN Chủ shop hoặc Nhân viên để vào trang quản trị</p>
      <input
        type="password"
        inputMode="numeric"
        autoComplete="current-password"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void submit();
        }}
        placeholder="Nhập mã PIN..."
        className="w-full px-4 py-3 rounded-2xl border text-center text-lg font-extrabold tracking-widest"
      />
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="w-full py-3 rounded-2xl font-bold text-white text-sm shadow disabled:opacity-60"
        style={{ backgroundColor: 'var(--accent-main)' }}
      >
        {busy ? 'Đang kiểm tra...' : 'Đăng nhập'}
      </button>
    </div>
  );
}

function Dashboard() {
  const { admin, logoutAdmin, setAdminOpen, toast } = useShop();
  const [tab, setTab] = useState<TabId>('products');
  const isOwner = admin?.role === 'owner';
  const visibleTabs = TABS.filter((t) => !t.ownerOnly || isOwner);

  return (
    <div className="space-y-4">
      <div className="flex items-center flex-wrap gap-x-2 gap-y-1.5 border-b pb-3 pr-10">
        <h2 className="text-[15px] sm:text-lg font-extrabold whitespace-nowrap">⚙️ Quản Trị Cửa Hàng</h2>
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 whitespace-nowrap">
            {isOwner ? '👑 Chủ Shop' : '🧑‍💼 Nhân Viên'}
          </span>
          <button
          type="button"
          onClick={() => {
            logoutAdmin();
            setAdminOpen(false);
            toast('Đã đăng xuất quản lý.');
          }}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200 whitespace-nowrap"
          >
            Đăng xuất
          </button>
        </div>
      </div>

      {/* Thanh Tab Quản lý */}
      <div className="sticky -top-3.5 sm:-top-6 z-10 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 py-2 bg-white/95 backdrop-blur flex gap-1.5 overflow-x-auto no-scrollbar">
        {visibleTabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={(e) => {
                setTab(t.id);
                // Cuộn thanh tab để tab vừa chọn luôn nằm trong tầm nhìn (điện thoại)
                const btn = e.currentTarget;
                btn.parentElement?.scrollTo({ left: btn.offsetLeft - 16, behavior: 'smooth' });
              }}
              className={`px-3 py-2 rounded-xl text-xs font-bold border shrink-0 whitespace-nowrap transition ${active ? 'text-white shadow-sm' : 'bg-white hover:bg-stone-50'}`}
              style={active ? { backgroundColor: 'var(--accent-main)' } : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'products' && <ProductsTab />}
      {tab === 'customers' && <CustomersTab />}
      {tab === 'orders' && <OrdersTab />}
      {tab === 'branding' && isOwner && <BrandingTab />}
      {tab === 'appearance' && isOwner && <AppearanceTab />}
      {tab === 'analytics' && <AnalyticsTab />}
    </div>
  );
}
