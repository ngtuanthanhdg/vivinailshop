import { adminResponse } from '@/lib/server/admin';
import { jsonError, requireRole } from '@/lib/server/http';
import { readState } from '@/lib/server/store';

/** Toàn bộ dữ liệu cho trang quản trị. `?v=<updatedAt>` → `{ unchanged: true }` nếu không đổi. */
export async function GET(request: Request) {
  try {
    const role = requireRole(request);
    const since = Number(new URL(request.url).searchParams.get('v') || 0);
    const state = await readState();
    if (since && since === state.updatedAt) {
      return Response.json({ unchanged: true, updatedAt: state.updatedAt });
    }
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
