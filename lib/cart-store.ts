import type { CartItem } from './types';

// Giỏ hàng lưu trong localStorage của trình duyệt (dùng với useSyncExternalStore).
const KEY = 'vivi_nailshop_cart_v1';
const EMPTY: CartItem[] = [];
const listeners = new Set<() => void>();
let cache: CartItem[] | null = null;

function sanitize(raw: unknown): CartItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((i) => i && typeof i === 'object' && typeof i.productId === 'string' && Number(i.qty) > 0)
    .map((i) => ({
      productId: String(i.productId),
      name: String(i.name || ''),
      variantIdx: Number.isInteger(i.variantIdx) ? i.variantIdx : -1,
      variantName: String(i.variantName || ''),
      qty: Math.floor(Number(i.qty)),
      image: typeof i.image === 'string' && !i.image.startsWith('data:') ? i.image : '',
      unitPrice: Number(i.unitPrice || 0),
    }));
}

function read(): CartItem[] {
  if (cache) return cache;
  try {
    cache = sanitize(JSON.parse(localStorage.getItem(KEY) || '[]'));
  } catch {
    cache = [];
  }
  return cache;
}

export function getCartSnapshot(): CartItem[] {
  return read();
}

export function getServerCartSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeCart(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      callback();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

export function setCart(updater: CartItem[] | ((prev: CartItem[]) => CartItem[])): void {
  const next = typeof updater === 'function' ? updater(read()) : updater;
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // hết dung lượng: vẫn giữ trong bộ nhớ
  }
  listeners.forEach((l) => l());
}
