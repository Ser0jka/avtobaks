import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "cdn.vseinstrumenti.ru" },
      { protocol: "https", hostname: "ir.ozone.ru" },
      { protocol: "https", hostname: "cdn1.ozone.ru" },
      { protocol: "https", hostname: "*.wbbasket.ru" },
      { protocol: "https", hostname: "img-server-10.parts-soft.ru" },
      { protocol: "https", hostname: "main-cdn.sbermegamarket.ru" },
      { protocol: "https", hostname: "goods-photos.static1-sima-land.com" },
      { protocol: "https", hostname: "pubimg.nodacdn.net" },
      { protocol: "https", hostname: "static.baza.farpost.ru" },
      { protocol: "https", hostname: "static.baza.drom.ru" },
      { protocol: "https", hostname: "www.tcautomag.ru" },
      { protocol: "https", hostname: "autopiter.ru" },
    ],
  },
};

export default nextConfig;
