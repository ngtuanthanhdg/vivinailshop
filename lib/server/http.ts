import { unstable_rethrow } from 'next/navigation';
import type { AdminRole } from '@/lib/types';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function jsonError(err: unknown): Response {
  // Trả lại cho Next.js các tín hiệu nội bộ (VD: dừng prerender) thay vì coi là lỗi.
  unstable_rethrow(err);
  if (err instanceof HttpError) {
    return Response.json({ error: err.message }, { status: err.status });
  }
  console.error(err);
  return Response.json({ error: 'Lỗi máy chủ, vui lòng thử lại sau.' }, { status: 500 });
}

export async function readJsonBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  try {
    const body = await request.json();
    if (!body || typeof body !== 'object') throw new Error('not an object');
    return body as T;
  } catch {
    throw new HttpError(400, 'Dữ liệu gửi lên không hợp lệ.');
  }
}

/**
 * Mã PIN quản lý được kiểm tra trên máy chủ. Đổi bằng biến môi trường OWNER_PIN / STAFF_PIN
 * (mặc định giữ như bản cũ: chủ shop 8888, nhân viên 1234).
 */
export function roleFromPin(pin: string | null | undefined): AdminRole | null {
  const value = String(pin || '').trim();
  if (!value) return null;
  const ownerPin = process.env.OWNER_PIN || '8888';
  const staffPin = process.env.STAFF_PIN || '1234';
  if (value === ownerPin) return 'owner';
  if (value === staffPin) return 'staff';
  return null;
}

export function requireRole(request: Request, needed: AdminRole = 'staff'): AdminRole {
  const role = roleFromPin(request.headers.get('x-admin-pin'));
  if (!role) throw new HttpError(401, '❌ Phiên quản lý không hợp lệ, vui lòng đăng nhập lại!');
  if (needed === 'owner' && role !== 'owner') {
    throw new HttpError(403, '⛔ Chức năng này chỉ dành cho Chủ shop!');
  }
  return role;
}
