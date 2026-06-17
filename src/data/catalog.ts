export type CatalogCategory = {
  slug: string;
  label: string;
  icon: string; // SVG path or emoji fallback
};

export const CATALOG_CATEGORIES: CatalogCategory[] = [
  { slug: "masla", label: "Масла и тех. жидкости", icon: "🛢️" },
  { slug: "akkumulyatory", label: "Аккумуляторы", icon: "🔋" },
  { slug: "schetki", label: "Щётки стеклоочистителя", icon: "🪟" },
  { slug: "avtolampy", label: "Автолампы", icon: "💡" },
  { slug: "himiya", label: "Автохимия и автокосметика", icon: "🧴" },
  { slug: "aksessuary", label: "Аксессуары", icon: "🧰" },
  { slug: "glushiteli", label: "Глушители и комплектующие", icon: "🔧" },
  { slug: "instrumenty", label: "Инструменты и оборудование", icon: "🔩" },
  { slug: "dvigatel", label: "Двигатель", icon: "⚙️" },
  { slug: "podveska", label: "Подвеска и ходовая", icon: "🚗" },
  { slug: "kuzov", label: "Кузовные детали", icon: "🚘" },
  { slug: "electrika", label: "Электрика", icon: "⚡" },
  { slug: "transmissiya", label: "Трансмиссия", icon: "🔄" },
  { slug: "optika", label: "Автооптика", icon: "🔦" },
  { slug: "tormoza", label: "Тормозная система", icon: "🛑" },
  { slug: "salon", label: "Салон", icon: "💺" },
  { slug: "kovriki", label: "Коврики и аксессуары", icon: "🧲" },
  { slug: "filtry", label: "Фильтры", icon: "🌀" },
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
