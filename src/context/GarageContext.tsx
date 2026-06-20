"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type GarageCar = {
  id: string;          // случайный uuid
  vin: string;
  brand: string;       // марка — из VIN или введённая вручную
  model: string;
  year: number | null;
  label: string;       // удобное название "Toyota Camry 2018"
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

export function GarageProvider({ children }: { children: ReactNode }) {
  const [cars, setCars] = useState<GarageCar[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Загружаем из localStorage при маунте
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCars(JSON.parse(raw) as GarageCar[]);
      const act = localStorage.getItem(ACTIVE_KEY);
      if (act) setActiveId(act);
    } catch {}
  }, []);

  // Сохраняем при изменении
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
    setCars((prev) => prev.filter((c) => c.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }

  function setActiveCar(id: string | null) {
    setActiveId(id);
  }

  const activeCar = cars.find((c) => c.id === activeId) ?? null;

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
