import { HANOI_DISTRICTS } from './constants';
import { formatVND } from './format';
import type { CartItem, Product, Settings, ShippingMethod } from './types';

/** Giá 1 sản phẩm theo phân loại & số lượng (áp dụng giá combo 5+/10+). */
export function getEffectiveUnitPrice(prod: Product, variantIdx = -1, totalProdQty = 1): number {
  let basePrice = Number(prod.price || 0);
  if (variantIdx >= 0 && Array.isArray(prod.variants) && prod.variants[variantIdx]) {
    const vp = Number(prod.variants[variantIdx].price || 0);
    if (vp > 0) basePrice = vp;
  }
  if (totalProdQty >= 10 && Number(prod.comboPrice10 || 0) > 0) {
    return Number(prod.comboPrice10);
  }
  if (totalProdQty >= 5 && Number(prod.comboPrice5 || 0) > 0) {
    return Number(prod.comboPrice5);
  }
  return basePrice;
}

/** Tính lại đơn giá trong giỏ theo tổng số lượng của từng sản phẩm (giá combo sỉ). */
export function priceCartItems(cart: CartItem[], products: Product[]): CartItem[] {
  const prodTotals: Record<string, number> = {};
  cart.forEach((item) => {
    prodTotals[item.productId] = (prodTotals[item.productId] || 0) + item.qty;
  });
  return cart.map((item) => {
    const prod = products.find((p) => p.id === item.productId);
    if (!prod) return item;
    return { ...item, unitPrice: getEffectiveUnitPrice(prod, item.variantIdx, prodTotals[item.productId]) };
  });
}

function calcHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface GrabEstimate {
  fee: number;
  km: number;
  text: string;
}

export function calculateGrabHanoiFee(
  settings: Pick<Settings, 'shopDistrict' | 'shopWard'>,
  destDistName: string,
  destWardName: string,
): GrabEstimate {
  const shopDist = HANOI_DISTRICTS[settings.shopDistrict] || HANOI_DISTRICTS['Đống Đa'];
  const shopCoords = shopDist.wards[settings.shopWard] || [shopDist.lat, shopDist.lng];

  if (!destDistName || !HANOI_DISTRICTS[destDistName]) {
    return { fee: 25000, km: 0, text: 'Chọn Quận/Phường Hà Nội để tính cước Grab chính xác (Tạm tính 25.000đ).' };
  }
  const destDist = HANOI_DISTRICTS[destDistName];
  const destCoords =
    destWardName && destDist.wards[destWardName] ? destDist.wards[destWardName] : [destDist.lat, destDist.lng];

  const straightKm = calcHaversineKm(shopCoords[0], shopCoords[1], destCoords[0], destCoords[1]);
  const roadKm = Math.max(1.2, +(straightKm * 1.32).toFixed(1));
  const rawFee = roadKm <= 2 ? 16000 : 16000 + Math.ceil(roadKm - 2) * 5200;
  const roundedFee = Math.round(rawFee / 1000) * 1000;
  return {
    fee: roundedFee,
    km: roadKm,
    text: `🟢 Khoảng cách ~${roadKm} km từ ${settings.shopWard || settings.shopDistrict} → ${destWardName || destDistName} • Cước GrabExpress: ${formatVND(roundedFee)}`,
  };
}

export function couponDiscount(coupon: string, subtotal: number): number {
  const code = (coupon || '').trim().toUpperCase();
  if (code === 'VIVI20' && subtotal >= 150000) return 20000;
  if (code === 'VIVI50' && subtotal >= 400000) return 50000;
  return 0;
}

export interface CartTotals {
  subtotal: number;
  shipFee: number;
  discount: number;
  grandTotal: number;
  grabEstimate: GrabEstimate | null;
}

export function computeCartTotals(params: {
  items: CartItem[];
  settings: Pick<Settings, 'shopDistrict' | 'shopWard'>;
  shippingMethod: ShippingMethod;
  grabDistrict: string;
  grabWard: string;
  coupon: string;
}): CartTotals {
  const subtotal = params.items.reduce((s, i) => s + i.qty * i.unitPrice, 0);
  let shipFee = 0;
  let grabEstimate: GrabEstimate | null = null;
  if (params.shippingMethod === 'grab') {
    grabEstimate = calculateGrabHanoiFee(params.settings, params.grabDistrict, params.grabWard);
  }
  if (subtotal > 0) {
    if (params.shippingMethod === 'grab' && grabEstimate) {
      shipFee = grabEstimate.fee;
    } else if (params.shippingMethod === 'standard') {
      shipFee = subtotal >= 500000 ? 0 : 30000;
    }
  }
  const discount = couponDiscount(params.coupon, subtotal);
  const grandTotal = Math.max(0, subtotal + shipFee - discount);
  return { subtotal, shipFee, discount, grandTotal, grabEstimate };
}
