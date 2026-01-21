import type {
  Article,
  ArticleCreate,
  ArticleUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
  Test,
  TestCreate,
  TestUpdate,
  TestFull,
  TestCategory,
  TestCategoryCreate,
  TestCategoryUpdate,
  TestQuestion,
  TestQuestionCreate,
  TestQuestionUpdate,
  TestOption,
  TestOptionCreate,
  TestOptionUpdate,
  TestResultRange,
  TestResultRangeCreate,
  TestResultRangeUpdate,
} from "@/types";

const STORAGE_KEY_API_URL = "admin_api_url";
const STORAGE_KEY_ADMIN_KEY = "admin_api_key";

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ApiError extends Error {
  status: number;
  detail: unknown;

  constructor(message: string, status: number, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

export function getStoredCredentials(): {
  apiUrl: string | null;
  adminKey: string | null;
} {
  if (typeof window === "undefined") {
    return { apiUrl: null, adminKey: null };
  }
  return {
    apiUrl:
      localStorage.getItem(STORAGE_KEY_API_URL) ||
      process.env.NEXT_PUBLIC_API_BASE_URL ||
      null,
    adminKey: localStorage.getItem(STORAGE_KEY_ADMIN_KEY),
  };
}

export function setStoredCredentials(apiUrl: string, adminKey: string): void {
  localStorage.setItem(STORAGE_KEY_API_URL, apiUrl);
  localStorage.setItem(STORAGE_KEY_ADMIN_KEY, adminKey);
}

export function clearStoredCredentials(): void {
  localStorage.removeItem(STORAGE_KEY_API_URL);
  localStorage.removeItem(STORAGE_KEY_ADMIN_KEY);
}

export function isAuthenticated(): boolean {
  const { apiUrl, adminKey } = getStoredCredentials();
  return Boolean(apiUrl && adminKey);
}

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const { apiUrl, adminKey } = getStoredCredentials();

  if (!apiUrl || !adminKey) {
    throw new UnauthorizedError("Missing API credentials");
  }

  // Use the proxy to bypass CORS
  const proxyUrl = `/api/proxy${endpoint}`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    "X-Backend-URL": apiUrl,
    "X-ADMIN-KEY": adminKey,
    ...options.headers,
  };

  const response = await fetch(proxyUrl, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new UnauthorizedError("Invalid admin key");
  }

  if (!response.ok) {
    let detail: unknown;
    try {
      detail = await response.json();
    } catch {
      detail = await response.text();
    }
    throw new ApiError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      detail
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

// Category API functions
export async function listCategories(): Promise<Category[]> {
  return apiRequest<Category[]>("/api/admin/categories");
}

export async function createCategory(data: CategoryCreate): Promise<Category> {
  return apiRequest<Category>("/api/admin/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateCategory(
  id: number,
  data: CategoryUpdate
): Promise<Category> {
  return apiRequest<Category>(`/api/admin/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function disableCategory(id: number): Promise<Category> {
  return updateCategory(id, { is_active: false });
}

// Article API functions
export interface ListArticlesParams {
  status?: string;
  category_id?: number;
  search?: string;
}

export async function listArticles(
  params?: ListArticlesParams
): Promise<Article[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.category_id)
    searchParams.set("category_id", params.category_id.toString());
  if (params?.search) searchParams.set("search", params.search);

  const query = searchParams.toString();
  const endpoint = `/api/admin/articles${query ? `?${query}` : ""}`;
  return apiRequest<Article[]>(endpoint);
}

export async function getArticle(id: number): Promise<Article> {
  return apiRequest<Article>(`/api/admin/articles/${id}`);
}

export async function createArticle(data: ArticleCreate): Promise<Article> {
  return apiRequest<Article>("/api/admin/articles", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateArticle(
  id: number,
  data: ArticleUpdate
): Promise<Article> {
  return apiRequest<Article>(`/api/admin/articles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function publishArticle(id: number): Promise<Article> {
  return apiRequest<Article>(`/api/admin/articles/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishArticle(id: number): Promise<Article> {
  return apiRequest<Article>(`/api/admin/articles/${id}/unpublish`, {
    method: "POST",
  });
}

export async function deleteArticle(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/articles/${id}`, {
    method: "DELETE",
  });
}

// Utility to check if article has missing translations
export function getArticleMissingLanguages(article: Article): string[] {
  const missing: string[] = [];
  const languages = ["uz_latin", "uz_cyrillic", "ru", "en"] as const;

  for (const lang of languages) {
    const titleKey = `title_${lang}` as keyof Article;
    const contentKey = `content_${lang}` as keyof Article;

    if (!article[titleKey] || !article[contentKey]) {
      missing.push(lang);
    }
  }

  return missing;
}

// ============ Health Tests API Functions ============

// Test Category API functions
export async function listTestCategories(): Promise<TestCategory[]> {
  return apiRequest<TestCategory[]>("/api/admin/tests/categories");
}

export async function createTestCategory(
  data: TestCategoryCreate
): Promise<TestCategory> {
  return apiRequest<TestCategory>("/api/admin/tests/categories", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTestCategory(
  id: number,
  data: TestCategoryUpdate
): Promise<TestCategory> {
  return apiRequest<TestCategory>(`/api/admin/tests/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTestCategory(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/tests/categories/${id}`, {
    method: "DELETE",
  });
}

// Test API functions
export interface ListTestsParams {
  status?: string;
  include_deleted?: boolean;
}

export async function listTests(params?: ListTestsParams): Promise<Test[]> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.include_deleted)
    searchParams.set("include_deleted", params.include_deleted.toString());

  const query = searchParams.toString();
  const endpoint = `/api/admin/tests${query ? `?${query}` : ""}`;
  return apiRequest<Test[]>(endpoint);
}

export async function getTest(id: number): Promise<TestFull> {
  return apiRequest<TestFull>(`/api/admin/tests/${id}`);
}

export async function createTest(data: TestCreate): Promise<Test> {
  return apiRequest<Test>("/api/admin/tests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTest(id: number, data: TestUpdate): Promise<Test> {
  return apiRequest<Test>(`/api/admin/tests/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function publishTest(id: number): Promise<Test> {
  return apiRequest<Test>(`/api/admin/tests/${id}/publish`, {
    method: "POST",
  });
}

export async function unpublishTest(id: number): Promise<Test> {
  return apiRequest<Test>(`/api/admin/tests/${id}/unpublish`, {
    method: "POST",
  });
}

export async function deleteTest(id: number): Promise<void> {
  return apiRequest<void>(`/api/admin/tests/${id}`, {
    method: "DELETE",
  });
}

// Test Question API functions
export async function createTestQuestion(
  testId: number,
  data: TestQuestionCreate
): Promise<TestQuestion> {
  return apiRequest<TestQuestion>(`/api/admin/tests/${testId}/questions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateTestQuestion(
  questionId: number,
  data: TestQuestionUpdate
): Promise<TestQuestion> {
  return apiRequest<TestQuestion>(`/api/admin/tests/questions/${questionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTestQuestion(questionId: number): Promise<void> {
  return apiRequest<void>(`/api/admin/tests/questions/${questionId}`, {
    method: "DELETE",
  });
}

// Test Option API functions
export async function createTestOption(
  questionId: number,
  data: TestOptionCreate
): Promise<TestOption> {
  return apiRequest<TestOption>(
    `/api/admin/tests/questions/${questionId}/options`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateTestOption(
  optionId: number,
  data: TestOptionUpdate
): Promise<TestOption> {
  return apiRequest<TestOption>(`/api/admin/tests/options/${optionId}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteTestOption(optionId: number): Promise<void> {
  return apiRequest<void>(`/api/admin/tests/options/${optionId}`, {
    method: "DELETE",
  });
}

// Test Result Range API functions
export async function createTestResultRange(
  testId: number,
  data: TestResultRangeCreate
): Promise<TestResultRange> {
  return apiRequest<TestResultRange>(
    `/api/admin/tests/${testId}/result-ranges`,
    {
      method: "POST",
      body: JSON.stringify(data),
    }
  );
}

export async function updateTestResultRange(
  rangeId: number,
  data: TestResultRangeUpdate
): Promise<TestResultRange> {
  return apiRequest<TestResultRange>(
    `/api/admin/tests/result-ranges/${rangeId}`,
    {
      method: "PATCH",
      body: JSON.stringify(data),
    }
  );
}

export async function deleteTestResultRange(rangeId: number): Promise<void> {
  return apiRequest<void>(`/api/admin/tests/result-ranges/${rangeId}`, {
    method: "DELETE",
  });
}

// Utility to check if test has missing translations
export function getTestMissingLanguages(test: Test): string[] {
  const missing: string[] = [];
  const languages = ["uz_latin", "uz_cyrillic", "ru", "en"] as const;

  for (const lang of languages) {
    const titleKey = `title_${lang}` as keyof Test;
    if (!test[titleKey]) {
      missing.push(lang);
    }
  }

  return missing;
}
