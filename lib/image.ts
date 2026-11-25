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
  const out = canvas.toDataURL('image/webp', quality);
  if (!w || !h || !out.startsWith('data:image/')) throw new Error('empty image');
  return out;
}

// ======================== ĐỊNH DẠNG ẢNH ĐƯỢC PHÉP TẢI LÊN ========================
/**
 * Chỉ nhận JPG, PNG, WebP: mọi trình duyệt đều đọc & nén được, ImageKit xử lý tốt.
 * iPhone: ảnh HEIC trong thư viện ảnh sẽ được iOS TỰ CHUYỂN sang JPG khi chọn (vì HEIC không có trong danh sách).
 */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const IMAGE_FORMATS_LABEL = 'JPG, PNG, WebP';
export const MAX_IMAGE_MB = 15;

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp']);
const ALLOWED_IMAGE_EXT = /\.(jpe?g|png|webp)$/i;

/** Lỗi ảnh với thông báo tiếng Việt để hiện thẳng lên toast. */
export class ImageFileError extends Error {}

/** Trả về thông báo lỗi nếu file không hợp lệ, `null` nếu dùng được. */
export function validateImageFile(file: File): string | null {
  const type = (file.type || '').toLowerCase();
  const okType = type ? ALLOWED_IMAGE_TYPES.has(type) : ALLOWED_IMAGE_EXT.test(file.name);
  if (!okType) return `⚠️ "${file.name}" không đúng định dạng. Chỉ nhận ảnh ${IMAGE_FORMATS_LABEL}.`;
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `⚠️ "${file.name}" quá lớn (tối đa ${MAX_IMAGE_MB}MB).`;
  if (file.size === 0) return `⚠️ "${file.name}" là file rỗng.`;
  return null;
}

/** Link ảnh dán vào phải là http(s)://… */
export function isHttpImageUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/**
 * Kiểm tra định dạng → đọc ảnh → thu nhỏ & nén thành WebP (base64).
 * Ném `ImageFileError` (kèm lời nhắn dễ hiểu) nếu sai định dạng, quá lớn hoặc file hỏng.
 */
export function compressImageFile(file: File, maxDim = 480, quality = 0.68): Promise<string> {
  const invalid = validateImageFile(file);
  if (invalid) return Promise.reject(new ImageFileError(invalid));
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        resolve(drawToWebp(img, maxDim, quality));
      } catch {
        reject(new ImageFileError(`⚠️ Không xử lý được ảnh "${file.name}", vui lòng chọn ảnh khác.`));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageFileError(`⚠️ Không đọc được ảnh "${file.name}" (file có thể bị lỗi).`));
    };
    img.src = url;
  });
}

/** Lấy lời nhắn lỗi để hiện toast. */
export function imageErrorMessage(err: unknown): string {
  return err instanceof ImageFileError ? err.message : '⚠️ Không tải được ảnh, vui lòng thử lại!';
}

/**
 * Ảnh trên ImageKit: xin bản thu nhỏ đúng cỡ hiển thị (ImageKit tự đổi kích thước + định dạng tối ưu).
 * Ảnh không phải của ImageKit (link ngoài, base64) thì giữ nguyên.
 */
export function ikImage(src: string | undefined, width: number): string {
  if (!src || !/^https:\/\/ik\.imagekit\.io\//.test(src) || /[?&]tr=/.test(src)) return src || '';
  return `${src}${src.includes('?') ? '&' : '?'}tr=w-${Math.round(width)},q-80`;
}
