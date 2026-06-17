import type { StaticImageData } from "next/image";
import partsPhoto from "../../public/сcategories/1.png";

export type Product = {
  id: string;
  title: string;
  article: string;
  price: number;
  category: string;
  inStock: boolean;
  image: string | StaticImageData;
  description: string;
};

export const CATEGORIES = [
  "Все категории",
  "Тормозная система",
  "Двигатель и масла",
  "Оптика",
  "Подвеска",
  "Аксессуары",
] as const;

export const products: Product[] = [
  {
    id: "1",
    title: "Тормозные колодки передние",
    article: "AB-102354",
    price: 2450,
    category: "Тормозная система",
    inStock: true,
    image: partsPhoto,
    description:
      "Передние тормозные колодки, совместимы с Toyota, Nissan, Mazda. Срок службы — от 40 000 км.",
  },
  {
    id: "2",
    title: "Масляный фильтр",
    article: "AB-20456",
    price: 680,
    category: "Двигатель и масла",
    inStock: true,
    image: partsPhoto,
    description:
      "Масляный фильтр для иномарок. Высокая степень очистки, ресурс до 15 000 км.",
  },
  {
    id: "3",
    title: "Моторное масло 5W-40 4L",
    article: "AB-30567",
    price: 3950,
    category: "Двигатель и масла",
    inStock: true,
    image: partsPhoto,
    description:
      "Синтетическое моторное масло 5W-40. Объём 4 литра. Подходит для бензиновых и дизельных двигателей.",
  },
  {
    id: "4",
    title: "Фара передняя левая",
    article: "AB-40678",
    price: 18900,
    category: "Оптика",
    inStock: false,
    image: partsPhoto,
    description:
      "Передняя левая фара. Под заказ, срок поставки 3–5 рабочих дней.",
  },
  {
    id: "5",
    title: "Стойка амортизатора передняя",
    article: "AB-50789",
    price: 4250,
    category: "Подвеска",
    inStock: true,
    image: partsPhoto,
    description:
      "Стойка амортизатора передней подвески. Газомасляная, усиленная. Совместимость уточняйте по VIN.",
  },
];
