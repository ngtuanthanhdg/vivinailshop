import { jsonError } from '@/lib/server/http';
import { readPublicState } from '@/lib/server/store';

/** Dữ liệu công khai của cửa hàng. `?v=<updatedAt>` → trả `{ unchanged: true }` nếu không có gì mới. */
export async function GET(request: Request) {
  try {
    const since = Number(new URL(request.url).searchParams.get('v') || 0);
    const state = await readPublicState();
    if (since && since === state.updatedAt) {
      return Response.json({ unchanged: true, updatedAt: state.updatedAt });
    }
    return Response.json(state);
  } catch (err) {
    return jsonError(err);
  }
}
