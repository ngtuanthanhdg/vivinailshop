// Nạp biến môi trường cho các lệnh npm run db:* (chạy được từ Node 20.12 trở lên).
// Thứ tự ưu tiên giống Next.js: biến có sẵn trong máy > .env.local > .env
import { existsSync, readFileSync } from 'node:fs';
import { parseEnv } from 'node:util';

for (const file of ['.env.local', '.env']) {
  if (!existsSync(file)) continue;
  for (const [key, value] of Object.entries(parseEnv(readFileSync(file, 'utf8')))) {
    if (process.env[key] === undefined) process.env[key] = value;
  }
}
