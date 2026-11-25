'use client';

import { useState } from 'react';
import { formatVND } from '@/lib/format';
import { ikImage } from '@/lib/image';
import { getEffectiveUnitPrice } from '@/lib/pricing';
import type { Product } from '@/lib/types';
import { useShop } from '../ShopProvider';
import { CloseButton, ModalOverlay } from './Modal';

export default function ProductDetailModal() {
  const { shop, detailProductId } = useShop();
  const product = detailProductId ? shop.products.find((p) => p.id === detailProductId) : undefined;
  if (!product) return null;
  return <DetailContent key={product.id} product={product} />;
}

function DetailContent({ product: p }: { product: Product }) {
  const { shop, closeDetail, addToCart, toast } = useShop();
  const [imageIdx, setImageIdx] = useState(0);
  const [imageOverride, setImageOverride] = useState('');
  const [variantIdx, setVariantIdx] = useState(-1);
  const [qty, setQty] = useState(1);

  const imgs = p.images?.length ? p.images : ['https://placehold.co/500x500/FAF5EF/7C583A?text=NailShop'];
  const mainImg = imageOverride || imgs[imageIdx] || imgs[0];
  const unitPrice = getEffectiveUnitPrice(p, variantIdx, qty);
  const hasVariants = Array.isArray(p.variants) && p.variants.length > 0;
  const outOfStock = p.inStock === false;

  function selectVariant(idx: number) {
    setVariantIdx(idx);
    const v = p.variants?.[idx];
    if (v?.image) {
      const found = imgs.indexOf(v.image);
      if (found >= 0) {
        setImageIdx(found);
        setImageOverride('');
      } else {
        setImageOverride(v.image);
      }
    }
  }

  function selectImage(idx: number) {
    setImageIdx(idx);
    setImageOverride('');
  }

  function handleAdd() {
    if (outOfStock) {
      toast('⚠️ Sản phẩm này hiện tạm hết hàng!');
      return;
    }
    if (hasVariants && variantIdx < 0) {
      toast('⚠️ Vui lòng chọn phân loại sản phẩm trước khi thêm vào giỏ!');
      return;
    }
    addToCart(p, variantIdx, qty);
    closeDetail();
    toast(`✅ Đã thêm ${qty} "${p.name}" vào giỏ!`);
  }

  function handleZalo() {
    if (hasVariants && variantIdx < 0) {
      toast('⚠️ Vui lòng chọn phân loại sản phẩm trước khi nhắn Zalo!');
      return;
    }
    const varName = variantIdx >= 0 && p.variants[variantIdx] ? p.variants[variantIdx].name : 'Mặc định';
    const msg = `Chào shop ${shop.settings.shopName}, mình muốn đặt:\n- SP: ${p.name}\n- Phân loại: ${varName}\n- SL: ${qty} x ${formatVND(unitPrice)} = ${formatVND(unitPrice * qty)}`;
    const zaloNum = (shop.settings.zaloPhone || '0987654321').replace(/\D/g, '');
    window.open(`https://zalo.me/${zaloNum}?text=${encodeURIComponent(msg)}`, '_blank', 'noopener');
  }

  return (
    <ModalOverlay>
      <div className="bg-white text-stone-800 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 shadow-2xl relative">
        <CloseButton onClick={closeDetail} className="absolute top-3.5 right-3.5" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2.5">
            <div className="aspect-square rounded-2xl overflow-hidden bg-stone-100 border">
              <img src={ikImage(mainImg, 800)} alt={p.name} className="w-full h-full object-cover" />
            </div>
            {imgs.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {imgs.map((src, i) => (
                  <img
                    key={i}
                    src={ikImage(src, 120)}
                    alt={`${p.name} ${i + 1}`}
                    onClick={() => selectImage(i)}
                    className={`w-14 h-14 rounded-xl object-cover border-2 cursor-pointer shrink-0 ${
                      i === imageIdx && !imageOverride ? 'border-amber-700' : 'border-transparent opacity-70'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3.5 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700">{p.category}</span>
                {outOfStock ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">Tạm hết hàng</span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700">Còn hàng</span>
                )}
              </div>

              <h2 className="text-base sm:text-xl font-extrabold text-stone-900 leading-snug pr-8">{p.name}</h2>

              <div className="p-3 rounded-2xl bg-stone-50 border space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl font-extrabold" style={{ color: 'var(--accent-main)' }}>
                    {formatVND(unitPrice)}
                  </span>
                  {p.oldPrice > unitPrice && <span className="text-xs text-stone-400 line-through">{formatVND(p.oldPrice)}</span>}
                </div>
                {(p.comboPrice5 > 0 || p.comboPrice10 > 0) && (
                  <div className="text-xs text-emerald-700 font-bold">
                    🎁 Ưu đãi mua sỉ: {p.comboPrice5 ? `Từ 5 SP còn ${formatVND(p.comboPrice5)}/SP` : ''}{' '}
                    {p.comboPrice10 ? `• Từ 10 SP còn ${formatVND(p.comboPrice10)}/SP` : ''}
                  </div>
                )}
              </div>

              {hasVariants && (
                <div className="space-y-1.5">
                  <div className="text-xs font-extrabold text-stone-700">
                    Chọn phân loại <span className="text-rose-600">* (Bắt buộc)</span>:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {p.variants.map((v, idx) => {
                      const active = variantIdx === idx;
                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => selectVariant(idx)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition ${
                            active ? 'text-white shadow' : 'bg-white text-stone-800 hover:bg-stone-50'
                          }`}
                          style={active ? { backgroundColor: 'var(--accent-main)', borderColor: 'var(--accent-main)' } : undefined}
                        >
                          {v.image && <img src={ikImage(v.image, 40)} alt="" className="w-4 h-4 rounded object-cover" />}
                          <span>{v.name}</span>
                          {v.price > 0 && <span className="opacity-85">({formatVND(v.price)})</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 pt-1">
                <span className="text-xs font-bold text-stone-700">Số lượng:</span>
                <div className="flex items-center border rounded-xl overflow-hidden bg-white">
                  <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-3 py-1.5 font-bold hover:bg-stone-100">
                    −
                  </button>
                  <span className="px-3.5 py-1.5 text-xs font-extrabold">{qty}</span>
                  <button type="button" onClick={() => setQty((q) => q + 1)} className="px-3 py-1.5 font-bold hover:bg-stone-100">
                    +
                  </button>
                </div>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed pt-1 whitespace-pre-line">{p.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-3 border-t">
              <button
                type="button"
                onClick={handleAdd}
                disabled={outOfStock}
                className="py-3 rounded-2xl font-extrabold text-xs sm:text-sm text-white shadow disabled:opacity-40"
                style={{ backgroundColor: 'var(--accent-main)' }}
              >
                🛒 Thêm vào giỏ
              </button>
              <button
                type="button"
                onClick={handleZalo}
                className="py-3 rounded-2xl font-extrabold text-xs sm:text-sm bg-sky-600 text-white shadow hover:bg-sky-700"
              >
                💬 Nhắn Zalo đặt nhanh
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModalOverlay>
  );
}
