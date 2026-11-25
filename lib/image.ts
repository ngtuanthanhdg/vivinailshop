// Nén ảnh ngay trên trình duyệt thành WebP base64 trước khi gửi lên máy chủ;
// máy chủ sẽ đưa ảnh lên ImageKit và chỉ lưu đường link vào database.

function fitSize(w: number, h: number, maxDim: number): [number, number] {
  if (w > maxDim || h > maxDim) {
    if (w > h) return [maxDim, Math.round((h * maxDim) / w)];
    return [Math.round((w * maxDim) / h), maxDim];
  }
  return [w, h];
}

function drawToWebp(img: HTMLImageElement, maxDim: number, quality: number): string {
  const [w, h] = fitSize(img.width, img.height, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d')?.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/webp', quality);
}

export function compressImageFile(file: File, maxDim = 480, quality = 0.68): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      const src = String(ev.target?.result || '');
      const img = new Image();
      img.onload = () => resolve(drawToWebp(img, maxDim, quality));
      img.onerror = () => resolve(src);
      img.src = src;
    };
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

/**
 * Ảnh trên ImageKit: xin bản thu nhỏ đúng cỡ hiển thị (ImageKit tự đổi kích thước + định dạng tối ưu).
 * Ảnh không phải của ImageKit (link ngoài, base64) thì giữ nguyên.
 */
export function ikImage(src: string | undefined, width: number): string {
  if (!src || !/^https:\/\/ik\.imagekit\.io\//.test(src) || /[?&]tr=/.test(src)) return src || '';
  return `${src}${src.includes('?') ? '&' : '?'}tr=w-${Math.round(width)},q-80`;
}
