import {
  DEFAULT_CATEGORIES,
  DEFAULT_SETTINGS,
  FONT_OPTIONS,
  ORDER_CATEGORY,
  PLACEHOLDER_IMG,
  THEME_PRESETS,
} from './constants';
import type { CartItem, LoyaltyGift, Product, PublicShopState, Settings, ShopState, Variant } from './types';

export function isOrderProduct(p: Pick<Product, 'isOrder' | 'category'>): boolean {
  return Boolean(p.isOrder || p.category === ORDER_CATEGORY);
}

export function stripSecrets(settings: Settings): Settings {
  return { ...settings, telegramToken: '', telegramChatId: '' };
}

export function toPublicState(state: ShopState): PublicShopState {
  return {
    categories: state.categories,
    products: state.products,
    settings: stripSecrets(state.settings),
    updatedAt: state.updatedAt,
  };
}

/** Ảnh hiển thị của 1 dòng hàng: ảnh lưu sẵn → ảnh phân loại → ảnh bìa sản phẩm → ảnh mẫu. */
export function cartItemImage(item: Pick<CartItem, 'image' | 'productId' | 'variantIdx'>, products: Product[], fallback = PLACEHOLDER_IMG): string {
  if (item.image) return item.image;
  const prod = products.find((p) => p.id === item.productId);
  const variantImg = item.variantIdx >= 0 ? prod?.variants?.[item.variantIdx]?.image : '';
  return variantImg || prod?.images?.[0] || fallback;
}

export function getThemePreset(settings: Settings) {
  return THEME_PRESETS.find((t) => t.id === settings.themePreset) || THEME_PRESETS[0];
}

export function getThemeVars(settings: Settings): Record<string, string> {
  const preset = getThemePreset(settings);
  return {
    '--bg-main': settings.customBgColor || preset.bgMain,
    '--bg-soft': preset.bgSoft,
    '--accent-main': preset.accent,
    '--text-dark': preset.dark,
    '--border-soft': preset.border,
  };
}

export function resolveFontCss(fontFamily: string): string {
  return (FONT_OPTIONS.find((f) => f.value === fontFamily) || FONT_OPTIONS[0]).css;
}

// ======================== CHUẨN HOÁ DỮ LIỆU (dùng khi nhập file sao lưu) ========================
function str(v: unknown, fallback = ''): string {
  return typeof v === 'string' ? v : v == null ? fallback : String(v);
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function normalizeVariant(raw: unknown): Variant {
  const v = (raw || {}) as Record<string, unknown>;
  return { name: str(v.name).trim(), price: Math.max(0, num(v.price)), image: str(v.image).trim() };
}

export function normalizeProduct(raw: unknown, fallbackId: string): Product {
  const p = (raw || {}) as Record<string, unknown>;
  const category = str(p.category, 'Sơn Gel') || 'Sơn Gel';
  return {
    id: str(p.id).trim() || fallbackId,
    name: str(p.name).trim(),
    category,
    price: Math.max(0, num(p.price)),
    oldPrice: Math.max(0, num(p.oldPrice)),
    comboPrice5: Math.max(0, num(p.comboPrice5)),
    comboPrice10: Math.max(0, num(p.comboPrice10)),
    inStock: p.inStock !== false,
    isOrder: Boolean(p.isOrder) || category === ORDER_CATEGORY,
    sold: Math.max(0, Math.floor(num(p.sold))),
    description: str(p.description),
    images: Array.isArray(p.images) ? p.images.map((x) => str(x)).filter(Boolean) : [],
    variants: Array.isArray(p.variants) ? p.variants.map(normalizeVariant).filter((v) => v.name) : [],
    updatedAt: num(p.updatedAt) || Date.now(),
  };
}

export function normalizeGift(raw: unknown, fallbackId: string): LoyaltyGift {
  const g = (raw || {}) as Record<string, unknown>;
  return {
    id: str(g.id).trim() || fallbackId,
    name: str(g.name).trim(),
    points: Math.max(0, Math.floor(num(g.points))),
    image: str(g.image).trim(),
  };
}

export function normalizeSettings(raw: unknown, base: Settings = DEFAULT_SETTINGS): Settings {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const merged = { ...base } as Settings;
  const stringKeys: (keyof Settings)[] = [
    'shopName', 'tagline', 'announcement', 'zaloPhone', 'shopDistrict', 'shopWard', 'logoDataUrl',
    'telegramToken', 'telegramChatId', 'themePreset', 'customBgColor', 'bgPattern', 'fallingStyle', 'fontFamily',
  ];
  for (const key of stringKeys) {
    if (key in s) (merged[key] as string) = str(s[key]);
  }
  if ('fallingEnabled' in s) merged.fallingEnabled = s.fallingEnabled !== false;
  if (Array.isArray(s.loyaltyGifts)) {
    merged.loyaltyGifts = s.loyaltyGifts.map((g, i) => normalizeGift(g, `G${i + 1}`)).filter((g) => g.name);
  }
  return merged;
}

export function createInitialCategories(): string[] {
  return [...DEFAULT_CATEGORIES];
}
