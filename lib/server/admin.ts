import { stripSecrets } from '@/lib/shop';
import type { AdminRole, ShopState } from '@/lib/types';

/** Dữ liệu trả về cho trang quản trị. Nhân viên không thấy token/chat id của bot Telegram. */
export function adminView(state: ShopState, role: AdminRole): ShopState {
  if (role === 'owner') return state;
  return { ...state, settings: stripSecrets(state.settings) };
}

export function adminResponse(state: ShopState, role: AdminRole): Response {
  return Response.json(adminView(state, role));
}
