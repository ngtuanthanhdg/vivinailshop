'use client';

import { formatVND } from '@/lib/format';
import { ORDER_STATUSES, type Order, type ShopState } from '@/lib/types';
import { useShop } from '../ShopProvider';

export default function OrdersTab() {
  const { adminState, adminRequest, openInvoice, toast } = useShop();
  const orders = (adminState as ShopState).orders;

  async function updateStatus(o: Order, status: string) {
    if (o.status === status) return;
    const res = await adminRequest('PATCH', `/api/admin/orders/${encodeURIComponent(o.id)}`, { status });
    if (res) toast(`✅ Đã cập nhật đơn #${o.id} → ${status}`);
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-extrabold">🧾 Danh Sách Đơn Đặt Hàng</h3>
      <div className="space-y-2.5 sm:max-h-[60vh] sm:overflow-y-auto sm:pr-1">
        {!orders.length ? (
          <div className="text-center py-8 text-xs text-stone-400">Chưa có đơn đặt hàng nào.</div>
        ) : (
          orders.map((o) => (
            <div key={o.id} className="p-3 rounded-2xl border bg-stone-50 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="text-xs font-extrabold text-stone-900 break-words">
                    #{o.id} • {o.customerName} ({o.phone})
                  </span>
                  <div className="text-[11px] text-stone-500">
                    {o.createdAt} • {o.shippingMethod}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 w-full sm:w-auto">
                  <select
                    value={o.status}
                    onChange={(e) => updateStatus(o, e.target.value)}
                    className="flex-1 sm:flex-none min-w-0 px-2.5 py-1.5 rounded-xl border bg-white text-xs font-bold"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => openInvoice(o)} className="px-2.5 py-1.5 rounded-xl border bg-white text-xs font-bold whitespace-nowrap shrink-0">
                    🧾 Hóa đơn
                  </button>
                </div>
              </div>
              <div className="text-xs font-extrabold" style={{ color: 'var(--accent-main)' }}>
                Tổng thu: {formatVND(o.total)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
