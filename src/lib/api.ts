import type {
  Article,
  ArticleCreate,
  ArticleUpdate,
  Category,
  CategoryCreate,
  CategoryUpdate,
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
