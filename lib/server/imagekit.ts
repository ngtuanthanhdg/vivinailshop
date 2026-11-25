import type { LoyaltyGift, Product, Settings } from '@/lib/types';
import { HttpError } from './http';

/**
 * Đưa ảnh lên ImageKit từ phía máy chủ (Private Key không bao giờ gửi xuống trình duyệt).
 *
 * Trình duyệt vẫn nén ảnh thành WebP base64 như cũ rồi gửi kèm dữ liệu; trước khi ghi vào database,
 * máy chủ tải mọi ảnh base64 lên ImageKit và chỉ lưu lại đường link https://ik.imagekit.io/...
 *
 * Nếu chưa đặt IMAGEKIT_PRIVATE_KEY thì ảnh được giữ nguyên dạng base64 (chạy thử vẫn được, nhưng DB sẽ nặng).
 */
const UPLOAD_URL = 'https://upload.imagekit.io/api/v1/files/upload';

/** Chỉ nhận JPG, PNG, WebP (khớp với lib/image.ts phía trình duyệt). SVG bị chặn vì có thể chứa mã độc. */
const EXT_BY_MIME: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
};

export function imagekitEnabled(): boolean {
  return Boolean(process.env.IMAGEKIT_PRIVATE_KEY);
}

export function isInlineImage(src: unknown): src is string {
  return typeof src === 'string' && src.startsWith('data:image/');
}

function uploadFolder(): string {
  const folder = (process.env.IMAGEKIT_FOLDER || '/vivi-nailshop').trim();
  return folder.startsWith('/') ? folder : `/${folder}`;
}

function safeFileName(name: string): string {
  const base = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'anh';
}

/** Kiểm tra "chữ ký" đầu file để chắc nội dung đúng là ảnh như khai báo (không tin mỗi phần MIME). */
function hasImageSignature(b: Buffer, mime: string): boolean {
  if (mime === 'image/png') return b.length > 8 && b.readUInt32BE(0) === 0x89504e47;
  if (mime === 'image/webp') return b.length > 12 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP';
  return b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; // JPEG
}

/** Tải 1 ảnh base64 (data:image/...;base64,...) lên ImageKit, trả về URL công khai. */
export async function uploadDataUrl(dataUrl: string, name: string, subfolder = ''): Promise<string> {
  const match = /^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i.exec(dataUrl);
  if (!match) throw new HttpError(400, '⚠️ Ảnh tải lên không hợp lệ!');
  const mime = match[1].toLowerCase();
  const ext = EXT_BY_MIME[mime];
  if (!ext) throw new HttpError(415, '⚠️ Định dạng ảnh không được hỗ trợ (chỉ nhận JPG, PNG, WebP)!');
  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > 10 * 1024 * 1024) throw new HttpError(413, '⚠️ Ảnh quá lớn (tối đa 10MB sau khi nén)!');
  if (!hasImageSignature(bytes, mime)) throw new HttpError(415, '⚠️ File ảnh không hợp lệ hoặc bị lỗi!');

  const fileName = `${safeFileName(name)}.${ext}`;
  return postToImageKit(new Blob([bytes], { type: mime }), fileName, subfolder);
}

/** Ảnh đang nằm ở trang web khác (VD: Unsplash) → nhờ ImageKit tự tải về và lưu 1 bản. */
export async function uploadRemoteUrl(url: string, name: string, subfolder = ''): Promise<string> {
  return postToImageKit(url, `${safeFileName(name)}.jpg`, subfolder);
}

export function isImageKitUrl(src: unknown): boolean {
  return typeof src === 'string' && /^https:\/\/ik\.imagekit\.io\//.test(src);
}

