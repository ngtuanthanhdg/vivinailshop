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
      <div className="bg-white text-stone-800 rounded-3xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
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
      <div className="flex items-center justify-between flex-wrap gap-2 border-b pb-3 pr-8">
        <div className="flex items-center gap-2">
          <h2 className="text-base sm:text-lg font-extrabold">⚙️ Quản Trị Cửa Hàng</h2>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
            {isOwner ? '👑 Chủ Shop' : '🧑‍💼 Nhân Viên'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            logoutAdmin();
            setAdminOpen(false);
            toast('Đã đăng xuất quản lý.');
          }}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-stone-100 hover:bg-stone-200"
        >
          Đăng xuất
        </button>
      </div>

      {/* Thanh Tab Quản lý */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {visibleTabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border shrink-0 ${active ? 'text-white' : ''}`}
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
