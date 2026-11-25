'use client';

import { useMemo, useState } from 'react';
import { CANCELLED_STATUS } from '@/lib/constants';
import { formatDateKeyLabel, formatVND, getOrderDateKey } from '@/lib/format';
import { cartItemImage } from '@/lib/shop';
import type { ShopState } from '@/lib/types';
import { useShop } from '../ShopProvider';

interface DayRow {
  dateKey: string;
  orderCount: number;
  itemQty: number;
  revenue: number;
}

interface ProdRow {
  productId: string;
  name: string;
  image: string;
  orderCount: number;
  soldQty: number;
  revenue: number;
}

export default function AnalyticsTab() {
  const { adminState } = useShop();
  const { orders, products } = adminState as ShopState;
  const [pickedDate, setPickedDate] = useState('');
  const [prodKw, setProdKw] = useState('');

  const stats = useMemo(() => {
    const validOrders = orders.filter((o) => o.status !== CANCELLED_STATUS);
    const filteredOrders = pickedDate ? validOrders.filter((o) => getOrderDateKey(o) === pickedDate) : validOrders;

    // 1. Thống kê doanh thu theo ngày
    const byDay: Record<string, DayRow> = {};
    for (const o of validOrders) {
      const key = getOrderDateKey(o);
      byDay[key] ??= { dateKey: key, orderCount: 0, itemQty: 0, revenue: 0 };
      byDay[key].orderCount += 1;
      byDay[key].itemQty += (o.items || []).reduce((s, it) => s + Number(it.qty || 0), 0);
      byDay[key].revenue += Number(o.total || 0);
    }
    const dayRows = Object.values(byDay)
      .filter((r) => !pickedDate || r.dateKey === pickedDate)
      .sort((a, b) => b.dateKey.localeCompare(a.dateKey));

    // 2. Thống kê số lượng đơn & số lượng bán theo sản phẩm
    const byProd: Record<string, ProdRow> = {};
    for (const o of filteredOrders) {
      const seen = new Set<string>();
      for (const it of o.items || []) {
        const pid = it.productId || it.name;
        const prod = products.find((p) => p.id === it.productId);
        const qty = Number(it.qty || 0);
        byProd[pid] ??= {
          productId: pid,
          name: prod?.name || it.name || 'Sản phẩm',
          image: cartItemImage(it, products, 'https://placehold.co/80x80/FAF5EF/7C583A?text=SP'),
          orderCount: 0,
          soldQty: 0,
          revenue: 0,
        };
        if (!seen.has(pid)) {
          byProd[pid].orderCount += 1;
          seen.add(pid);
        }
        byProd[pid].soldQty += qty;
        byProd[pid].revenue += qty * Number(it.unitPrice || prod?.price || 0);
      }
    }
    const kw = prodKw.trim().toLowerCase();
    const prodRows = Object.values(byProd)
      .filter((r) => !kw || r.name.toLowerCase().includes(kw))
      .sort((a, b) => b.soldQty - a.soldQty || b.revenue - a.revenue);

    return {
      dayRows,
      prodRows,
      totalRevenue: filteredOrders.reduce((s, o) => s + Number(o.total || 0), 0),
      totalOrders: filteredOrders.length,
      totalSold: prodRows.reduce((s, r) => s + r.soldQty, 0),
    };
  }, [orders, products, pickedDate, prodKw]);

  return (
    <div className="space-y-4">
      <div
        className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl border"
        style={{ backgroundColor: 'var(--bg-soft)', borderColor: 'var(--border-soft)' }}
      >
        <div>
          <h3 className="text-sm font-extrabold">📊 Thống Kê Doanh Thu Ngày & Đơn Theo Sản Phẩm</h3>
          <p className="text-[11px] opacity-75">Tự động tính từ các đơn hàng hợp lệ (không tính đơn &quot;Đã hủy&quot;)</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={pickedDate}
            onChange={(e) => setPickedDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border bg-white text-xs font-bold text-stone-800"
          />
          <button
            type="button"
            onClick={() => setPickedDate('')}
            className="px-2.5 py-1.5 rounded-xl border bg-white text-xs font-bold text-stone-700 hover:bg-stone-50"
          >
            Tất cả ngày
          </button>
        </div>
      </div>

      {/* Thẻ tổng quan nhanh */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        <div className="p-3 rounded-2xl border bg-white">
          <div className="text-[11px] font-bold text-stone-500">
            {pickedDate ? `Doanh thu ngày ${formatDateKeyLabel(pickedDate)}` : 'Tổng doanh thu'}
          </div>
          <div className="text-base sm:text-lg font-extrabold mt-0.5" style={{ color: 'var(--accent-main)' }}>
            {formatVND(stats.totalRevenue)}
          </div>
        </div>
        <div className="p-3 rounded-2xl border bg-white">
          <div className="text-[11px] font-bold text-stone-500">Số đơn hàng hợp lệ</div>
          <div className="text-base sm:text-lg font-extrabold text-stone-900 mt-0.5">{stats.totalOrders} đơn</div>
        </div>
        <div className="p-3 rounded-2xl border bg-white">
          <div className="text-[11px] font-bold text-stone-500">Tổng sản phẩm đã bán</div>
          <div className="text-base sm:text-lg font-extrabold text-emerald-700 mt-0.5">{stats.totalSold} món</div>
        </div>
      </div>

      {/* Bảng doanh thu theo từng ngày */}
      <div className="p-4 rounded-2xl bg-stone-50 border space-y-2.5">
        <div className="flex items-center justify-between">
          <h4 className="text-xs sm:text-sm font-extrabold text-stone-800">🗓️ Doanh Thu Theo Từng Ngày</h4>
          <span className="text-[11px] text-stone-500">Sắp xếp ngày mới nhất</span>
        </div>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {!stats.dayRows.length ? (
            <div className="text-center py-4 text-xs text-stone-400">Chưa có dữ liệu doanh thu ngày phù hợp.</div>
          ) : (
            stats.dayRows.map((d) => (
              <div key={d.dateKey} className="p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-extrabold text-stone-900">📅 {formatDateKeyLabel(d.dateKey)}</div>
                  <div className="text-[11px] text-stone-500">
                    {d.orderCount} đơn hàng • {d.itemQty} sản phẩm
                  </div>
                </div>
                <div className="text-xs sm:text-sm font-extrabold" style={{ color: 'var(--accent-main)' }}>
                  {formatVND(d.revenue)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bảng số lượng đơn & số lượng bán theo từng sản phẩm */}
      <div className="p-4 rounded-2xl bg-stone-50 border space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h4 className="text-xs sm:text-sm font-extrabold text-stone-800">📦 Số Lượng Đơn & Số Lượng Bán Theo Sản Phẩm</h4>
          <input
            type="text"
            value={prodKw}
            onChange={(e) => setProdKw(e.target.value)}
            placeholder="Lọc tên sản phẩm..."
            className="px-3 py-1 rounded-xl border bg-white text-xs w-40 sm:w-48"
          />
        </div>
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {!stats.prodRows.length ? (
            <div className="text-center py-4 text-xs text-stone-400">Chưa có dữ liệu đơn theo sản phẩm phù hợp.</div>
          ) : (
            stats.prodRows.map((r) => (
              <div key={r.productId} className="p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img src={r.image} alt={r.name} className="w-10 h-10 rounded-xl object-cover border shrink-0" />
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-stone-900 truncate">{r.name}</div>
                    <div className="text-[11px] text-stone-500">
                      Có mặt trong <b className="text-stone-800">{r.orderCount} đơn</b> • Đã bán <b className="text-emerald-700">{r.soldQty} SP</b>
                    </div>
                  </div>
                </div>
                <div className="text-xs font-extrabold text-stone-900 shrink-0">{formatVND(r.revenue)}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
