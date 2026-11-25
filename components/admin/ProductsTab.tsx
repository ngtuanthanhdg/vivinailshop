'use client';

import { useRef, useState } from 'react';
import { ORDER_CATEGORY } from '@/lib/constants';
import { formatVND } from '@/lib/format';
import { IMAGE_ACCEPT, IMAGE_FORMATS_LABEL, ikImage, imageErrorMessage, isHttpImageUrl, MAX_IMAGE_MB, uploadImageFile, uploadImageFiles } from '@/lib/image';
import { isOrderProduct } from '@/lib/shop';
import type { Product, ShopState } from '@/lib/types';
import { SYNC_LABELS, useShop } from '../ShopProvider';

interface VariantRow {
  key: number;
  name: string;
  price: string;
  image: string;
}

interface ProductForm {
  editId: string;
  name: string;
  category: string;
  price: string;
  oldPrice: string;
  combo5: string;
  combo10: string;
  inStock: boolean;
  isOrder: boolean;
  description: string;
  album: string[];
  variants: VariantRow[];
}

let rowSeq = 0;
const nextRowKey = () => ++rowSeq;

function emptyForm(category: string): ProductForm {
  return {
    editId: '',
    name: '',
    category,
    price: '',
    oldPrice: '',
    combo5: '',
    combo10: '',
    inStock: true,
    isOrder: false,
    description: '',
    album: [],
    variants: [],
  };
}

function formFromProduct(p: Product): ProductForm {
  const n = (v: number) => (v ? String(v) : '');
  return {
    editId: p.id,
    name: p.name || '',
    category: p.category,
    price: n(p.price),
    oldPrice: n(p.oldPrice),
    combo5: n(p.comboPrice5),
    combo10: n(p.comboPrice10),
    inStock: p.inStock !== false,
    isOrder: isOrderProduct(p),
    description: p.description || '',
    album: Array.isArray(p.images) ? [...p.images] : [],
    variants: (p.variants || []).map((v) => ({ key: nextRowKey(), name: v.name, price: v.price ? String(v.price) : '', image: v.image || '' })),
  };
}

const inputClass = 'px-3 py-2 rounded-xl border bg-white text-xs sm:text-sm';

