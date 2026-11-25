'use client';

import { BG_PATTERNS } from '@/lib/constants';
import { getThemeVars, resolveFontCss } from '@/lib/shop';
import type { PublicShopState } from '@/lib/types';
import AdminModal from './admin/AdminModal';
import CartModal from './modals/CartModal';
import InvoiceModal from './modals/InvoiceModal';
import LoyaltyModal from './modals/LoyaltyModal';
import ProductDetailModal from './modals/ProductDetailModal';
import TrackOrderModal from './modals/TrackOrderModal';
import { ShopProvider, useShop } from './ShopProvider';
import AnnouncementBar from './storefront/AnnouncementBar';
import FallingIcons from './storefront/FallingIcons';
import FloatingCartButton from './storefront/FloatingCartButton';
import Header from './storefront/Header';
import Storefront from './storefront/Storefront';
import Toast from './storefront/Toast';

export default function ShopApp({ initialData }: { initialData: PublicShopState }) {
  return (
    <ShopProvider initialData={initialData}>
      <ShopShell />
    </ShopProvider>
  );
}

function ShopShell() {
  const { shop } = useShop();
  const { settings } = shop;
  const patternClass = BG_PATTERNS.some((p) => p.id === settings.bgPattern && p.id !== 'none') ? settings.bgPattern : '';
  const style = {
    ...getThemeVars(settings),
    backgroundColor: 'var(--bg-main)',
    color: 'var(--text-dark)',
    fontFamily: resolveFontCss(settings.fontFamily),
  } as React.CSSProperties;

  return (
    <div className={`shop-root min-h-screen flex flex-col pb-24 ${patternClass}`} style={style}>
      <FallingIcons />
      <AnnouncementBar />
      <Header />
      <Storefront />
      <FloatingCartButton />

      <ProductDetailModal />
      <CartModal />
      <LoyaltyModal />
      <AdminModal />
      {/* Đặt sau AdminModal để nút "Xem đơn" trong trang quản trị mở đè lên trên */}
      <TrackOrderModal />
      <InvoiceModal />
      <Toast />
    </div>
  );
}
