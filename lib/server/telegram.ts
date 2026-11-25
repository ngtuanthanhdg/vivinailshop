import { formatVND } from '@/lib/format';
import type { Order, Settings } from '@/lib/types';

export function escapeHtml(text: unknown): string {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** Gửi tin nhắn Telegram từ máy chủ (token bot không bao giờ lộ ra trình duyệt khách). */
export async function sendTelegramMessage(token: string, chatId: string, text: string): Promise<boolean> {
  const t = (token || '').trim();
  const c = (chatId || '').trim();
  if (!t || !c) return false;
  try {
    const res = await fetch(`https://api.telegram.org/bot${t}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: c, text, parse_mode: 'HTML' }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function notifyShop(settings: Settings, text: string): Promise<boolean> {
  return sendTelegramMessage(settings.telegramToken, settings.telegramChatId, text);
}

export function buildOrderMessage(order: Order, shopName: string): string {
  const itemLines = order.items
    .map(
      (it, i) =>
        `${i + 1}. <b>${escapeHtml(it.name)}</b>${it.variantName ? ` [${escapeHtml(it.variantName)}]` : ''} — SL: ${it.qty} x ${formatVND(it.unitPrice)} = <b>${formatVND(it.qty * it.unitPrice)}</b>`,
    )
    .join('\n');

  return [
    `🛍️ <b>ĐƠN HÀNG MỚI #${order.id}</b> — ${escapeHtml(shopName)}`,
    `👤 Khách: <b>${escapeHtml(order.customerName)}</b> (${escapeHtml(order.phone)})`,
    `📍 Địa chỉ: ${escapeHtml(order.address)}`,
    `🚚 Vận chuyển: ${escapeHtml(order.shippingMethod)}`,
    `💳 Thanh toán: ${escapeHtml(order.paymentMethod)}`,
    `------------------------`,
    itemLines,
    `------------------------`,
    `Tiền hàng: ${formatVND(order.subtotal)} | Ship: ${formatVND(order.shipFee)} | Giảm: -${formatVND(order.discount)}`,
    `💰 <b>TỔNG THU: ${formatVND(order.total)}</b>`,
    order.note ? `📝 Ghi chú: ${escapeHtml(order.note)}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
