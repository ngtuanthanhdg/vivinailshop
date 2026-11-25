import { HttpError, jsonError, readJsonBody, roleFromPin } from '@/lib/server/http';

export async function POST(request: Request) {
  try {
    const { pin } = await readJsonBody<{ pin?: string }>(request);
    const role = roleFromPin(pin);
    if (!role) {
      // Làm chậm một chút để hạn chế dò mã PIN.
      await new Promise((r) => setTimeout(r, 600));
      throw new HttpError(401, '❌ Sai mã PIN!');
    }
    return Response.json({ role });
  } catch (err) {
    return jsonError(err);
  }
}
