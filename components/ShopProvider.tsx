'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { apiFetch, ApiError } from '@/lib/api';
import { getCartSnapshot, getServerCartSnapshot, setCart, subscribeCart } from '@/lib/cart-store';
import { priceCartItems } from '@/lib/pricing';
import { getThemeVars, toPublicState } from '@/lib/shop';
import type { AdminRole, CartItem, Order, Product, PublicShopState, Settings, ShopState } from '@/lib/types';

export type SyncStatus = 'online' | 'syncing' | 'saving' | 'offline';

export const SYNC_LABELS: Record<SyncStatus, string> = {
  online: '☁️ Trực tuyến • Đã đồng bộ mọi thiết bị',
  syncing: '🔄 Đang tải dữ liệu mới nhất...',
  saving: '🔄 Đang lưu lên máy chủ...',
  offline: '⚠️ Mất kết nối máy chủ • Đang thử lại...',
};

/** Quản trị cần thấy đơn mới gần như ngay lập tức; khách xem shop thì 10 giây là đủ (đỡ tải database). */
const ADMIN_POLL_MS = 4000;
const PUBLIC_POLL_MS = 10000;

interface AdminSession {
  role: AdminRole;
  pin: string;
}

interface ShopContextValue {
  shop: PublicShopState;
  syncStatus: SyncStatus;
  refreshAll: () => Promise<boolean>;

  cart: CartItem[];
  addToCart: (product: Product, variantIdx: number, qty: number) => void;
  updateCartQty: (idx: number, delta: number) => void;
  clearCart: () => void;

  toast: (msg: string) => void;
  toastState: { msg: string; id: number } | null;

  detailProductId: string | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  track: { open: boolean; phone: string; nonce: number };
  openTrack: (phone?: string) => void;
  closeTrack: () => void;
  invoiceOrder: Order | null;
  openInvoice: (order: Order) => void;
  closeInvoice: () => void;
  loyaltyOpen: boolean;
  setLoyaltyOpen: (open: boolean) => void;
  adminOpen: boolean;
  setAdminOpen: (open: boolean) => void;

  admin: AdminSession | null;
  adminState: ShopState | null;
  loginAdmin: (pin: string) => Promise<boolean>;
  logoutAdmin: () => void;
  /** Gọi API quản trị; nếu kết quả là dữ liệu cửa hàng thì tự cập nhật giao diện. Trả null khi lỗi (đã báo toast). */
  adminRequest: <T = ShopState>(method: string, url: string, body?: unknown) => Promise<T | null>;
  previewSettings: (partial: Partial<Settings>) => void;
  saveSettings: (partial: Partial<Settings>) => Promise<boolean>;
}

const ShopContext = createContext<ShopContextValue | null>(null);

export function useShop(): ShopContextValue {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error('useShop phải nằm trong <ShopProvider>');
  return ctx;
}

function isShopState(data: unknown): data is ShopState {
  return Boolean(data && typeof data === 'object' && Array.isArray((data as ShopState).products) && Array.isArray((data as ShopState).orders));
}

