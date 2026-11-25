import { neon, neonConfig, Pool, type NeonQueryFunction, type PoolClient } from '@neondatabase/serverless';
import ws from 'ws';

// Node 22+ có sẵn WebSocket; Node 20 thì chưa → dùng thư viện `ws` để transaction (Pool) vẫn chạy được.
if (typeof globalThis.WebSocket === 'undefined') neonConfig.webSocketConstructor = ws;

/**
 * Kết nối Neon (PostgreSQL).
 * - Đọc dữ liệu: qua HTTP (`neon()`), nhanh, không cần giữ kết nối.
 * - Ghi dữ liệu: qua WebSocket (`Pool`) để chạy transaction nhiều bước an toàn.
 */
export type Row = Record<string, unknown>;
/** Chạy 1 câu SQL có tham số $1, $2… và trả về các dòng kết quả. */
export type Exec = (text: string, params?: unknown[]) => Promise<Row[]>;

function databaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Thiếu biến môi trường DATABASE_URL (chuỗi kết nối Neon). Xem file HUONG_DAN_NEON_IMAGEKIT.md');
  }
  return url;
}

let httpSql: NeonQueryFunction<false, false> | null = null;

export function sql(): NeonQueryFunction<false, false> {
  return (httpSql ??= neon(databaseUrl()));
}

/** Chạy nhiều câu đọc trong 1 lượt gọi HTTP (cùng 1 transaction chỉ-đọc → dữ liệu nhất quán). */
export async function readBatch(queries: Array<[string, unknown[]?]>): Promise<Row[][]> {
  const db = sql();
  return (await db.transaction(
    queries.map(([text, params]) => db.query(text, params ?? [])),
    { readOnly: true },
  )) as Row[][];
}

/**
 * Chạy `fn` trong 1 transaction. Ném lỗi trong `fn` → mọi thay đổi bị huỷ (ROLLBACK).
 * Mỗi lần gọi mở 1 kết nối riêng rồi đóng lại, phù hợp cả máy chủ thường lẫn serverless (Vercel).
 */
export async function withTransaction<T>(fn: (exec: Exec) => Promise<T>): Promise<T> {
  const pool = new Pool({ connectionString: databaseUrl(), max: 1 });
  pool.on('error', (err: Error) => console.error('[db] lỗi kết nối Neon:', err));
  const client: PoolClient = await pool.connect();
  const exec: Exec = async (text, params) => (await client.query(text, params ?? [])).rows as Row[];
  try {
    await client.query('BEGIN');
    const result = await fn(exec);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    throw err;
  } finally {
    client.release();
    await pool.end().catch(() => {});
  }
}

/** Mã lỗi Postgres "bảng không tồn tại" → chưa chạy db/schema.sql. */
export function isMissingTableError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && (err as { code?: string }).code === '42P01');
}
