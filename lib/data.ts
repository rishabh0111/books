import lists from "./lists.generated.json";

export type Book = { id: string; n: number; name: string; author: string; category: string; sub: string; why: string };
export type Stage = { name: string; books: Book[] };
export type ListKey = "learning" | "pleasure";

export const LISTS: Record<ListKey, { title: string; href: string; stages: Stage[]; categories: string[]; categoryLabel: string }> = {
  learning: {
    title: "Non-fiction",
    href: "/",
    stages: lists.learning as Stage[],
    categories: ["Self", "People", "Work", "World"],
    categoryLabel: "Area of life",
  },
  pleasure: {
    title: "Literature",
    href: "/literature",
    stages: lists.pleasure as Stage[],
    categories: ["Novel", "Short stories", "Play", "Poetry", "Epic & myth"],
    categoryLabel: "Form",
  },
};

export const bookIds = (key: ListKey) => LISTS[key].stages.flatMap((s) => s.books.map((b) => b.id));
