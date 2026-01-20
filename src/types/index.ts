export type ArticleStatus = "draft" | "published" | "archived";

export interface Category {
  id: number;
  slug: string;
  icon?: string | null;
  sort_order: number;
  is_active: boolean;
  name_uz_latin: string;
  name_uz_cyrillic: string;
  name_ru: string;
  name_en: string;
}

export interface CategoryCreate {
  slug: string;
  icon?: string | null;
  sort_order?: number;
  is_active?: boolean;
  name_uz_latin: string;
  name_uz_cyrillic: string;
  name_ru: string;
  name_en: string;
}

export interface CategoryUpdate extends Partial<CategoryCreate> {}

export interface Article {
  id: number;
  slug: string;
  category_id: number;
  category?: Category;
  status: ArticleStatus;
  title_uz_latin: string;
  title_uz_cyrillic: string;
  title_ru: string;
  title_en: string;
  content_uz_latin: string;
  content_uz_cyrillic: string;
  content_ru: string;
  content_en: string;
  views_count: number;
  published_at?: string | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

export interface ArticleCreate {
  slug?: string;
  category_id: number;
  title_uz_latin?: string;
  title_uz_cyrillic?: string;
  title_ru?: string;
  title_en?: string;
  content_uz_latin?: string;
  content_uz_cyrillic?: string;
  content_ru?: string;
  content_en?: string;
}

export interface ArticleUpdate extends Partial<ArticleCreate> {}

export interface ApiError {
  detail: string | { msg: string; type: string; loc: string[] }[];
}

export const LANGUAGES = [
  { key: "uz_latin", label: "O'zbekcha (Lotin)" },
  { key: "uz_cyrillic", label: "Ўзбекча (Кирилл)" },
  { key: "ru", label: "Русский" },
  { key: "en", label: "English" },
] as const;

export type LanguageKey = (typeof LANGUAGES)[number]["key"];
