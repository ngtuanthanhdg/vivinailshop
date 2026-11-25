'use client';

import { SYNC_LABELS, useShop } from '../ShopProvider';

export default function AnnouncementBar() {
  const { shop, syncStatus, refreshAll, toast } = useShop();

  async function handleRefresh() {
    toast('🔄 Đang kéo dữ liệu mới nhất...');
    const ok = await refreshAll();
    toast(ok ? '✅ Đã cập nhật dữ liệu mới nhất!' : '⚠️ Chưa kết nối được máy chủ lúc này, vui lòng thử lại.');
  }

  return (
    <div
      className="text-white text-xs sm:text-sm py-2 px-3 text-center font-medium shadow-sm flex items-center justify-center gap-2 flex-wrap"
      style={{ backgroundColor: 'var(--accent-main)' }}
    >
      <span>{shop.settings.announcement}</span>
      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">{SYNC_LABELS[syncStatus]}</span>
      <button
        type="button"
        onClick={handleRefresh}
        className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-stone-900 hover:bg-stone-100 transition"
      >
        🔄 Tải lại dữ liệu
      </button>
    </div>
  );
}
