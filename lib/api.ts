export class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export async function apiFetch<T>(
  url: string,
  options: { method?: string; body?: unknown; pin?: string; signal?: AbortSignal } = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.pin) headers['x-admin-pin'] = options.pin;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: 'no-store',
      signal: options.signal,
    });
  } catch (err) {
    if ((err as Error).name === 'AbortError') throw err;
    throw new ApiError('⚠️ Không kết nối được máy chủ, vui lòng kiểm tra mạng!', 0);
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    // bỏ qua
  }
  if (!res.ok) {
    const msg = (data as { error?: string } | null)?.error || `⚠️ Lỗi máy chủ (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}
