import { NextResponse } from "next/server";

function adminBaseUrl() {
  return process.env.CATALOG_ADMIN_SERVICE_URL?.trim().replace(/\/+$/, "") || "";
}

function adminHeaders(extra?: HeadersInit) {
  const token = process.env.CATALOG_ADMIN_SERVICE_TOKEN?.trim();
  return {
    accept: "application/json",
    ...(token ? { authorization: `Bearer ${token}`, "x-catalog-admin-token": token } : {}),
    ...extra,
  };
}

export function isCatalogAdminProxyEnabled() {
  return Boolean(adminBaseUrl());
}

export async function proxyCatalogAdmin(path: string, init: RequestInit = {}) {
  const base = adminBaseUrl();
  if (!base) return null;

  const url = new URL(path.replace(/^\/+/, ""), `${base}/`);
  const res = await fetch(url, {
    ...init,
    headers: adminHeaders(init.headers),
    cache: "no-store",
  });

  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
