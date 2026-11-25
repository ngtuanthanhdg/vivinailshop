import { adminResponse } from '@/lib/server/admin';
import { jsonError, requireRole } from '@/lib/server/http';
import { readState, readVersion } from '@/lib/server/store';

/** Toàn bộ dữ liệu cho trang quản trị. `?v=<updatedAt>` → `{ unchanged: true }` nếu không đổi. */
export async function GET(request: Request) {
  try {
    const role = requireRole(request);
    const since = Number(new URL(request.url).searchParams.get('v') || 0);
    if (since) {
      const version = await readVersion();
      if (version === since) return Response.json({ unchanged: true, updatedAt: version });
    }
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
