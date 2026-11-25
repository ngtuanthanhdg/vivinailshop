import { adminResponse } from '@/lib/server/admin';
import { HttpError, jsonError, requireRole } from '@/lib/server/http';
import { mutate, readState } from '@/lib/server/store';

export async function DELETE(request: Request, ctx: RouteContext<'/api/admin/products/[id]'>) {
  try {
    const role = requireRole(request);
    const { id } = await ctx.params;
    await mutate(async ({ exec }) => {
      const deleted = await exec('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      if (!deleted.length) throw new HttpError(404, 'Không tìm thấy sản phẩm.');
    });
    return adminResponse(await readState(), role);
  } catch (err) {
    return jsonError(err);
  }
}
