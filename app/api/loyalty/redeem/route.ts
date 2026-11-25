import { after } from 'next/server';
import { cleanPhone } from '@/lib/format';
import { HttpError, jsonError, readJsonBody } from '@/lib/server/http';
import { updateState } from '@/lib/server/store';
import { escapeHtml, notifyShop } from '@/lib/server/telegram';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ phone?: string; giftId?: string }>(request);
    const phone = cleanPhone(body.phone);
    const giftId = String(body.giftId || '');

    const { state, result } = await updateState((draft) => {
      const member = phone.length >= 9 ? draft.customers[phone] : undefined;
      if (!member) throw new HttpError(400, '⚠️ Vui lòng nhập số điện thoại thành viên có điểm trước!');
      const gift = (draft.settings.loyaltyGifts || []).find((g) => g.id === giftId);
      if (!gift) throw new HttpError(404, '⚠️ Món quà này không còn tồn tại!');
      if ((member.points || 0) < Number(gift.points)) {
        throw new HttpError(400, `⚠️ Bạn cần ${gift.points} điểm (Hiện có ${member.points || 0} điểm).`);
      }
      member.points = (member.points || 0) - Number(gift.points);
      return { member, gift };
    });

    const { member, gift } = result;
    after(() =>
      notifyShop(
        state.settings,
        `🎁 <b>KHÁCH ĐỔI QUÀ TÍCH ĐIỂM</b>\n👤 Khách: <b>${escapeHtml(member.name)}</b> (${phone})\n🎁 Quà: <b>${escapeHtml(gift.name)}</b> (-${gift.points} điểm)\n⭐ Điểm còn lại: ${member.points}`,
      ),
    );

    return Response.json({ customer: member, gift });
  } catch (err) {
    return jsonError(err);
  }
}
