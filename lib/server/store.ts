import { promises as fs } from 'node:fs';
import path from 'node:path';
import { createDefaultProducts, DEFAULT_SETTINGS } from '@/lib/constants';
import { createInitialCategories, normalizeSettings, toPublicState } from '@/lib/shop';
import type { PublicShopState, ShopState } from '@/lib/types';

/**
 * Kho dữ liệu dạng file JSON trên máy chủ (thay cho cơ chế đồng bộ qua jsonblob/kvdb/ntfy của bản HTML).
 * Mọi thiết bị truy cập web đều đọc/ghi cùng 1 file nên luôn thấy dữ liệu mới nhất.
 *
 * Đặt biến môi trường DATA_DIR để đổi nơi lưu (mặc định: <thư mục dự án>/data).
 */
const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'shop.json');

interface StoreGlobal {
  queue: Promise<unknown>;
  cache: { mtimeMs: number; state: ShopState } | null;
}

// Dùng chung qua globalThis để mọi Route Handler (được bundle riêng) chia sẻ 1 hàng đợi ghi.
const g = globalThis as unknown as { __viviStore?: StoreGlobal };
const store: StoreGlobal = (g.__viviStore ??= { queue: Promise.resolve(), cache: null });

function createInitialState(): ShopState {
  const now = Date.now();
  return {
    categories: createInitialCategories(),
    products: createDefaultProducts(now),
    orders: [],
    customers: {},
    settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)),
    updatedAt: now,
  };
}

function hydrate(raw: unknown): ShopState {
  const s = (raw && typeof raw === 'object' ? raw : {}) as Partial<ShopState>;
  const base = createInitialState();
  return {
    categories: Array.isArray(s.categories) && s.categories.length ? s.categories : base.categories,
    products: Array.isArray(s.products) ? s.products : base.products,
    orders: Array.isArray(s.orders) ? s.orders : [],
    customers: s.customers && typeof s.customers === 'object' ? s.customers : {},
    settings: normalizeSettings(s.settings),
    updatedAt: Number(s.updatedAt) || base.updatedAt,
  };
}

async function readFromDisk(): Promise<ShopState> {
  try {
    const stat = await fs.stat(DATA_FILE);
    if (store.cache && store.cache.mtimeMs === stat.mtimeMs) return store.cache.state;
    const text = await fs.readFile(DATA_FILE, 'utf8');
    const state = hydrate(JSON.parse(text));
    store.cache = { mtimeMs: stat.mtimeMs, state };
    return state;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      const state = createInitialState();
      await writeToDisk(state);
      return state;
    }
    throw err;
  }
}

async function writeToDisk(state: ShopState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const json = JSON.stringify(state);
  const tmp = `${DATA_FILE}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(tmp, json, 'utf8');
  try {
    await fs.rename(tmp, DATA_FILE);
  } catch {
    // Windows đôi khi khóa file đích: ghi đè trực tiếp rồi dọn file tạm.
    await fs.writeFile(DATA_FILE, json, 'utf8');
    await fs.rm(tmp, { force: true });
  }
  const stat = await fs.stat(DATA_FILE);
  store.cache = { mtimeMs: stat.mtimeMs, state };
}

/** Đọc toàn bộ dữ liệu (chờ các lượt ghi đang xếp hàng hoàn tất trước). */
export async function readState(): Promise<ShopState> {
  await store.queue.catch(() => {});
  return readFromDisk();
}

export async function readPublicState(): Promise<PublicShopState> {
  return toPublicState(await readState());
}

/**
 * Sửa dữ liệu theo kiểu đọc → sửa → ghi, tuần tự hoá bằng hàng đợi để 2 yêu cầu cùng lúc
 * (VD: 2 khách đặt đơn) không ghi đè lên nhau. Ném lỗi trong `mutate` để huỷ thay đổi.
 */
export function updateState<T>(mutate: (draft: ShopState) => T | Promise<T>): Promise<{ state: ShopState; result: T }> {
  const run = async () => {
    const current = await readFromDisk();
    const draft: ShopState = structuredClone(current);
    const result = await mutate(draft);
    draft.updatedAt = Math.max(Date.now(), current.updatedAt + 1);
    await writeToDisk(draft);
    return { state: draft, result };
  };
  const next = store.queue.then(run, run);
  store.queue = next.catch(() => {});
  return next;
}
