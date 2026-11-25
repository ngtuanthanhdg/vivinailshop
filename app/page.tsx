import type { Metadata } from "next";
import { connection } from "next/server";
import { cache, Suspense } from "react";
import ShopApp from "@/components/ShopApp";
import StorefrontSkeleton from "@/components/storefront/StorefrontSkeleton";
import { readPublicState } from "@/lib/server/store";

/** Tiêu đề trang và nội dung trang dùng chung 1 lượt đọc database cho mỗi lần truy cập. */
const loadShop = cache(readPublicState);

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const { settings } = await loadShop();
  return {
    title: `${settings.shopName || "ViVi NailShop"} — Phụ Kiện Nail & Order Nội Địa`,
    description: settings.tagline || undefined,
  };
}

export default function Page() {
  return (
    <Suspense fallback={<StorefrontSkeleton />}>
      <ShopLoader />
    </Suspense>
  );
}

/** Đọc dữ liệu cửa hàng mới nhất ở mỗi lượt truy cập rồi render sẵn trên máy chủ (tốt cho SEO). */
async function ShopLoader() {
  await connection();
  const data = await loadShop();
  return <ShopApp initialData={data} />;
}
