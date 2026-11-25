import type { Order } from './types';

export function formatVND(amount: number | string | undefined | null): string {
  return Number(amount || 0).toLocaleString('vi-VN') + 'đ';
}

export function cleanPhone(phone: string | undefined | null): string {
  return String(phone || '').replace(/\D/g, '');
}

/** Khóa ngày dạng YYYY-MM-DD theo giờ của trình duyệt đang xem. */
export function getOrderDateKey(order: Pick<Order, 'createdAtMs' | 'createdAt'>): string {
  const ms = Number(order.createdAtMs || 0);
  const d = ms > 0 ? new Date(ms) : null;
  if (d && !Number.isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const raw = String(order.createdAt || '');
  const match = raw.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (match) {
    return `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}`;
  }
  return 'khong-ro';
}

export function formatDateKeyLabel(dateKey: string): string {
  if (!dateKey || dateKey === 'khong-ro') return 'Không rõ ngày';
  const parts = dateKey.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateKey;
}
