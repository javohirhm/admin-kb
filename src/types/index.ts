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
  reading_time_minutes?: number | null;
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
  reading_time_minutes?: number | null;
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

// ============ Health Tests Types ============

export type TestStatus = "draft" | "published" | "archived";
export type ResultLevel = "bad" | "average" | "good" | "excellent";

export interface TestCategory {
  id: number;
  slug: string;
  name_uz_latin: string;
  name_uz_cyrillic?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TestCategoryCreate {
  slug: string;
  name_uz_latin: string;
  name_uz_cyrillic?: string | null;
  name_ru?: string | null;
  name_en?: string | null;
  icon?: string | null;
  color?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface TestCategoryUpdate extends Partial<TestCategoryCreate> {}

export interface Test {
  id: number;
  slug: string;
  category_id?: number | null;
  title_uz_latin: string;
  title_uz_cyrillic?: string | null;
  title_ru?: string | null;
  title_en?: string | null;
  description_uz_latin?: string | null;
  description_uz_cyrillic?: string | null;
  description_ru?: string | null;
  description_en?: string | null;
  icon?: string | null;
  estimated_minutes: number;
  question_count: number;
  status: TestStatus;
  published_at?: string | null;
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestCreate {
  slug?: string;
  category_id?: number | null;
  title_uz_latin: string;
  title_uz_cyrillic?: string | null;
  title_ru?: string | null;
  title_en?: string | null;
  description_uz_latin?: string | null;
  description_uz_cyrillic?: string | null;
  description_ru?: string | null;
  description_en?: string | null;
  icon?: string | null;
  estimated_minutes?: number;
}

export interface TestUpdate extends Partial<TestCreate> {}

export interface TestQuestion {
  id: number;
  test_id: number;
  question_uz_latin: string;
  question_uz_cyrillic?: string | null;
  question_ru?: string | null;
  question_en?: string | null;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TestQuestionCreate {
  question_uz_latin: string;
  question_uz_cyrillic?: string | null;
  question_ru?: string | null;
  question_en?: string | null;
  order?: number;
}

export interface TestQuestionUpdate extends Partial<TestQuestionCreate> {}

export interface TestOption {
  id: number;
  question_id: number;
  label_uz_latin: string;
  label_uz_cyrillic?: string | null;
  label_ru?: string | null;
  label_en?: string | null;
  score: number;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface TestOptionCreate {
  label_uz_latin: string;
  label_uz_cyrillic?: string | null;
  label_ru?: string | null;
  label_en?: string | null;
  score?: number;
  order?: number;
}

export interface TestOptionUpdate extends Partial<TestOptionCreate> {}

export interface TestResultRange {
  id: number;
  test_id: number;
  min_score: number;
  max_score: number;
  level: ResultLevel;
  label_uz_latin: string;
  label_uz_cyrillic?: string | null;
  label_ru?: string | null;
  label_en?: string | null;
  color?: string | null;
  recommendation_uz_latin?: string | null;
  recommendation_uz_cyrillic?: string | null;
  recommendation_ru?: string | null;
  recommendation_en?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TestResultRangeCreate {
  min_score: number;
  max_score: number;
  level: ResultLevel;
  label_uz_latin: string;
  label_uz_cyrillic?: string | null;
  label_ru?: string | null;
  label_en?: string | null;
  color?: string | null;
  recommendation_uz_latin?: string | null;
  recommendation_uz_cyrillic?: string | null;
  recommendation_ru?: string | null;
  recommendation_en?: string | null;
}

export interface TestResultRangeUpdate extends Partial<TestResultRangeCreate> {}

// Full test with nested data
export interface TestOptionInQuestion {
  id: number;
  label_uz_latin: string;
  label_uz_cyrillic?: string | null;
  label_ru?: string | null;
  label_en?: string | null;
  score: number;
  order: number;
}

export interface TestQuestionWithOptions {
  id: number;
  question_uz_latin: string;
  question_uz_cyrillic?: string | null;
  question_ru?: string | null;
  question_en?: string | null;
  order: number;
  options: TestOptionInQuestion[];
}

export interface TestResultRangeInTest {
  id: number;
  min_score: number;
  max_score: number;
  level: ResultLevel;
  label_uz_latin: string;
  label_uz_cyrillic?: string | null;
  label_ru?: string | null;
  label_en?: string | null;
  color?: string | null;
  recommendation_uz_latin?: string | null;
  recommendation_uz_cyrillic?: string | null;
  recommendation_ru?: string | null;
  recommendation_en?: string | null;
}

export interface TestFull extends Test {
  questions: TestQuestionWithOptions[];
  result_ranges: TestResultRangeInTest[];
}
