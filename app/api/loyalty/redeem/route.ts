import { after } from 'next/server';
import { cleanPhone } from '@/lib/format';
import { HttpError, jsonError, readJsonBody } from '@/lib/server/http';
import { mutate, rowToCustomer } from '@/lib/server/store';
import { escapeHtml, notifyShop } from '@/lib/server/telegram';

export async function POST(request: Request) {
  try {
    const body = await readJsonBody<{ phone?: string; giftId?: string }>(request);
    const phone = cleanPhone(body.phone);
    const giftId = String(body.giftId || '');

    const { member, gift, settings } = await mutate(async ({ exec, meta }) => {
      const [row] = phone.length >= 9 ? await exec('SELECT * FROM customers WHERE phone = $1 FOR UPDATE', [phone]) : [];
      if (!row) throw new HttpError(400, '⚠️ Vui lòng nhập số điện thoại thành viên có điểm trước!');
      const current = rowToCustomer(row);
      const gift = (meta.settings.loyaltyGifts || []).find((g) => g.id === giftId);
      if (!gift) throw new HttpError(404, '⚠️ Món quà này không còn tồn tại!');
      const cost = Number(gift.points);
      if (current.points < cost) {
        throw new HttpError(400, `⚠️ Bạn cần ${gift.points} điểm (Hiện có ${current.points} điểm).`);
      }
      const [updated] = await exec('UPDATE customers SET points = points - $2 WHERE phone = $1 RETURNING *', [phone, cost]);
      return { member: rowToCustomer(updated), gift, settings: meta.settings };
    });

    after(() =>
      notifyShop(
        settings,
        `🎁 <b>KHÁCH ĐỔI QUÀ TÍCH ĐIỂM</b>\n👤 Khách: <b>${escapeHtml(member.name)}</b> (${phone})\n🎁 Quà: <b>${escapeHtml(gift.name)}</b> (-${gift.points} điểm)\n⭐ Điểm còn lại: ${member.points}`,
      ),
    );

    return Response.json({ customer: member, gift });
  } catch (err) {
    return jsonError(err);
  }
}
