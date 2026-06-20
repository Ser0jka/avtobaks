"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type GarageCar = {
  id: string;
  vin: string;
  brand: string;
  model: string;
  year: number | null;
  label: string;
  addedAt: number;
};

type GarageCtx = {
  cars: GarageCar[];
  activeCar: GarageCar | null;
  setActiveCar: (id: string | null) => void;
  addCar: (car: Omit<GarageCar, "id" | "addedAt">) => GarageCar;
  removeCar: (id: string) => void;
};

const GarageContext = createContext<GarageCtx | null>(null);

const STORAGE_KEY = "avtobaks_garage";
const ACTIVE_KEY = "avtobaks_garage_active";

function readGarageCars() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) as GarageCar[] : [];
  } catch {
    return [];
  }
}

function readActiveCarId() {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}

export function GarageProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<GarageCar[]>(readGarageCars);
  const [activeId, setActiveId] = useState<string | null>(readActiveCarId);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cars));
    } catch {}
  }, [cars]);

  useEffect(() => {
    try {
      if (activeId) localStorage.setItem(ACTIVE_KEY, activeId);
      else localStorage.removeItem(ACTIVE_KEY);
    } catch {}
  }, [activeId]);

  function addCar(data: Omit<GarageCar, "id" | "addedAt">): GarageCar {
    const car: GarageCar = {
      ...data,
      id: crypto.randomUUID(),
      addedAt: Date.now(),
    };
    setCars((prev) => [car, ...prev]);
    setActiveId(car.id);
    return car;
  }

  function removeCar(id: string) {
    setCars((prev) => prev.filter((car) => car.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }

  function setActiveCar(id: string | null) {
    setActiveId(id);
  }

  const activeCar = cars.find((car) => car.id === activeId) ?? null;

  return (
    <GarageContext.Provider value={{ cars, activeCar, setActiveCar, addCar, removeCar }}>
      {children}
    </GarageContext.Provider>
  );
}

export function useGarage() {
  const ctx = useContext(GarageContext);
  if (!ctx) throw new Error("useGarage must be inside GarageProvider");
  return ctx;
}
