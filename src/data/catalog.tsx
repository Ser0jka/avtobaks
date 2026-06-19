import { type ReactNode } from "react";

export type CatalogCategory = {
  slug: string;
  label: string;
  icon: ReactNode;
};

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  {
    slug: "masla",
    label: "Масла и тех. жидкости",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3h10l2 5H5L7 3z"/><path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/><path d="M9 12h6M9 16h4"/></svg>,
  },
  {
    slug: "akkumulyatory",
    label: "Аккумуляторы",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="12" rx="2"/><path d="M7 7V5M17 7V5M9 12h2m2 0h2M12 10v4"/></svg>,
  },
  {
    slug: "schetki",
    label: "Щётки стеклоочистителя",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18 L20 6"/><path d="M4 18 Q12 10 20 6"/><circle cx="20" cy="6" r="1.5" fill="currentColor" stroke="none"/></svg>,
  },
  {
    slug: "avtolampy",
    label: "Автолампы",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21h6M12 3a6 6 0 00-3 11.2V17h6v-2.8A6 6 0 0012 3z"/><path d="M9 17h6"/></svg>,
  },
  {
    slug: "himiya",
    label: "Автохимия и автокосметика",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6l1 5H8L9 3z"/><path d="M8 8v11a1 1 0 001 1h6a1 1 0 001-1V8"/><path d="M10 12h4"/></svg>,
  },
  {
    slug: "aksessuary",
    label: "Аксессуары",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="8" rx="1"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>,
  },
  {
    slug: "glushiteli",
    label: "Глушители и комплектующие",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12h18M3 12c0 0 2-4 6-4h6c4 0 6 4 6 4"/><path d="M19 12v4M21 16h-4"/></svg>,
  },
  {
    slug: "instrumenty",
    label: "Инструменты и оборудование",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
  },
  {
    slug: "dvigatel",
    label: "Двигатель",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="8" width="14" height="10" rx="1"/><path d="M17 12h2a2 2 0 010 4h-2"/><path d="M7 8V6a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M7 13h4"/></svg>,
  },
  {
    slug: "podveska",
    label: "Подвеска и ходовая",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="17" r="3"/><circle cx="18" cy="17" r="3"/><path d="M6 14V7l4-3h4l4 3v7"/><path d="M6 10h12"/></svg>,
  },
  {
    slug: "kuzov",
    label: "Кузовные детали",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17H3a2 2 0 01-2-2v-4a2 2 0 012-2l3.5-3.5A2 2 0 018 5h8l4.5 2.5a2 2 0 011.5 2V15a2 2 0 01-2 2h-2"/><circle cx="7.5" cy="17.5" r="2.5"/><circle cx="16.5" cy="17.5" r="2.5"/></svg>,
  },
  {
    slug: "electrika",
    label: "Электрика",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>,
  },
  {
    slug: "transmissiya",
    label: "Трансмиссия",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 12h10M19 7v10"/></svg>,
  },
  {
    slug: "optika",
    label: "Автооптика",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  },
  {
    slug: "tormoza",
    label: "Тормозная система",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/></svg>,
  },
  {
    slug: "salon",
    label: "Салон",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l4-4h10l4 4v8H3V9z"/><path d="M7 17v2M17 17v2M3 13h18"/></svg>,
  },
  {
    slug: "kovriki",
    label: "Коврики и аксессуары",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M2 15h20M7 5v14M12 5v14M17 5v14"/></svg>,
  },
  {
    slug: "filtry",
    label: "Фильтры",
    icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>,
  },
];

export type CarBrand = {
  name: string;
  letter: string;
};

export const CAR_BRANDS: CarBrand[] = [
  // Русские
  { name: "АЗЛК", letter: "А" },
  { name: "ВАЗ", letter: "В" },
  { name: "ГАЗ", letter: "Г" },
  { name: "ЗАЗ", letter: "З" },
  { name: "Москвич", letter: "М" },
  { name: "УАЗ", letter: "У" },
  // Иностранные
  { name: "Abarth", letter: "A" },
  { name: "Alfa Romeo", letter: "A" },
  { name: "Audi", letter: "A" },
  { name: "BMW", letter: "B" },
  { name: "Buick", letter: "B" },
  { name: "BYD", letter: "B" },
  { name: "Cadillac", letter: "C" },
  { name: "Changan", letter: "C" },
  { name: "Chery", letter: "C" },
  { name: "Chevrolet", letter: "C" },
  { name: "Chrysler", letter: "C" },
  { name: "Citroen", letter: "C" },
  { name: "Dacia", letter: "D" },
  { name: "Daewoo", letter: "D" },
  { name: "Dodge", letter: "D" },
  { name: "Fiat", letter: "F" },
  { name: "Ford", letter: "F" },
  { name: "Geely", letter: "G" },
  { name: "Honda", letter: "H" },
  { name: "Hyundai", letter: "H" },
  { name: "Infiniti", letter: "I" },
  { name: "Isuzu", letter: "I" },
  { name: "Jaguar", letter: "J" },
  { name: "Jeep", letter: "J" },
  { name: "Kia", letter: "K" },
  { name: "Land Rover", letter: "L" },
  { name: "Lexus", letter: "L" },
  { name: "Mazda", letter: "M" },
  { name: "Mercedes-Benz", letter: "M" },
  { name: "Mitsubishi", letter: "M" },
  { name: "Nissan", letter: "N" },
  { name: "Opel", letter: "O" },
  { name: "Peugeot", letter: "P" },
  { name: "Porsche", letter: "P" },
  { name: "Renault", letter: "R" },
  { name: "Skoda", letter: "S" },
  { name: "Subaru", letter: "S" },
  { name: "Suzuki", letter: "S" },
  { name: "Toyota", letter: "T" },
  { name: "Volkswagen", letter: "V" },
  { name: "Volvo", letter: "V" },
];

// Group brands by first letter
export function groupBrandsByLetter(brands: CarBrand[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const b of brands) {
    const existing = map.get(b.letter) ?? [];
    existing.push(b.name);
    map.set(b.letter, existing);
  }
  return map;
}
