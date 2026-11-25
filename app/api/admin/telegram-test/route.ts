import { adminView } from '@/lib/server/admin';
import { HttpError, jsonError, readJsonBody, requireRole } from '@/lib/server/http';
import { mutate, readState, saveSettings } from '@/lib/server/store';
import { escapeHtml, sendTelegramMessage } from '@/lib/server/telegram';

/** Lưu Token/Chat ID rồi gửi tin nhắn thử tới Telegram. */
export async function POST(request: Request) {
  try {
    const role = requireRole(request, 'owner');
    const body = await readJsonBody<{ token?: string; chatId?: string }>(request);
    const token = String(body.token || '').trim();
    const chatId = String(body.chatId || '').trim();
    if (!token || !chatId) throw new HttpError(400, '⚠️ Vui lòng nhập Bot Token và Chat ID trước!');

    await mutate(async ({ exec, meta }) => {
      await saveSettings(exec, { ...meta.settings, telegramToken: token, telegramChatId: chatId });
    });
    const state = await readState();
    const time = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    const ok = await sendTelegramMessage(
      token,
      chatId,
      `✅ <b>Kết nối Bot Telegram thành công!</b>\nCửa hàng: <b>${escapeHtml(state.settings.shopName)}</b>\nThời gian: ${time}`,
    );
    return Response.json({ ...adminView(state, role), telegramOk: ok });
  } catch (err) {
    return jsonError(err);
  }
}
