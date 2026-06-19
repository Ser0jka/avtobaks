import type { Metadata } from "next";
import localFont from "next/font/local";
import { Montserrat, Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { CartDrawer, CartFloatButton } from "@/components/CartDrawer";
import FloatContacts from "@/components/FloatContacts";
import ChatWidget from "@/components/ChatWidget";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const gilroy = localFont({
  src: [
    { path: "../font/Gilroy-Regular_0.ttf", weight: "400", style: "normal" },
    { path: "../font/Gilroy-RegularItalic_0.ttf", weight: "400", style: "italic" },
    { path: "../font/Gilroy-Medium_0.ttf", weight: "500", style: "normal" },
    { path: "../font/Gilroy-Semibold_0.ttf", weight: "600", style: "normal" },
    { path: "../font/Gilroy-Bold_0.ttf", weight: "700", style: "normal" },
    { path: "../font/Gilroy-Extrabold_0.ttf", weight: "800", style: "normal" },
    { path: "../font/Gilroy-Black_0.ttf", weight: "900", style: "normal" },
  ],
  variable: "--font-gilroy",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Автобакс — автозапчасти в Кемерово",
  description:
    "Большой каталог автозапчастей, подбор по VIN, наличие и заказ деталей для автомобилей в Кемерово.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" className={`${gilroy.variable} ${montserrat.variable} ${inter.variable}`}>
      <body>
        <AuthProvider>
          <CartProvider>
            {children}
            <CartDrawer />
            <CartFloatButton />
            <FloatContacts />
            <ChatWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
