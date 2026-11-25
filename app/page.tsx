import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import ShopApp from "@/components/ShopApp";
import { readPublicState } from "@/lib/server/store";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { settings } = await readPublicState();
  return {
    title: `${settings.shopName || "ViVi NailShop"} — Phụ Kiện Nail & Order Nội Địa`,
    description: settings.tagline || undefined,
  };
}

export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ShopLoader />
    </Suspense>
  );
}

/** Đọc dữ liệu cửa hàng mới nhất ở mỗi lượt truy cập rồi render sẵn trên máy chủ (tốt cho SEO). */
async function ShopLoader() {
  await connection();
  const data = await readPublicState();
  return <ShopApp initialData={data} />;
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-sm font-bold" style={{ color: "var(--accent-main)" }}>
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl text-white shadow animate-pulse" style={{ backgroundColor: "var(--accent-main)" }}>
        💅
      </div>
      <span>Đang tải cửa hàng...</span>
    </div>
  );
}
