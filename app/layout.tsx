import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Playfair_Display, Quicksand } from "next/font/google";
import "./globals.css";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin", "vietnamese"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ViVi NailShop — Phụ Kiện Nail & Order Nội Địa",
  description: "Chuyên sỉ & lẻ phụ kiện nail, sơn gel, máy hơ & nhận Order hàng nội địa Trung/Hàn.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="vi" className={`${beVietnam.variable} ${quicksand.variable} ${playfair.variable}`}>
      <body>{children}</body>
    </html>
  );
}
