import { HttpError, jsonError, requireRole } from '@/lib/server/http';
import { MAX_STORED_IMAGE_MB, uploadImageBytes } from '@/lib/server/imagekit';

const FOLDERS = new Set(['products', 'branding', 'gifts']);

/**
 * Tải 1 ảnh lên ImageKit ngay khi quản trị viên chọn ảnh (mỗi ảnh 1 lần gọi).
 * Nhờ vậy lúc bấm "Lưu" chỉ gửi đường link → không bị giới hạn dung lượng mỗi lần gửi (VD: Vercel ~4.5MB).
 *
 * Gửi lên dạng multipart/form-data: file (ảnh đã nén), folder (products | branding | gifts), name (gợi ý tên file).
 */
export async function POST(request: Request) {
  try {
    requireRole(request);
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new HttpError(400, '⚠️ Dữ liệu ảnh gửi lên không hợp lệ!');
    }
    const file = form.get('file');
    if (!(file instanceof Blob) || file.size === 0) throw new HttpError(400, '⚠️ Chưa có ảnh nào được gửi lên!');
    if (file.size > MAX_STORED_IMAGE_MB * 1024 * 1024) {
      throw new HttpError(413, `⚠️ Ảnh quá lớn (tối đa ${MAX_STORED_IMAGE_MB}MB sau khi nén)!`);
    }
    const folder = FOLDERS.has(String(form.get('folder'))) ? String(form.get('folder')) : 'products';
    const name = String(form.get('name') || 'anh').slice(0, 80);

    const url = await uploadImageBytes(Buffer.from(await file.arrayBuffer()), name, folder);
    return Response.json({ url });
  } catch (err) {
    return jsonError(err);
  }
}