export default function ProductsTab() {
  const { adminState, admin, syncStatus, adminRequest, refreshAll, toast } = useShop();
  const state = adminState as ShopState;
  const isOwner = admin?.role === 'owner';

  const categoryOptions = state.categories.filter((c) => c !== 'Tất cả');
  if (!categoryOptions.includes(ORDER_CATEGORY)) categoryOptions.push(ORDER_CATEGORY);

  const [form, setForm] = useState<ProductForm>(() => emptyForm(categoryOptions[0] || 'Sơn Gel'));
  const [expanded, setExpanded] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  /** Đang tải ảnh lên: { xong, tổng } — khoá nút Lưu để không lưu thiếu ảnh. */
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const formCategories = form.category && !categoryOptions.includes(form.category) ? [...categoryOptions, form.category] : categoryOptions;
  const update = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));

  // ======================== FORM SẢN PHẨM ========================
  function resetForm() {
    setForm(emptyForm(categoryOptions[0] || 'Sơn Gel'));
    setImageUrl('');
  }

  function editProduct(p: Product) {
    setForm(formFromProduct(p));
    setImageUrl('');
    setExpanded(true);
    requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
  }

  async function handleAlbumUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    if (!admin) return;
    // Mỗi ảnh được nén (1600px) rồi tải thẳng lên ImageKit ngay; album chỉ giữ đường link.
    setUploading({ done: 0, total: files.length });
    toast(`☁️ Đang tải ${files.length} ảnh lên...`);
    const { urls, errors } = await uploadImageFiles(files, 'product', admin.pin, (done, total) => setUploading({ done, total }));
    setUploading(null);
    if (urls.length) setForm((f) => ({ ...f, album: [...f.album, ...urls] }));
    if (!errors.length) toast(`✅ Đã thêm ${urls.length} ảnh vào album!`);
    else if (errors.length === 1 && !urls.length) toast(errors[0]);
    else toast(`${urls.length ? `✅ Đã thêm ${urls.length} ảnh • ` : ''}⚠️ Bỏ qua ${errors.length} ảnh lỗi (chỉ nhận ${IMAGE_FORMATS_LABEL}, tối đa ${MAX_IMAGE_MB}MB)`);
  }

  function addImageUrl() {
    const url = imageUrl.trim();
    if (!url) {
      toast('⚠️ Vui lòng dán đường dẫn ảnh trước!');
      return;
    }
    if (!isHttpImageUrl(url)) {
      toast('⚠️ Link ảnh phải bắt đầu bằng https://');
      return;
    }
    setForm((f) => ({ ...f, album: [...f.album, url] }));
    setImageUrl('');
    toast('🖼️ Đã thêm link ảnh vào album!');
  }

  function setCover(idx: number) {
    if (idx <= 0) return;
    setForm((f) => {
      const album = [...f.album];
      const [chosen] = album.splice(idx, 1);
      return { ...f, album: [chosen, ...album] };
    });
    toast('★ Đã đặt làm ảnh bìa chính!');
  }

  function removeAlbumImage(idx: number) {
    setForm((f) => ({ ...f, album: f.album.filter((_, i) => i !== idx) }));
  }

  function updateVariant(key: number, patch: Partial<VariantRow>) {
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) }));
  }

  async function handleVariantImage(key: number, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!admin) return;
    setUploading({ done: 0, total: 1 });
    toast('☁️ Đang tải ảnh phân loại lên...');
    try {
      updateVariant(key, { image: await uploadImageFile(file, 'variant', admin.pin) });
      toast('📷 Đã tải ảnh cho phân loại!');
    } catch (err) {
      toast(imageErrorMessage(err));
    } finally {
      setUploading(null);
    }
  }

  async function saveProduct() {
    if (uploading) {
      toast('⏳ Ảnh đang tải lên, đợi xong rồi lưu nhé!');
      return;
    }
    const price = Number(form.price || 0);
    if (!form.name.trim() || price <= 0) {
      toast('⚠️ Vui lòng nhập Tên sản phẩm và Giá bán lẻ hợp lệ!');
      return;
    }
    setBusy(true);
    const res = await adminRequest('POST', '/api/admin/products', {
      product: {
        id: form.editId,
        name: form.name.trim(),
        category: form.category || 'Sơn Gel',
        price,
        oldPrice: Number(form.oldPrice || 0),
        comboPrice5: Number(form.combo5 || 0),
        comboPrice10: Number(form.combo10 || 0),
        inStock: form.inStock,
        isOrder: form.isOrder,
        description: form.description.trim(),
        images: form.album,
        variants: form.variants
          .filter((v) => v.name.trim())
          .map((v) => ({ name: v.name.trim(), price: Math.max(0, Number(v.price || 0)), image: v.image.trim() })),
      },
    });
    setBusy(false);
    if (res) {
      toast(form.editId ? `✅ Đã cập nhật "${form.name.trim()}"!` : `🎉 Đã thêm mới "${form.name.trim()}"!`);
      resetForm();
    }
  }

  // ======================== DANH SÁCH SẢN PHẨM ========================
  async function toggleStock(p: Product) {
    const nextInStock = p.inStock === false;
    const res = await adminRequest('PATCH', '/api/admin/products', { updates: [{ id: p.id, inStock: nextInStock }] });
    if (res) toast(nextInStock ? `✅ "${p.name}" đã mở bán lại!` : `⏸️ "${p.name}" đã chuyển sang Tạm hết hàng!`);
  }

  async function deleteProduct(p: Product) {
    if (!window.confirm(`Xóa sản phẩm "${p.name}"?`)) return;
    const res = await adminRequest('DELETE', `/api/admin/products/${encodeURIComponent(p.id)}`);
    if (res) {
      toast(`🗑️ Đã xóa "${p.name}"!`);
      if (form.editId === p.id) resetForm();
    }
  }

  async function adjustSold(p: Product, value: string) {
    const sold = Math.max(0, Math.floor(Number(value || 0)));
    if (sold === Number(p.sold || 0)) return;
    const res = await adminRequest('PATCH', '/api/admin/products', { updates: [{ id: p.id, sold }] });
    if (res) toast(`📊 Đã cập nhật số đã bán của "${p.name}" = ${sold}`);
  }

  async function recalcSold() {
    const res = await adminRequest('POST', '/api/admin/products/recalculate-sold');
    if (res) toast('🔄 Đã tính lại toàn bộ số lượng đã bán từ danh sách đơn hàng!');
  }

  // ======================== ĐỒNG BỘ, NÉN ẢNH & SAO LƯU ========================
  async function syncNow() {
    toast('🔄 Đang tải dữ liệu mới nhất từ máy chủ...');
    const ok = await refreshAll();
    toast(ok ? '✅ Đã đồng bộ dữ liệu mới nhất!' : '⚠️ Chưa kết nối được máy chủ lúc này!');
  }

  /** Dữ liệu cũ còn ảnh base64 trong database → đưa hết lên ImageKit (chạy lại nhiều lần không sao). */
  async function migrateImages() {
    toast('☁️ Đang đưa ảnh cũ lên ImageKit, vui lòng chờ...');
    const res = await adminRequest<ShopState & { migrated: number }>('POST', '/api/admin/images/migrate');
    if (res) toast(res.migrated ? `✅ Đã chuyển ảnh của ${res.migrated} mục lên ImageKit!` : '✅ Mọi ảnh đều đã nằm trên ImageKit!');
  }

  function exportBackup() {
    const payload = {
      categories: state.categories,
      products: state.products,
      orders: state.orders,
      customers: state.customers,
      settings: state.settings,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ViViNailShop_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('⬇️ Đã tải file sao lưu dữ liệu JSON!');
  }

  async function importBackup(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let parsed: unknown;
    try {
      parsed = JSON.parse(await file.text());
    } catch {
      toast('❌ File JSON không hợp lệ!');
      return;
    }
    if (!parsed || typeof parsed !== 'object') {
      toast('❌ File JSON không hợp lệ!');
      return;
    }
    if (!window.confirm('Khôi phục sẽ thay thế dữ liệu hiện tại bằng dữ liệu trong file. Tiếp tục?')) return;
    const res = await adminRequest('POST', '/api/admin/import', parsed);
    if (res) toast('✅ Đã khôi phục & đồng bộ dữ liệu thành công!');
  }

  const kw = search.trim().toLowerCase();
  const filtered = state.products.filter(
    (p) => !kw || (p.name || '').toLowerCase().includes(kw) || (p.category || '').toLowerCase().includes(kw),
  );

  return (
    <div className="space-y-4">
      {/* Thanh trạng thái đồng bộ & sao lưu */}
      <div className="rounded-2xl p-3 border space-y-2" style={{ backgroundColor: 'var(--bg-soft)', borderColor: 'var(--border-soft)' }}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[11px] font-bold" style={{ color: 'var(--accent-main)' }}>
            {syncStatus === 'online' ? '☁️ Dữ liệu lưu trên máy chủ • Tự đồng bộ mọi thiết bị' : SYNC_LABELS[syncStatus]}
          </span>
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={syncNow} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-white" style={{ backgroundColor: 'var(--accent-main)' }}>
              ☁️ Đồng bộ ngay
            </button>
            <button type="button" onClick={migrateImages} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border">
              ☁️ Đưa ảnh lên ImageKit
            </button>
            <button type="button" onClick={exportBackup} className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border">
              ⬇️ Sao lưu JSON
            </button>
            {isOwner && (
              <label className="px-2.5 py-1.5 rounded-lg text-[11px] font-bold bg-white border cursor-pointer">
                ⬆️ Khôi phục
                <input type="file" accept=".json,application/json" onChange={importBackup} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Form Thêm / Sửa sản phẩm (Thu gọn mặc định) */}
      <div ref={formRef} className="rounded-2xl bg-stone-50 border overflow-hidden scroll-mt-4">
        <div
          onClick={() => setExpanded((x) => !x)}
          className="p-3 sm:p-4 flex items-center justify-between gap-2 cursor-pointer hover:bg-stone-100/80 transition select-none"
        >
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="text-sm font-extrabold text-stone-800 truncate">{form.editId ? `✏️ Sửa Sản Phẩm #${form.editId}` : '➕ Thêm Sản Phẩm Mới'}</h3>
            <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 whitespace-nowrap">Ấn để mở / thu gọn</span>
          </div>
          <button type="button" className="px-3 py-1.5 rounded-xl text-xs font-bold text-white shadow-xs whitespace-nowrap shrink-0" style={{ backgroundColor: 'var(--accent-main)' }}>
            {expanded ? '▲ Thu gọn' : '▼ Mở form'}
          </button>
        </div>

        {expanded && (
          <div className="p-3 sm:p-4 pt-2 border-t space-y-3">
            <div className="flex justify-end">
              <button type="button" onClick={resetForm} className="text-xs underline text-stone-500">
                Làm mới form
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <input type="text" value={form.name} onChange={(e) => update({ name: e.target.value })} placeholder="Tên sản phẩm *" className={inputClass} />
              <select value={form.category} onChange={(e) => update({ category: e.target.value })} className={`${inputClass} font-medium`}>
                {formCategories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <input type="number" min={0} value={form.price} onChange={(e) => update({ price: e.target.value })} placeholder="Giá bán (đ) *" className={inputClass} />
              <input type="number" min={0} value={form.oldPrice} onChange={(e) => update({ oldPrice: e.target.value })} placeholder="Giá gốc gạch" className={inputClass} />
              <input type="number" min={0} value={form.combo5} onChange={(e) => update({ combo5: e.target.value })} placeholder="Combo 5+ SP (đ)" className={inputClass} />
              <input type="number" min={0} value={form.combo10} onChange={(e) => update({ combo10: e.target.value })} placeholder="Combo 10+ SP (đ)" className={inputClass} />
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-bold">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.inStock} onChange={(e) => update({ inStock: e.target.checked })} className="w-4 h-4" />
                <span>✅ Còn hàng (Mở bán)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={form.isOrder} onChange={(e) => update({ isOrder: e.target.checked })} className="w-4 h-4" />
                <span>✈️ Là Hàng Order (Tách khỏi mục Tất cả)</span>
              </label>
            </div>

            {/* Album nhiều ảnh sản phẩm */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-stone-700">
                🖼️ Album ảnh sản phẩm (Chọn nhiều ảnh & bấm &quot;Đặt bìa&quot; để chọn ảnh chính):
                <span className="block sm:inline sm:ml-1 text-[11px] font-medium text-stone-400">
                  Nhận {IMAGE_FORMATS_LABEL} • tối đa {MAX_IMAGE_MB}MB/ảnh
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="px-3 py-2 rounded-xl text-xs font-bold text-white cursor-pointer" style={{ backgroundColor: 'var(--accent-main)' }}>
                  {uploading ? `⏳ Đang tải ${uploading.done}/${uploading.total}...` : '📷 Tải nhiều ảnh từ máy'}
                  <input type="file" accept={IMAGE_ACCEPT} multiple disabled={Boolean(uploading)} onChange={handleAlbumUpload} className="hidden" />
                </label>
                <div className="flex flex-1 min-w-50 gap-1.5">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addImageUrl();
                    }}
                    placeholder="Hoặc dán link ảnh URL..."
                    className="flex-1 min-w-0 px-3 py-1.5 rounded-xl border bg-white text-xs"
                  />
                  <button type="button" onClick={addImageUrl} className="px-3 py-1.5 rounded-xl text-xs font-bold bg-stone-800 text-white">
                    + Link
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 min-[420px]:grid-cols-4 sm:grid-cols-6 gap-2">
                {!form.album.length ? (
                  <div className="col-span-full text-[11px] text-stone-400 py-2">Chưa có ảnh nào trong album. Hãy tải ảnh lên hoặc thêm link ảnh.</div>
                ) : (
                  form.album.map((src, idx) => (
                    <div key={`${idx}-${src.slice(-24)}`} className="relative aspect-square rounded-xl overflow-hidden border bg-white group">
                      <img src={ikImage(src, 200)} alt={`Ảnh ${idx + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-black/60 p-1 flex items-center justify-between gap-1">
                        <button
                          type="button"
                          onClick={() => setCover(idx)}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold ${idx === 0 ? 'bg-amber-400 text-stone-950' : 'bg-white/90 text-stone-800'}`}
                        >
                          {idx === 0 ? '★ Ảnh bìa' : 'Đặt bìa'}
                        </button>
                        <button type="button" onClick={() => removeAlbumImage(idx)} className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold">
                          ✕
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Phân loại sản phẩm kèm giá & ảnh riêng */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-stone-700">🎨 Phân loại (Màu sắc / Size / Giá PL & Ảnh riêng):</span>
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, { key: nextRowKey(), name: '', price: '', image: '' }] }))}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-stone-800 text-white whitespace-nowrap shrink-0"
                >
                  + Thêm phân loại
                </button>
              </div>
              <div className="space-y-1.5">
                {form.variants.map((v) => (
                  <div key={v.key} className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-2 rounded-xl bg-white border">
                    <input
                      type="text"
                      value={v.name}
                      onChange={(e) => updateVariant(v.key, { name: e.target.value })}
                      placeholder="Tên phân loại (VD: Đỏ Cherry / Size M)"
                      className="flex-1 min-w-32.5 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                    <input
                      type="number"
                      min={0}
                      value={v.price}
                      onChange={(e) => updateVariant(v.key, { price: e.target.value })}
                      placeholder="Giá PL (đ)"
                      className="w-24 sm:w-28 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                    <input
                      type="text"
                      value={v.image}
                      onChange={(e) => updateVariant(v.key, { image: e.target.value })}
                      placeholder="Link/Data ảnh PL..."
                      className="flex-1 min-w-27.5 px-2.5 py-1.5 rounded-lg border text-xs"
                    />
                    <label className="px-2 py-1.5 rounded-lg border bg-stone-50 hover:bg-stone-100 text-[11px] font-bold cursor-pointer shrink-0">
                      📷
                      <input type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => handleVariantImage(v.key, e)} />
                    </label>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, variants: f.variants.filter((x) => x.key !== v.key) }))}
                      className="px-2 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Mô tả chi tiết công dụng, chất liệu sản phẩm..."
              className={`w-full ${inputClass}`}
            />

            <button
              type="button"
              onClick={saveProduct}
              disabled={busy}
              className="w-full py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white shadow disabled:opacity-60"
              style={{ backgroundColor: 'var(--accent-main)' }}
            >
              {busy ? '⏳ Đang lưu...' : '💾 Lưu Sản Phẩm & Đồng Bộ Lên Web'}
            </button>
          </div>
        )}
      </div>

      {/* Danh sách sản phẩm hiện có */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-extrabold">📦 Danh Sách Sản Phẩm Hiện Có</h3>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={recalcSold}
              className="px-2.5 py-1.5 rounded-xl border bg-amber-50 text-amber-900 text-[11px] font-bold hover:bg-amber-100 whitespace-nowrap shrink-0"
            >
              🔄 Tính lại số đã bán
            </button>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm nhanh SP..."
              className="px-3 py-1.5 rounded-xl border text-xs flex-1 min-w-0 sm:flex-none sm:w-44"
            />
          </div>
        </div>
        <div className="space-y-2 sm:max-h-[28rem] sm:overflow-y-auto sm:pr-1">
          {!filtered.length ? (
            <div className="text-center py-6 text-xs text-stone-400">Không có sản phẩm nào phù hợp.</div>
          ) : (
            filtered.map((p) => {
              const isOut = p.inStock === false;
              return (
                <div key={p.id} className="p-2.5 sm:p-3 rounded-2xl border bg-white flex flex-col sm:flex-row sm:items-center gap-2.5">
                  {/* Ảnh + thông tin: luôn chiếm đủ chiều ngang trên điện thoại */}
                  <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                    <img
                      src={ikImage(p.images?.[0], 120) || 'https://placehold.co/96x96/FAF5EF/7C583A?text=SP'}
                      alt={p.name}
                      loading="lazy"
                      className={`w-14 h-14 sm:w-12 sm:h-12 rounded-xl object-cover border shrink-0 ${isOut ? 'opacity-50 grayscale' : ''}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs sm:text-[13px] font-extrabold text-stone-900 leading-snug line-clamp-2 break-words">{p.name}</div>
                      <div className="flex items-center gap-1 flex-wrap mt-1">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${isOut ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}
                        >
                          {isOut ? 'Hết hàng' : 'Còn hàng'}
                        </span>
                        {isOrderProduct(p) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">ORDER</span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 truncate max-w-[10rem]">
                          {p.category}
                        </span>
                      </div>
                      <div className="flex items-baseline flex-wrap gap-x-2.5 gap-y-0.5 mt-1 text-[11px] text-stone-500">
                        <b className="text-xs text-stone-900">{formatVND(p.price)}</b>
                        {p.comboPrice5 > 0 && <span className="whitespace-nowrap">5+: {formatVND(p.comboPrice5)}</span>}
                        {p.comboPrice10 > 0 && <span className="whitespace-nowrap">10+: {formatVND(p.comboPrice10)}</span>}
                      </div>
                    </div>
                  </div>

                  {/* Thanh thao tác: hàng riêng bên dưới trên điện thoại, nằm bên phải trên máy tính */}
                  <div className="flex items-center gap-1.5 sm:shrink-0 border-t border-stone-100 pt-2 sm:border-0 sm:pt-0">
                    <label className="mr-auto sm:mr-0 flex items-center gap-1 pl-2 pr-1 py-1 rounded-xl bg-stone-50 border text-[11px] font-bold text-stone-600 whitespace-nowrap">
                      <span>Đã bán</span>
                      <input
                        key={`${p.id}-${p.sold}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        defaultValue={Number(p.sold || 0)}
                        onBlur={(e) => adjustSold(p, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.currentTarget.blur();
                        }}
                        className="w-14 px-1.5 py-0.5 rounded-lg border bg-white text-xs font-extrabold text-center"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => toggleStock(p)}
                      className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap transition active:scale-95 ${
                        isOut ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' : 'bg-stone-50 hover:bg-stone-100'
                      }`}
                    >
                      {isOut ? 'Mở bán' : 'Hết hàng'}
                    </button>
                    <button
                      type="button"
                      onClick={() => editProduct(p)}
                      className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-bold hover:bg-amber-200 transition active:scale-95"
                    >
                      Sửa
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p)}
                      className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-700 text-[11px] font-bold hover:bg-rose-200 transition active:scale-95"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
