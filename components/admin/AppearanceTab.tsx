'use client';

import { useRef } from 'react';
import { BG_PATTERNS, BG_SWATCHES, FALLING_ICON_STYLES, FONT_OPTIONS, THEME_PRESETS } from '@/lib/constants';
import { getFallingSet } from '@/lib/falling';
import FallingShape from '../storefront/FallingShape';
import type { ShopState } from '@/lib/types';
import { useShop } from '../ShopProvider';

const activeChip = 'bg-amber-100 border-amber-500 text-amber-950';
const idleChip = 'bg-white hover:bg-stone-50';

export default function AppearanceTab() {
  const { adminState, saveSettings, previewSettings, toast } = useShop();
  const settings = (adminState as ShopState).settings;
  const colorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function selectTheme(id: string) {
    const preset = THEME_PRESETS.find((t) => t.id === id);
    if (!preset) return;
    if (await saveSettings({ themePreset: id, customBgColor: preset.bgMain })) toast(`🎨 Đã áp dụng theme: ${preset.name}`);
  }

  async function applyBgColor(hex: string) {
    if (await saveSettings({ customBgColor: hex })) toast('🎨 Đã đổi màu nền cửa hàng!');
  }

  // Kéo bảng chọn màu: xem trước ngay, chỉ lưu khi dừng kéo.
  function onCustomColor(hex: string) {
    previewSettings({ customBgColor: hex });
    if (colorTimer.current) clearTimeout(colorTimer.current);
    colorTimer.current = setTimeout(() => void applyBgColor(hex), 500);
  }

  async function selectPattern(id: string) {
    if (await saveSettings({ bgPattern: id })) toast('✨ Đã cập nhật hoạ tiết nền!');
  }

  async function toggleFalling(checked: boolean) {
    if (await saveSettings({ fallingEnabled: checked })) {
      toast(checked ? '🎊 Đã bật hiệu ứng icon rơi!' : '⏸️ Đã tắt hiệu ứng icon rơi!');
    }
  }

  async function selectFallingStyle(id: string) {
    if (await saveSettings({ fallingStyle: id, fallingEnabled: true })) toast('✨ Đã đổi kiểu icon rơi!');
  }

  async function selectFont(value: string) {
    if (await saveSettings({ fontFamily: value })) toast('🔤 Đã đổi phông chữ!');
  }

  const currFalling = settings.fallingStyle || 'auto';

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-extrabold">🎀 Bộ Sưu Tập Theme Cute, Bánh Kẹo, Cổ Tích & Tone Tối</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {THEME_PRESETS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTheme(t.id)}
              className={`p-2.5 rounded-2xl border text-left text-xs font-bold flex items-center justify-between gap-1 transition ${
                settings.themePreset === t.id ? 'ring-2 ring-amber-600 bg-amber-50' : idleChip
              }`}
            >
              <span className="truncate">{t.name}</span>
              <span className="w-4 h-4 rounded-full shrink-0 border" style={{ backgroundColor: t.accent }} />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-extrabold">🎨 Bảng Màu Nền (Pastel & Tone Tối Sang Trọng)</h3>
          <label className="text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <span>Tự chọn màu:</span>
            <input
              type="color"
              defaultValue={settings.customBgColor || '#FAF5EF'}
              onChange={(e) => onCustomColor(e.target.value)}
              className="w-7 h-7 rounded cursor-pointer border"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {BG_SWATCHES.map((sw) => (
            <button
              key={sw.hex}
              type="button"
              onClick={() => applyBgColor(sw.hex)}
              className={`p-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                settings.customBgColor?.toUpperCase() === sw.hex ? activeChip : idleChip
              }`}
            >
              <span className="w-5 h-5 rounded-lg border shrink-0" style={{ backgroundColor: sw.hex }} />
              <span className="truncate">{sw.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-extrabold">✨ Hoạ Tiết Trang Trí Nền (24 Kiểu)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {BG_PATTERNS.map((pt) => (
            <button
              key={pt.id}
              type="button"
              onClick={() => selectPattern(pt.id)}
              className={`p-2 rounded-xl border text-[11px] font-bold text-left transition ${settings.bgPattern === pt.id ? activeChip : idleChip}`}
            >
              {pt.name}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-extrabold">🎊 Hiệu Ứng Icon Rơi Theo Theme</h3>
          <label className="text-xs font-bold flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.fallingEnabled !== false}
              onChange={(e) => toggleFalling(e.target.checked)}
              className="w-4 h-4"
            />
            <span>Bật icon rơi</span>
          </label>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {FALLING_ICON_STYLES.map((st) => (
            <button
              key={st.id}
              type="button"
              onClick={() => selectFallingStyle(st.id)}
              className={`p-2 rounded-xl border text-[11px] font-bold text-left transition flex items-center justify-between gap-1 ${
                currFalling === st.id ? activeChip : idleChip
              }`}
            >
              <span className="truncate">{st.name}</span>
              <span className="flex items-center gap-0.5 shrink-0">
                {getFallingSet({ fallingStyle: st.id, themePreset: settings.themePreset })
                  .slice(0, 3)
                  .map((d, i) => (
                    <span key={i} className="w-3.5 h-3.5">
                      <FallingShape shape={d.shape} color={d.colors[0]} />
                    </span>
                  ))}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <h3 className="text-sm font-extrabold">🔤 Phông Chữ Cửa Hàng</h3>
        <select
          value={FONT_OPTIONS.some((f) => f.value === settings.fontFamily) ? settings.fontFamily : FONT_OPTIONS[0].value}
          onChange={(e) => selectFont(e.target.value)}
          className="w-full sm:w-72 px-3 py-2 rounded-xl border bg-white text-xs font-bold"
        >
          {FONT_OPTIONS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