export function ShopProvider({ initialData, children }: { initialData: PublicShopState; children: React.ReactNode }) {
  const [shop, setShop] = useState<PublicShopState>(initialData);
  const [adminState, setAdminState] = useState<ShopState | null>(null);
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('online');
  const [toastState, setToastState] = useState<{ msg: string; id: number } | null>(null);

  const [detailProductId, setDetailProductId] = useState<string | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [track, setTrack] = useState({ open: false, phone: '', nonce: 0 });
  const [invoiceOrder, setInvoiceOrder] = useState<Order | null>(null);
  const [loyaltyOpen, setLoyaltyOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);

  // Refs để vòng lặp đồng bộ luôn đọc giá trị mới nhất.
  const latestUpdatedAt = useRef(initialData.updatedAt);
  const adminRef = useRef<AdminSession | null>(null);
  const pendingWrites = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ======================== TOAST ========================
  const toast = useCallback((msg: string) => {
    setToastState({ msg, id: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastState(null), 2800);
  }, []);

  // ======================== ĐỒNG BỘ DỮ LIỆU VỚI MÁY CHỦ ========================
  const applyPublic = useCallback((data: PublicShopState) => {
    if (data.updatedAt < latestUpdatedAt.current) return;
    latestUpdatedAt.current = data.updatedAt;
    setShop(data);
  }, []);

  const applyAdmin = useCallback((data: ShopState) => {
    if (data.updatedAt < latestUpdatedAt.current) return;
    latestUpdatedAt.current = data.updatedAt;
    setAdminState(data);
    setShop(toPublicState(data));
  }, []);

  const pullOnce = useCallback(
    async (force: boolean): Promise<boolean> => {
      const session = adminRef.current;
      const v = force ? '' : `?v=${latestUpdatedAt.current}`;
      try {
        if (session) {
          const data = await apiFetch<ShopState | { unchanged: true }>(`/api/admin/state${v}`, { pin: session.pin });
          if (adminRef.current?.pin !== session.pin) return true;
          if (!('unchanged' in data)) applyAdmin(data);
        } else {
          const data = await apiFetch<PublicShopState | { unchanged: true }>(`/api/shop${v}`);
          if (!('unchanged' in data)) applyPublic(data);
        }
        if (pendingWrites.current === 0) setSyncStatus('online');
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401 && session) {
          adminRef.current = null;
          setAdmin(null);
          setAdminState(null);
        }
        setSyncStatus('offline');
        return false;
      }
    },
    [applyAdmin, applyPublic],
  );

  const refreshAll = useCallback(async () => {
    setSyncStatus('syncing');
    return pullOnce(true);
  }, [pullOnce]);

  useEffect(() => {
    let lastPull = 0;
    const tick = (force = false) => {
      if (document.visibilityState !== 'visible' || pendingWrites.current !== 0) return;
      const every = adminRef.current ? ADMIN_POLL_MS : PUBLIC_POLL_MS;
      if (!force && Date.now() - lastPull < every - 200) return;
      lastPull = Date.now();
      void pullOnce(false);
    };
    const onWake = () => tick(true);
    const timer = setInterval(() => tick(), ADMIN_POLL_MS);
    document.addEventListener('visibilitychange', onWake);
    window.addEventListener('online', onWake);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onWake);
      window.removeEventListener('online', onWake);
    };
  }, [pullOnce]);

  // Đồng bộ biến màu theme lên <html> (cho nền vùng cuộn tràn) & tiêu đề tab.
  useEffect(() => {
    const vars = getThemeVars(shop.settings);
    for (const [k, v] of Object.entries(vars)) document.documentElement.style.setProperty(k, v);
    document.title = `${shop.settings.shopName || 'ViVi NailShop'} — Phụ Kiện Nail & Order Nội Địa`;
  }, [shop.settings]);

  // ======================== GIỎ HÀNG ========================
  const rawCart = useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
  const cart = useMemo(
    () => priceCartItems(rawCart.filter((i) => shop.products.some((p) => p.id === i.productId)), shop.products),
    [rawCart, shop.products],
  );

  const addToCart = useCallback((prod: Product, variantIdx: number, qty: number) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === prod.id && i.variantIdx === variantIdx);
      if (existing) return prev.map((i) => (i === existing ? { ...i, qty: i.qty + qty } : i));
      const v = variantIdx >= 0 ? prod.variants?.[variantIdx] : undefined;
      return [
        ...prev,
        { productId: prod.id, name: prod.name, variantIdx, variantName: v?.name || '', qty, image: '', unitPrice: prod.price },
      ];
    });
  }, []);

  const updateCartQty = useCallback(
    (idx: number, delta: number) => {
      const target = cart[idx];
      if (!target) return;
      setCart((prev) =>
        prev
          .map((i) => (i.productId === target.productId && i.variantIdx === target.variantIdx ? { ...i, qty: i.qty + delta } : i))
          .filter((i) => i.qty > 0),
      );
    },
    [cart],
  );

  const clearCart = useCallback(() => setCart([]), []);

  // ======================== QUẢN TRỊ ========================
  const loginAdmin = useCallback(
    async (pin: string) => {
      try {
        const { role } = await apiFetch<{ role: AdminRole }>('/api/admin/login', { method: 'POST', body: { pin } });
        const data = await apiFetch<ShopState>('/api/admin/state', { pin });
        const session = { role, pin };
        adminRef.current = session;
        setAdmin(session);
        latestUpdatedAt.current = 0;
        applyAdmin(data);
        return true;
      } catch (err) {
        toast((err as Error).message);
        return false;
      }
    },
    [applyAdmin, toast],
  );

  const logoutAdmin = useCallback(() => {
    adminRef.current = null;
    setAdmin(null);
    setAdminState(null);
  }, []);

  const adminRequest = useCallback(
    async <T,>(method: string, url: string, body?: unknown): Promise<T | null> => {
      const session = adminRef.current;
      if (!session) {
        toast('❌ Vui lòng đăng nhập quản lý trước!');
        return null;
      }
      pendingWrites.current += 1;
      setSyncStatus('saving');
      try {
        const data = await apiFetch<T>(url, { method, body, pin: session.pin });
        if (isShopState(data)) applyAdmin(data);
        return data;
      } catch (err) {
        toast((err as Error).message);
        if (err instanceof ApiError && err.status === 401) logoutAdmin();
        if (err instanceof ApiError && err.status === 0) setSyncStatus('offline');
        return null;
      } finally {
        pendingWrites.current -= 1;
        if (pendingWrites.current === 0) setSyncStatus((s) => (s === 'saving' ? 'online' : s));
      }
    },
    [applyAdmin, logoutAdmin, toast],
  );

  const previewSettings = useCallback((partial: Partial<Settings>) => {
    setShop((s) => ({ ...s, settings: { ...s.settings, ...partial } }));
    setAdminState((s) => (s ? { ...s, settings: { ...s.settings, ...partial } } : s));
  }, []);

  const saveSettings = useCallback(
    async (partial: Partial<Settings>) => {
      previewSettings(partial);
      const res = await adminRequest('PATCH', '/api/admin/settings', { settings: partial });
      if (!res) void pullOnce(true);
      return Boolean(res);
    },
    [adminRequest, previewSettings, pullOnce],
  );

  const value: ShopContextValue = {
    shop,
    syncStatus,
    refreshAll,
    cart,
    addToCart,
    updateCartQty,
    clearCart,
    toast,
    toastState,
    detailProductId,
    openDetail: setDetailProductId,
    closeDetail: () => setDetailProductId(null),
    cartOpen,
    setCartOpen,
    track,
    openTrack: (phone = '') => setTrack((t) => ({ open: true, phone, nonce: t.nonce + 1 })),
    closeTrack: () => setTrack((t) => ({ ...t, open: false })),
    invoiceOrder,
    openInvoice: setInvoiceOrder,
    closeInvoice: () => setInvoiceOrder(null),
    loyaltyOpen,
    setLoyaltyOpen,
    adminOpen,
    setAdminOpen,
    admin,
    adminState,
    loginAdmin,
    logoutAdmin,
    adminRequest,
    previewSettings,
    saveSettings,
  };

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}
