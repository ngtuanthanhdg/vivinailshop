// Tạo các bảng trong database Neon từ file db/schema.sql.
// Chạy: npm run db:setup   (đọc DATABASE_URL trong file .env.local)
import './load-env.mjs';
import { readFile } from 'node:fs/promises';
import { neonConfig, Pool } from '@neondatabase/serverless';
import ws from 'ws';

// Node 20 chưa có WebSocket sẵn → dùng thư viện ws.
if (typeof globalThis.WebSocket === 'undefined') neonConfig.webSocketConstructor = ws;

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('❌ Chưa có DATABASE_URL. Hãy tạo file .env.local (xem HUONG_DAN_NEON_IMAGEKIT.md, Bước 1).');
  process.exit(1);
}

const schema = await readFile(new URL('../db/schema.sql', import.meta.url), 'utf8');
const pool = new Pool({ connectionString: url });
try {
  await pool.query(schema);
  const { rows } = await pool.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name IN ('shop_meta', 'products', 'orders', 'customers')
     ORDER BY table_name`,
  );
  console.log('✅ Đã tạo/kiểm tra xong các bảng:', rows.map((r) => r.table_name).join(', '));
  console.log('👉 Giờ chạy "npm run dev" — lần đầu mở web sẽ tự thêm 5 sản phẩm mẫu.');
} catch (err) {
  console.error('❌ Không tạo được bảng:', err.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
