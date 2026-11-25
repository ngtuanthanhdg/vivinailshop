'use client';

export function ModalOverlay({
  children,
  zIndex = 'z-40',
  dark = false,
  padding = 'p-3 sm:p-5',
  hidden = false,
}: {
  children: React.ReactNode;
  zIndex?: string;
  dark?: boolean;
  padding?: string;
  /** Ẩn nhưng vẫn giữ nguyên dữ liệu đang nhập trong modal. */
  hidden?: boolean;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-hidden={hidden || undefined}
      className={`fixed inset-0 ${zIndex} ${dark ? 'bg-black/60' : 'bg-black/50'} backdrop-blur-xs items-center justify-center ${padding} ${hidden ? 'hidden' : 'flex'}`}
    >
      {children}
    </div>
  );
}

export function CloseButton({ onClick, className = '' }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Đóng"
      className={`w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 font-bold text-stone-700 flex items-center justify-center ${className}`}
    >
      ✕
    </button>
  );
}
