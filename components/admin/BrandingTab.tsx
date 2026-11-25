'use client';

import { useState } from 'react';
import { HANOI_DISTRICTS } from '@/lib/constants';
import { compressImageFile } from '@/lib/image';
import type { ShopState } from '@/lib/types';
import { useShop } from '../ShopProvider';

const inputClass = 'px-3 py-2 rounded-xl border bg-white text-xs sm:text-sm';

function firstWard(district: string): string {
  return Object.keys(HANOI_DISTRICTS[district]?.wards || {})[0] || '';
}

export default function BrandingTab() {
  const { adminState, saveSettings, adminRequest, toast } = useShop();
  const settings = (adminState as ShopState).settings;

  const [shopName, setShopName] = useState(settings.shopName);
  const [tagline, setTagline] = useState(settings.tagline);
  const [zaloPhone, setZaloPhone] = useState(settings.zaloPhone);
  const [announcement, setAnnouncement] = useState(settings.announcement);
  const [district, setDistrict] = useState(HANOI_DISTRICTS[settings.shopDistrict] ? settings.shopDistrict : 'Đống Đa');
  const [ward, setWard] = useState(() =>
    HANOI_DISTRICTS[district]?.wards[settings.shopWard] ? settings.shopWard : firstWard(district),
  );
  const [teleToken, setTeleToken] = useState(settings.telegramToken);
  const [teleChatId, setTeleChatId] = useState(settings.telegramChatId);
  const [shareLink] = useState(() => (typeof window !== 'undefined' ? `${window.location.origin}${window.location.pathname}` : ''));

  function copyShareLink() {
    navigator.clipboard?.writeText(shareLink).catch(() => {});
    toast('📋 Đã sao chép link cửa hàng!');
  }

  async function handleLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const logoDataUrl = await compressImageFile(file, 400, 0.85);
    if (await saveSettings({ logoDataUrl })) toast('🖼️ Đã cập nhật Logo cửa hàng!');
  }

  async function saveAll() {
    const ok = await saveSettings({
      shopName: shopName.trim() || 'ViVi NailShop',
      tagline: tagline.trim(),
      zaloPhone: zaloPhone.trim(),
      announcement: announcement.trim(),
      shopDistrict: district,
      shopWard: ward,
      telegramToken: teleToken.trim(),
      telegramChatId: teleChatId.trim(),
    });
    if (ok) toast('✅ Đã lưu & đồng bộ thông tin cửa hàng!');
  }

  async function testBot() {
    if (!teleToken.trim() || !teleChatId.trim()) {
      toast('⚠️ Vui lòng nhập Bot Token và Chat ID trước!');
      return;
    }
    const res = await adminRequest<{ telegramOk: boolean }>('POST', '/api/admin/telegram-test', {
      token: teleToken,
      chatId: teleChatId,
    });
    if (res) toast(res.telegramOk ? '🎉 Đã gửi tin nhắn thử tới Telegram!' : '❌ Không gửi được, kiểm tra lại Token & Chat ID!');
  }

  return (
    <div className="space-y-4">
      <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 space-y-2">
        <h3 className="text-sm font-extrabold text-emerald-900">🔗 Link Cửa Hàng (Mọi thiết bị tự đồng bộ)</h3>
        <p className="text-[11px] text-emerald-800">
          Dữ liệu được lưu trên máy chủ nên mọi điện thoại/máy tính mở link dưới đây đều thấy sản phẩm, đơn hàng mới nhất — không cần mã đồng bộ.
        </p>
        <div className="flex gap-2">
          <input type="text" readOnly value={shareLink} className="flex-1 min-w-0 px-3 py-2 rounded-xl border bg-white text-xs font-mono text-stone-700" />
          <button type="button" onClick={copyShareLink} className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-700 text-white shrink-0">
            📋 Sao chép link
          </button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-stone-50 border space-y-3">
        <h3 className="text-sm font-extrabold">🏪 Thông Tin Cửa Hàng & Địa Chỉ Xuất Phát Grab Hà Nội</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)} placeholder="Tên cửa hàng" className={inputClass} />
          <input type="text" value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Khẩu hiệu mô tả ngắn" className={inputClass} />
          <input type="text" value={zaloPhone} onChange={(e) => setZaloPhone(e.target.value)} placeholder="SĐT Zalo nhận đơn" className={inputClass} />
          <label className="px-3 py-2 rounded-xl border bg-white text-xs font-bold cursor-pointer flex items-center justify-center">
            🖼️ Tải ảnh Logo Shop từ máy
            <input type="file" accept="image/*" onChange={handleLogo} className="hidden" />
          </label>
        </div>
        <input
          type="text"
          value={announcement}
          onChange={(e) => setAnnouncement(e.target.value)}
          placeholder="Dòng thông báo chạy trên cùng..."
          className={`w-full ${inputClass}`}
        />

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="text-[11px] font-bold text-stone-600">Quận xuất phát của Shop (Hà Nội):</label>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setWard(firstWard(e.target.value));
              }}
              className="w-full mt-1 px-3 py-2 rounded-xl border bg-white text-xs"
            >
              {Object.keys(HANOI_DISTRICTS).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[11px] font-bold text-stone-600">Phường xuất phát của Shop:</label>
            <select value={ward} onChange={(e) => setWard(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border bg-white text-xs">
              {Object.keys(HANOI_DISTRICTS[district]?.wards || {}).map((w) => (
                <option key={w} value={w}>
                  {w}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-sky-50/70 border border-sky-200 space-y-3">
        <h3 className="text-sm font-extrabold text-sky-900">🤖 Cấu Hình Bot Telegram Báo Đơn Tự Động</h3>
        <p className="text-[11px] text-sky-800">Token chỉ lưu trên máy chủ, khách xem web không thấy được.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            value={teleToken}
            onChange={(e) => setTeleToken(e.target.value)}
            placeholder="Bot Token (từ @BotFather)"
            className="px-3 py-2 rounded-xl border bg-white text-xs"
          />
          <input
            type="text"
            value={teleChatId}
            onChange={(e) => setTeleChatId(e.target.value)}
            placeholder="Chat ID / Group ID nhận thông báo"
            className="px-3 py-2 rounded-xl border bg-white text-xs"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={saveAll} className="px-4 py-2.5 rounded-xl text-xs font-bold text-white" style={{ backgroundColor: 'var(--accent-main)' }}>
            💾 Lưu Cài Đặt
          </button>
          <button type="button" onClick={testBot} className="px-4 py-2.5 rounded-xl text-xs font-bold bg-sky-600 text-white">
            🧪 Gửi tin thử Telegram
          </button>
        </div>
      </div>
    </div>
  );
}
