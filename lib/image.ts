// Xử lý ảnh trên trình duyệt: kiểm tra định dạng → thu nhỏ & nén WebP → tải TỪNG ẢNH lên máy chủ
// (máy chủ đưa lên ImageKit, trả về link). Form sản phẩm/cài đặt chỉ giữ đường link ảnh.

// ======================== ĐỊNH DẠNG & GIỚI HẠN ========================
/**
 * Chỉ nhận JPG, PNG, WebP: mọi trình duyệt đều đọc & nén được, ImageKit xử lý tốt.
 * iPhone: ảnh HEIC trong thư viện ảnh sẽ được iOS TỰ CHUYỂN sang JPG khi chọn (vì HEIC không có trong danh sách).
 */
export const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
export const IMAGE_FORMATS_LABEL = 'JPG, PNG, WebP';
/** Dung lượng tối đa của ảnh GỐC chọn từ máy (trước khi nén). */
export const MAX_IMAGE_MB = 50;

/** Cỡ ảnh được lưu cho từng mục: cạnh dài tối đa (px) & chất lượng nén. ImageKit tự thu nhỏ thêm khi hiển thị. */
export const IMAGE_PRESETS = {
  product: { maxDim: 1600, quality: 0.85, folder: 'products' },
  variant: { maxDim: 1000, quality: 0.82, folder: 'products' },
  gift: { maxDim: 800, quality: 0.82, folder: 'gifts' },
  logo: { maxDim: 512, quality: 0.9, folder: 'branding' },
} as const;
export type ImagePreset = keyof typeof IMAGE_PRESETS;

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

// ======================== NÉN ẢNH ========================
function fitSize(w: number, h: number, maxDim: number): [number, number] {
  if (w > maxDim || h > maxDim) {
    if (w > h) return [maxDim, Math.round((h * maxDim) / w)];
    return [Math.round((w * maxDim) / h), maxDim];
  }
  return [w, h];
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageFileError(`⚠️ Không đọc được ảnh "${file.name}" (file có thể bị lỗi).`));
    };
    img.src = url;
  });
}

/** Kiểm tra định dạng → đọc ảnh → thu nhỏ & nén thành WebP (Blob). Ném `ImageFileError` nếu không dùng được. */
export async function compressImageToBlob(file: File, maxDim: number, quality: number): Promise<Blob> {
  const invalid = validateImageFile(file);
  if (invalid) throw new ImageFileError(invalid);
  const img = await loadImage(file);
  const [w, h] = fitSize(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDim);
  const fail = new ImageFileError(`⚠️ Không xử lý được ảnh "${file.name}", vui lòng chọn ảnh khác.`);
  if (!w || !h) throw fail;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw fail;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);
  // Trình duyệt cũ không nén được WebP sẽ tự trả về PNG — máy chủ vẫn nhận.
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  if (!blob || !blob.size) throw fail;
  return blob;
}

// ======================== TẢI ẢNH LÊN MÁY CHỦ ========================
/**
 * Nén rồi tải 1 ảnh lên (máy chủ → ImageKit), trả về link ảnh.
 * Mỗi ảnh là 1 lần gửi riêng nên không bị giới hạn tổng dung lượng khi lưu sản phẩm nhiều ảnh.
 */
export async function uploadImageFile(file: File, preset: ImagePreset, pin: string, name = ''): Promise<string> {
  const { maxDim, quality, folder } = IMAGE_PRESETS[preset];
  const blob = await compressImageToBlob(file, maxDim, quality);
  const form = new FormData();
  form.append('file', blob, 'anh.webp');
  form.append('folder', folder);
  form.append('name', name || file.name.replace(/\.[^.]+$/, ''));

  let res: Response;
  try {
    res = await fetch('/api/admin/images/upload', { method: 'POST', headers: { 'x-admin-pin': pin }, body: form });
  } catch {
    throw new ImageFileError('⚠️ Không kết nối được máy chủ, vui lòng kiểm tra mạng rồi thử lại!');
  }
  const data = (await res.json().catch(() => null)) as { url?: string; error?: string } | null;
  if (!res.ok || !data?.url) {
    throw new ImageFileError(data?.error || `⚠️ Tải ảnh "${file.name}" thất bại (lỗi ${res.status}), vui lòng thử lại!`);
  }
  return data.url;
}

/**
 * Tải nhiều ảnh, tối đa `concurrency` ảnh cùng lúc. Gọi `onDone` mỗi khi xong 1 ảnh (để cập nhật tiến độ).
 * Trả về link theo đúng thứ tự đã chọn; ảnh lỗi được gom vào `errors`.
 */
export async function uploadImageFiles(
  files: File[],
  preset: ImagePreset,
  pin: string,
  onDone?: (done: number, total: number) => void,
  concurrency = 3,
): Promise<{ urls: string[]; errors: string[] }> {
  const results: Array<string | null> = new Array(files.length).fill(null);
  const errors: string[] = [];
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      try {
        results[i] = await uploadImageFile(files[i], preset, pin);
      } catch (err) {
        errors.push(imageErrorMessage(err));
      }
      onDone?.(++done, files.length);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
  return { urls: results.filter((u): u is string => Boolean(u)), errors };
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
