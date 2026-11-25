'use client';

import { useMemo, useRef, useState } from 'react';
import { ORDER_CATEGORY, PLACEHOLDER_IMG } from '@/lib/constants';
import { formatVND } from '@/lib/format';
import { ikImage } from '@/lib/image';
import { isOrderProduct } from '@/lib/shop';
import type { Product } from '@/lib/types';
import { useShop } from '../ShopProvider';

type SortValue = 'default' | 'price-asc' | 'price-desc' | 'discount-desc';

const PSEUDO_CATEGORIES = ['Tất cả', ORDER_CATEGORY, '🔥 Đang sale', '🆕 Hàng mới về'];

function filterProducts(products: Product[], category: string, keyword: string, sort: SortValue): Product[] {
  const kw = keyword.trim().toLowerCase();
  const list = products.filter((p) => {
    const isOrd = isOrderProduct(p);
    if (category === 'Tất cả' && isOrd) return false;
    if (category === ORDER_CATEGORY && !isOrd) return false;
    if (category === '🔥 Đang sale' && !(Number(p.oldPrice || 0) > Number(p.price || 0))) return false;
    if (!PSEUDO_CATEGORIES.includes(category) && p.category !== category) return false;
    if (kw && !p.name.toLowerCase().includes(kw) && !(p.description || '').toLowerCase().includes(kw)) return false;
    return true;
  });
  if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
  else if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
  else if (sort === 'discount-desc') {
    list.sort((a, b) => (b.oldPrice || b.price) - b.price - ((a.oldPrice || a.price) - a.price));
  }
  return list;
}

