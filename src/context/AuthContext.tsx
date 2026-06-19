"use client";

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";

export type User = {
  id: string;
  phone: string;
  name: string;
  email?: string | null;
};

export type OrderItem = {
  title: string;
  qty: number;
  price: number;
};

export type Order = {
  id: string;
  status: "processing" | "shipped" | "delivered" | "cancelled";
  total: number;
  createdAt: string;
  items: OrderItem[];
};

type AuthContextType = {
  user: User | null;
  orders: Order[];
  favorites: string[];
  loading: boolean;
  sendCode: (phone: string) => Promise<{ ok: boolean; error?: string }>;
  verifyCode: (phone: string, code: string, name?: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; email?: string }) => Promise<void>;
  refreshAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]           = useState<User | null>(null);
  const [orders, setOrders]       = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading]     = useState(true);

  // Проверяем сессию при загрузке
  useEffect(() => {
    fetch("/api/account/me")
      .then((r) => r.json())
      .then((data) => { if (data?.id) setUser(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refreshAccount = useCallback(async () => {
    const r = await fetch("/api/account");
    if (!r.ok) return;
    const data = await r.json();
    setOrders(data.orders ?? []);
    setFavorites((data.favorites ?? []).map((f: { productId: string }) => f.productId));
  }, []);

  useEffect(() => {
    let active = true;

    async function loadAccountOnStart() {
      if (!user || !active) return;
      await refreshAccount();
    }

    loadAccountOnStart();
    return () => { active = false; };
  }, [user, refreshAccount]);

  async function sendCode(phone: string) {
    const r = await fetch("/api/auth/send-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const data = await r.json();
    return r.ok ? { ok: true } : { ok: false, error: data.error };
  }

  async function verifyCode(phone: string, code: string, name?: string) {
    const r = await fetch("/api/auth/verify-code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, code, name }),
    });
    const data = await r.json();
    if (!r.ok) return { ok: false, error: data.error };
    setUser(data.user);
    await refreshAccount();
    return { ok: true };
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setOrders([]);
    setFavorites([]);
  }

  async function updateProfile(updates: { name?: string; email?: string }) {
    const r = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (r.ok) setUser(await r.json());
  }

  return (
    <AuthContext.Provider value={{ user, orders, favorites, loading, sendCode, verifyCode, logout, updateProfile, refreshAccount }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
