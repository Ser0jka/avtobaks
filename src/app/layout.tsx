import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