export default function Storefront() {
  const { shop, openDetail, addToCart, toast } = useShop();
  const [category, setCategory] = useState('Tất cả');
  const [keyword, setKeyword] = useState('');
  const [sort, setSort] = useState<SortValue>('default');
  const [perPage, setPerPage] = useState(12);
  const [page, setPage] = useState(1);
  const gridRef = useRef<HTMLDivElement>(null);

  const list = useMemo(() => filterProducts(shop.products, category, keyword, sort), [shop.products, category, keyword, sort]);
  const orderItems = useMemo(() => shop.products.filter(isOrderProduct).slice(0, 6), [shop.products]);

  const totalPages = Math.max(1, Math.ceil(list.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageItems = list.slice((currentPage - 1) * perPage, currentPage * perPage);

  function selectCategory(cat: string) {
    setCategory(cat);
    setPage(1);
  }

  function goToPage(p: number) {
    setPage(p);
    gridRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function quickAddOrOpenDetail(prod: Product) {
    if (prod.inStock === false) {
      toast('⚠️ Sản phẩm này hiện đang tạm hết hàng!');
      return;
    }
    if (Array.isArray(prod.variants) && prod.variants.length > 0) {
      openDetail(prod.id);
      toast('👉 Vui lòng chọn phân loại sản phẩm trước khi thêm!');
      return;
    }
    addToCart(prod, -1, 1);
    toast(`✅ Đã thêm "${prod.name}" vào giỏ hàng!`);
  }

  const selectClass =
    'py-2.5 rounded-2xl border bg-white/95 text-stone-800 text-xs sm:text-sm font-bold shadow-xs transition';

  return (
    <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-4 space-y-6">
      {/* Khu vực Mẫu Hàng Order Nổi Bật */}
      {orderItems.length > 0 && (
        <section
          className="rounded-3xl p-4 sm:p-5 border shadow-sm"
          style={{ backgroundColor: 'var(--bg-soft)', borderColor: 'var(--border-soft)' }}
        >
          <div className="flex items-start sm:items-center justify-between mb-3 gap-2">
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5">
                <span>✈️ Mẫu Hàng Order Nội Địa Trung / Hàn</span>
              </h2>
              <p className="text-[11px] sm:text-xs opacity-75">Hàng đặt trước 5–7 ngày về tay • Hỗ trợ cọc 50% qua Zalo</p>
            </div>
            <button
              type="button"
              onClick={() => selectCategory(ORDER_CATEGORY)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-white/90 text-stone-800 border shadow-xs hover:bg-white shrink-0 whitespace-nowrap"
            >
              <span className="hidden sm:inline">Xem tất cả Order →</span>
              <span className="sm:hidden">Xem tất cả →</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {orderItems.map((p) => (
              <div
                key={p.id}
                onClick={() => openDetail(p.id)}
                className="bg-white rounded-2xl p-2 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition duration-300 cursor-pointer flex flex-col group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-stone-100 mb-2">
                  <img
                    src={ikImage(p.images?.[0], 400) || 'https://placehold.co/300x300/FAF5EF/7C583A?text=Order'}
                    alt={p.name}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/95 text-white shadow-sm">
                    ORDER
                  </span>
                </div>
                <div className="text-xs font-bold text-stone-800 line-clamp-2 flex-1">{p.name}</div>
                <div className="text-xs font-extrabold mt-1" style={{ color: 'var(--accent-main)' }}>
                  {formatVND(p.price)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Thanh Tìm kiếm, Danh mục & Bộ lọc Giá */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <input
              type="text"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              placeholder="🔍 Tìm tên sơn gel, charm, máy hơ, dụng cụ nail..."
              className="w-full pl-4 pr-4 py-2.5 rounded-2xl border bg-white/95 text-stone-800 text-xs sm:text-sm shadow-xs transition"
              style={{ borderColor: 'var(--border-soft)' }}
            />
          </div>
          <div className="flex gap-2">
            <select
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as SortValue);
                setPage(1);
              }}
              className={`px-3.5 ${selectClass}`}
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <option value="default">Sắp xếp: Mặc định</option>
              <option value="price-asc">Giá: Thấp → Cao</option>
              <option value="price-desc">Giá: Cao → Thấp</option>
              <option value="discount-desc">🔥 Sale nhiều nhất</option>
            </select>
            <select
              value={perPage}
              onChange={(e) => {
                setPerPage(Number(e.target.value) || 12);
                setPage(1);
              }}
              className={`px-3 ${selectClass}`}
              style={{ borderColor: 'var(--border-soft)' }}
            >
              <option value={8}>8 SP/trang</option>
              <option value={12}>12 SP/trang</option>
              <option value={20}>20 SP/trang</option>
              <option value={40}>40 SP/trang</option>
            </select>
          </div>
        </div>

        {/* Thanh phân loại danh mục */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {shop.categories.map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => selectCategory(cat)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold shrink-0 border transition duration-200 active:scale-95 ${
                  active ? 'text-white shadow-sm' : 'bg-white/90 text-stone-800 hover:bg-white'
                }`}
                style={
                  active
                    ? { backgroundColor: 'var(--accent-main)', borderColor: 'var(--accent-main)' }
                    : { borderColor: 'var(--border-soft)' }
                }
              >
                {cat}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5 text-[11px] sm:text-xs opacity-80 px-1">
          <span>
            Hiển thị {pageItems.length} / {list.length} sản phẩm (Trang {currentPage}/{totalPages})
          </span>
          <span>🎁 Mua từ 5–10 SP tự động giảm giá combo sỉ</span>
        </div>
      </section>

      {/* Lưới sản phẩm */}
      <section>
        <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 scroll-mt-20">
          {pageItems.length === 0 ? (
            <div className="col-span-full py-12 text-center bg-white/80 rounded-3xl border text-sm text-stone-500">
              Không tìm thấy sản phẩm phù hợp trong mục này.
            </div>
          ) : (
            pageItems.map((p) => <ProductCard key={p.id} product={p} onOpen={() => openDetail(p.id)} onQuickAdd={() => quickAddOrOpenDetail(p)} />)
          )}
        </div>

        {/* Thanh phân trang 1, 2, 3... */}
        {pageItems.length > 0 && totalPages > 1 && (
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-6">
            <button
              type="button"
              onClick={() => goToPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold disabled:opacity-40"
            >
              ‹ Trước
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((i) => {
              const isCurr = i === currentPage;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => goToPage(i)}
                  className={`w-8 h-8 rounded-xl border text-xs font-extrabold ${isCurr ? 'text-white shadow' : 'bg-white text-stone-700'}`}
                  style={isCurr ? { backgroundColor: 'var(--accent-main)' } : undefined}
                >
                  {i}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => goToPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-xl border bg-white text-xs font-bold disabled:opacity-40"
            >
              Sau ›
            </button>
          </div>
        )}
      </section>
    </main>
  );
}

function ProductCard({ product: p, onOpen, onQuickAdd }: { product: Product; onOpen: () => void; onQuickAdd: () => void }) {
  const discountPct = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
  const outOfStock = p.inStock === false;
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;

  return (
    <div
      onClick={onOpen}
      className="bg-white rounded-3xl p-2.5 sm:p-3 border shadow-xs hover:shadow-[0_14px_32px_-16px_rgba(0,0,0,0.28)] hover:-translate-y-1 transition duration-300 cursor-pointer flex flex-col justify-between group"
      style={{ borderColor: 'var(--border-soft)' }}
    >
      <div>
        <div className="relative aspect-square rounded-2xl overflow-hidden bg-stone-100 mb-2.5">
          <img
            src={ikImage(p.images?.[0], 400) || PLACEHOLDER_IMG}
            alt={p.name}
            loading="lazy"
            decoding="async"
            className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${outOfStock ? 'opacity-50 grayscale' : ''}`}
          />
          {discountPct > 0 && (
            <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-600 text-white shadow">
              -{discountPct}%
            </span>
          )}
          {isOrderProduct(p) && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500 text-white">
              ORDER
            </span>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="px-3 py-1 rounded-full bg-stone-900 text-white text-xs font-extrabold">TẠM HẾT HÀNG</span>
            </div>
          )}
        </div>
        <div className="text-[10px] font-bold text-stone-400 uppercase tracking-wide truncate">{p.category}</div>
        <h3 className="text-xs sm:text-sm font-bold text-stone-800 line-clamp-2 mt-0.5 leading-snug">{p.name}</h3>
      </div>

      <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-1.5">
        <div className="flex items-baseline gap-1.5 flex-wrap">
          <span className="text-sm sm:text-base font-extrabold" style={{ color: 'var(--accent-main)' }}>
            {formatVND(p.price)}
          </span>
          {p.oldPrice > p.price && <span className="text-[11px] text-stone-400 line-through">{formatVND(p.oldPrice)}</span>}
        </div>
        {(p.comboPrice5 > 0 || p.comboPrice10 > 0) && (
          <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg inline-block">
            Combo 5+: {formatVND(p.comboPrice5 || p.price)} {p.comboPrice10 ? `• 10+: ${formatVND(p.comboPrice10)}` : ''}
          </div>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-[10px] text-stone-400">Đã bán {p.sold || 0}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd();
            }}
            className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-white shadow-xs hover:brightness-110 active:scale-95 transition"
            style={{ backgroundColor: 'var(--accent-main)' }}
          >
            {hasVariants ? 'Chọn loại' : '+ Giỏ hàng'}
          </button>
        </div>
      </div>
    </div>
  );
}
