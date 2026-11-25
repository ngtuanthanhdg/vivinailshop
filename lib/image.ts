// Nén ảnh ngay trên trình duyệt thành WebP base64 trước khi lưu (giống bản HTML cũ).

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

export function compressDataUrlString(dataUrl: string, maxDim = 560, quality = 0.72): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) return resolve(dataUrl);
    const img = new Image();
    img.onload = () => resolve(drawToWebp(img, maxDim, quality));
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
