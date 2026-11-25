import { jsonError } from '@/lib/server/http';
import { readPublicState, readVersion } from '@/lib/server/store';

/** Dữ liệu công khai của cửa hàng. `?v=<updatedAt>` → trả `{ unchanged: true }` nếu không có gì mới. */
export async function GET(request: Request) {
  try {
    const since = Number(new URL(request.url).searchParams.get('v') || 0);
    if (since) {
      const version = await readVersion();
      if (version === since) return Response.json({ unchanged: true, updatedAt: version });
    }
    return Response.json(await readPublicState());
  } catch (err) {
    return jsonError(err);
  }
}