async function postToImageKit(file: Blob | string, fileName: string, subfolder: string): Promise<string> {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!privateKey) throw new Error('Thiếu IMAGEKIT_PRIVATE_KEY');
  const form = new FormData();
  if (typeof file === 'string') form.append('file', file);
  else form.append('file', file, fileName);
  form.append('fileName', fileName);
  form.append('folder', subfolder ? `${uploadFolder()}/${subfolder}` : uploadFolder());
  form.append('useUniqueFileName', 'true');

  let res: Response;
  try {
    res = await fetch(UPLOAD_URL, {
      method: 'POST',
      headers: { Authorization: `Basic ${Buffer.from(`${privateKey}:`).toString('base64')}` },
      body: form,
      signal: AbortSignal.timeout(30_000),
    });
  } catch (err) {
    console.error('[imagekit] không kết nối được:', err);
    throw new HttpError(502, '⚠️ Không kết nối được ImageKit, vui lòng thử lại!');
  }
  if (!res.ok) {
    console.error('[imagekit] tải ảnh thất bại', res.status, await res.text().catch(() => ''));
    const hint = res.status === 401 || res.status === 403 ? ' (sai IMAGEKIT_PRIVATE_KEY?)' : '';
    throw new HttpError(502, `⚠️ Không tải được ảnh lên ImageKit${hint}, vui lòng thử lại!`);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new HttpError(502, '⚠️ ImageKit không trả về link ảnh, vui lòng thử lại!');
  return data.url;
}

function limiter(max: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active >= max) await new Promise<void>((resolve) => waiting.push(resolve));
    active++;
    try {
      return await task();
    } finally {
      active--;
      waiting.shift()?.();
    }
  };
}

export type ImageUploader = (src: string, name: string, subfolder?: string) => Promise<string>;

let warnedDisabled = false;

/**
 * Tạo hàm "đưa ảnh lên ImageKit nếu là base64, còn link thì giữ nguyên".
 * `rehostRemote: true` → ảnh link ngoài (không phải ImageKit) cũng được chép sang ImageKit.
 * Cùng 1 ảnh xuất hiện nhiều lần chỉ tải 1 lần; tối đa `concurrency` ảnh tải song song.
 */
export function createImageUploader(concurrency = 4, { rehostRemote = false } = {}): ImageUploader {
  const cache = new Map<string, Promise<string>>();
  const run = limiter(concurrency);
  return (src, name, subfolder = '') => {
    const remote = rehostRemote && /^https?:\/\//i.test(src) && !isImageKitUrl(src);
    if (!isInlineImage(src) && !remote) return Promise.resolve(src);
    if (!imagekitEnabled()) {
      if (!warnedDisabled) {
        warnedDisabled = true;
        console.warn('[imagekit] Chưa đặt IMAGEKIT_PRIVATE_KEY → ảnh đang được lưu dạng base64 trong database.');
      }
      return Promise.resolve(src);
    }
    let pending = cache.get(src);
    if (!pending) {
      pending = run(() => (remote ? uploadRemoteUrl(src, name, subfolder) : uploadDataUrl(src, name, subfolder)));
      cache.set(src, pending);
    }
    return pending;
  };
}

export async function externalizeProductImages(p: Product, upload: ImageUploader): Promise<Product> {
  const key = p.id || p.name || 'san-pham';
  const [images, variants] = await Promise.all([
    Promise.all((p.images || []).map((img, i) => upload(img, `${key}-${i + 1}`, 'products'))),
    Promise.all(
      (p.variants || []).map(async (v, i) => ({ ...v, image: v.image ? await upload(v.image, `${key}-${v.name || `pl${i + 1}`}`, 'products') : '' })),
    ),
  ]);
  return { ...p, images, variants };
}

export async function externalizeSettingsImages<S extends Partial<Settings>>(s: S, upload: ImageUploader): Promise<S> {
  const out = { ...s };
  const [logo, gifts] = await Promise.all([
    s.logoDataUrl ? upload(s.logoDataUrl, 'logo', 'branding') : Promise.resolve(s.logoDataUrl),
    Array.isArray(s.loyaltyGifts)
      ? Promise.all(
          s.loyaltyGifts.map(async (g: LoyaltyGift) => ({ ...g, image: g.image ? await upload(g.image, `qua-${g.name || g.id}`, 'gifts') : '' })),
        )
      : Promise.resolve(undefined),
  ]);
  if ('logoDataUrl' in s) out.logoDataUrl = logo;
  if (gifts) out.loyaltyGifts = gifts;
  return out;
}
