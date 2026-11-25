'use client';

import { useState } from 'react';
import { formatVND } from '@/lib/format';
import { IMAGE_ACCEPT, IMAGE_FORMATS_LABEL, imageErrorMessage, uploadImageFile } from '@/lib/image';
import type { LoyaltyGift, ShopState } from '@/lib/types';
import { useShop } from '../ShopProvider';

export default function CustomersTab() {
  const { admin, adminState, saveSettings, openTrack, toast } = useShop();
  const state = adminState as ShopState;
  const gifts = state.settings.loyaltyGifts || [];

  const [editId, setEditId] = useState('');
  const [giftName, setGiftName] = useState('');
  const [giftPoints, setGiftPoints] = useState('');
  const [giftImage, setGiftImage] = useState('');
  const [search, setSearch] = useState('');

  function resetGiftForm() {
    setEditId('');
    setGiftName('');
    setGiftPoints('');
    setGiftImage('');
  }

  function editGift(g: LoyaltyGift) {
    setEditId(g.id);
    setGiftName(g.name);
    setGiftPoints(String(g.points));
    setGiftImage(g.image || '');
  }

  async function handleGiftImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!admin) return;
    toast('☁️ Đang tải ảnh quà lên...');
    try {
      setGiftImage(await uploadImageFile(file, 'gift', admin.pin, `qua-${giftName || 'tang'}`));
      toast('📷 Đã tải ảnh quà tặng!');
    } catch (err) {
      toast(imageErrorMessage(err));
    }
  }

  async function saveGift() {
    const name = giftName.trim();
    const points = Number(giftPoints || 0);
    if (!name || points <= 0) {
      toast('⚠️ Nhập tên quà và số điểm cần đổi!');
      return;
    }
    const image = giftImage.trim();
    const next = editId
      ? gifts.map((g) => (g.id === editId ? { id: editId, name, points, image } : g))
      : [...gifts, { id: 'G' + String(Date.now()).slice(-6), name, points, image }];
    if (await saveSettings({ loyaltyGifts: next })) {
      resetGiftForm();
      toast('🎁 Đã lưu danh sách quà tặng đổi điểm!');
    }
  }

  async function deleteGift(id: string) {
    if (await saveSettings({ loyaltyGifts: gifts.filter((g) => g.id !== id) })) {
      if (editId === id) resetGiftForm();
      toast('🗑️ Đã xóa món quà!');
    }
  }

  const kw = search.trim().toLowerCase();
  const customers = Object.values(state.customers || {}).filter(
    (c) => !kw || (c.phone || '').includes(kw) || (c.name || '').toLowerCase().includes(kw),
  );

  return (
    <div className="space-y-5">
      {/* Quản lý Quà tặng đổi điểm */}
      <div className="p-4 rounded-2xl bg-stone-50 border space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold">🎁 Quản Lý Quà Tặng Đổi Điểm {editId && <span className="text-amber-700">(Đang sửa)</span>}</h3>
          <button type="button" onClick={resetGiftForm} className="text-xs underline text-stone-500">
            Thêm quà mới
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={giftName}
            onChange={(e) => setGiftName(e.target.value)}
            placeholder="Tên quà tặng *"
            className="px-3 py-2 rounded-xl border bg-white text-xs"
          />
          <input
            type="number"
            min={1}
            value={giftPoints}
            onChange={(e) => setGiftPoints(e.target.value)}
            placeholder="Số điểm cần đổi *"
            className="px-3 py-2 rounded-xl border bg-white text-xs"
          />
          <div className="flex gap-1.5">
            <input
              type="text"
              value={giftImage}
              onChange={(e) => setGiftImage(e.target.value)}
              placeholder="Link ảnh quà..."
              className="flex-1 min-w-0 px-2.5 py-2 rounded-xl border bg-white text-xs"
            />
            <label title={`Tải ảnh quà (${IMAGE_FORMATS_LABEL})`} className="px-2.5 py-2 rounded-xl border bg-white text-xs font-bold cursor-pointer shrink-0">
              📷
              <input type="file" accept={IMAGE_ACCEPT} onChange={handleGiftImage} className="hidden" />
            </label>
          </div>
        </div>
        <button type="button" onClick={saveGift} className="px-4 py-2 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent-main)' }}>
          💾 Lưu Quà Tặng
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {gifts.map((g) => (
            <div key={g.id} className="p-2.5 rounded-xl border bg-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={g.image || 'https://placehold.co/80x80/FAF5EF/7C583A?text=Qua'}
                  alt={g.name}
                  className="w-10 h-10 rounded-lg object-cover border shrink-0"
                />
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{g.name}</div>
                  <div className="text-[11px] text-amber-800 font-bold">⭐ {g.points} điểm</div>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button type="button" onClick={() => editGift(g)} className="px-2 py-1 rounded-lg bg-amber-100 text-amber-900 text-[11px] font-bold">
                  Sửa
                </button>
                <button type="button" onClick={() => deleteGift(g.id)} className="px-2 py-1 rounded-lg bg-rose-100 text-rose-700 text-[11px] font-bold">
                  Xóa
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tra cứu khách hàng */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-extrabold">👥 Danh Sách Khách Hàng & Lịch Sử Mua</h3>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo SĐT hoặc Tên..."
            className="px-3 py-1.5 rounded-xl border text-xs w-full sm:w-48"
          />
        </div>
        <div className="space-y-2 sm:max-h-80 sm:overflow-y-auto sm:pr-1">
          {!customers.length ? (
            <div className="text-center py-6 text-xs text-stone-400">Chưa có dữ liệu khách hàng phù hợp.</div>
          ) : (
            customers.map((c) => (
              <div key={c.phone} className="p-3 rounded-2xl border bg-white flex items-center justify-between gap-2">
                <div className="min-w-0 break-words">
                  <div className="text-xs font-extrabold text-stone-800">
                    {c.name} — <span className="text-amber-800">{c.phone}</span>
                  </div>
                  <div className="text-[11px] text-stone-500">
                    ⭐ <b>{c.points || 0} điểm</b> • Đã mua {c.orderCount || 0} đơn ({formatVND(c.totalSpent || 0)})
                  </div>
                </div>
                <button type="button" onClick={() => openTrack(c.phone)} className="px-2.5 py-1.5 rounded-xl border text-xs font-bold bg-stone-50 shrink-0">
                  Xem đơn
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
