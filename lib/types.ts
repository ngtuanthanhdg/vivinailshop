export interface Variant {
  name: string;
  price: number;
  image: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  oldPrice: number;
  comboPrice5: number;
  comboPrice10: number;
  inStock: boolean;
  isOrder: boolean;
  sold: number;
  description: string;
  images: string[];
  variants: Variant[];
  updatedAt: number;
}

export interface LoyaltyGift {
  id: string;
  name: string;
  points: number;
  image: string;
}

export interface Settings {
  shopName: string;
  tagline: string;
  announcement: string;
  zaloPhone: string;
  shopDistrict: string;
  shopWard: string;
  logoDataUrl: string;
  telegramToken: string;
  telegramChatId: string;
  themePreset: string;
  customBgColor: string;
  bgPattern: string;
  fallingEnabled: boolean;
  fallingStyle: string;
  fontFamily: string;
  loyaltyGifts: LoyaltyGift[];
}

export interface CartItem {
  productId: string;
  name: string;
  variantIdx: number;
  variantName: string;
  qty: number;
  image: string;
  unitPrice: number;
}

export const ORDER_STATUSES = [
  'Chờ xác nhận',
  'Đang chuẩn bị hàng',
  'Đang giao Grab / Ship',
  'Hoàn thành',
  'Đã hủy',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  address: string;
  shippingMethod: string;
  paymentMethod: string;
  note: string;
  items: CartItem[];
  subtotal: number;
  shipFee: number;
  discount: number;
  total: number;
  earnedPoints: number;
  status: string;
  createdAt: string;
  createdAtMs: number;
}

export interface Customer {
  phone: string;
  name: string;
  points: number;
  totalSpent: number;
  orderCount: number;
  lastAddress?: string;
}

/** Toàn bộ dữ liệu cửa hàng (chỉ máy chủ & quản trị viên thấy). */
export interface ShopState {
  categories: string[];
  products: Product[];
  orders: Order[];
  customers: Record<string, Customer>;
  settings: Settings;
  updatedAt: number;
}

/** Dữ liệu công khai cho khách xem cửa hàng (không có đơn hàng, khách hàng, token bot). */
export interface PublicShopState {
  categories: string[];
  products: Product[];
  settings: Settings;
  updatedAt: number;
}

export type AdminRole = 'owner' | 'staff';

export type ShippingMethod = 'grab' | 'standard' | 'pickup';
