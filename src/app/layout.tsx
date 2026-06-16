import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { CartDrawer, CartFloatButton } from "@/components/CartDrawer";
import FloatContacts from "@/components/FloatContacts";
import ChatWidget from "@/components/ChatWidget";

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
    <html lang="ru">
      <body>
        <CartProvider>
          {children}
          <CartDrawer />
          <CartFloatButton />
          <FloatContacts />
          <ChatWidget />
        </CartProvider>
      </body>
    </html>
  );
}
