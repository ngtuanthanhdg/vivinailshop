/**
 * Khung xương (skeleton) hiện ngay khi trang đang tải dữ liệu từ database.
 * Bố cục khớp với trang thật để lúc dữ liệu về không bị "nhảy" giao diện.
 */

export function Bone({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton ${className}`} style={style} />;
}

export function ProductCardSkeleton() {
  return (
    <div className="bg-white/90 rounded-3xl p-2.5 sm:p-3 border flex flex-col" style={{ borderColor: 'var(--border-soft)' }}>
      <Bone className="aspect-square rounded-2xl mb-2.5" />
      <Bone className="h-2.5 w-1/3 rounded-full" />
      <Bone className="h-3.5 w-11/12 rounded-full mt-2" />
      <Bone className="h-3.5 w-2/3 rounded-full mt-1.5" />
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between">
        <Bone className="h-4 w-20 rounded-full" />
        <Bone className="h-6 w-16 rounded-xl" />
      </div>
    </div>
  );
}

export default function StorefrontSkeleton() {
  return (
    <div className="min-h-screen flex flex-col pb-24" aria-busy="true" aria-label="Đang tải cửa hàng">
      {/* Thanh thông báo */}
      <div className="h-9 w-full" style={{ backgroundColor: 'var(--accent-main)', opacity: 0.9 }} />

      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b" style={{ borderColor: 'var(--border-soft)' }}>
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <Bone className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl" />
            <div className="space-y-1.5">
              <Bone className="h-4 w-32 sm:w-44 rounded-full" />
              <Bone className="h-2.5 w-24 sm:w-56 rounded-full" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <Bone className="h-8 w-9 sm:w-24 rounded-xl" />
            <Bone className="h-8 w-9 sm:w-20 rounded-xl" />
            <Bone className="h-8 w-20 sm:w-24 rounded-xl" />
            <Bone className="h-8 w-9 sm:w-20 rounded-xl" />
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl w-full mx-auto px-3 sm:px-6 pt-4 space-y-6">
        {/* Khu hàng Order */}
        <section className="rounded-3xl p-4 sm:p-5 border" style={{ backgroundColor: 'var(--bg-soft)', borderColor: 'var(--border-soft)' }}>
          <div className="flex items-center justify-between mb-3 gap-2">
            <div className="space-y-1.5">
              <Bone className="h-4 w-56 rounded-full" />
              <Bone className="h-2.5 w-44 rounded-full" />
            </div>
            <Bone className="h-7 w-28 rounded-xl" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5 sm:gap-3">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className={`bg-white rounded-2xl p-2 border ${i >= 2 ? 'max-sm:hidden' : ''} ${i >= 3 ? 'max-md:hidden' : ''}`}>
                <Bone className="aspect-square rounded-xl mb-2" />
                <Bone className="h-3 w-full rounded-full" />
                <Bone className="h-3 w-1/2 rounded-full mt-1.5" />
              </div>
            ))}
          </div>
        </section>

        {/* Tìm kiếm & danh mục */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-2.5">
            <Bone className="h-10 flex-1 rounded-2xl" />
            <div className="flex gap-2">
              <Bone className="h-10 w-40 rounded-2xl" />
              <Bone className="h-10 w-28 rounded-2xl" />
            </div>
          </div>
          <div className="flex gap-2 overflow-hidden py-1">
            {[64, 104, 92, 84, 72, 96, 112, 88].map((w, i) => (
              <Bone key={i} className="h-8 rounded-2xl shrink-0" style={{ width: w }} />
            ))}
          </div>
        </section>

        {/* Lưới sản phẩm */}
        <section className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }, (_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </section>
      </main>
    </div>
  );
}
