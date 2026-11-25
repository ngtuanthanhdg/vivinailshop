import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, requireRole } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';

export async function DELETE(request: Request, ctx: RouteContext<'/api/admin/products/[id]'>) {
  try {
    const role = requireRole(request);
    const { id } = await ctx.params;
    const { state } = await updateState((draft) => {
      const before = draft.products.length;
      draft.products = draft.products.filter((p) => p.id !== id);
      if (draft.products.length === before) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
    });
    return adminResponse(state, role);
  } catch (err) {
    return jsonError(err);
  }
}
