"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { LanguageTabs } from "@/components/LanguageTabs";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  listCategories,
  createArticle,
  UnauthorizedError,
  ApiError,
} from "@/lib/api";
import type { Category, ArticleCreate, LanguageKey } from "@/types";

interface ArticleFormData extends ArticleCreate {
  category_id: number;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageKey>("uz_latin");

  const { register, handleSubmit, setValue, watch } = useForm<ArticleFormData>({
    defaultValues: {
      slug: "",
      category_id: 0,
      title_uz_latin: "",
      title_uz_cyrillic: "",
      title_ru: "",
      title_en: "",
      content_uz_latin: "",
      content_uz_cyrillic: "",
      content_ru: "",
      content_en: "",
    },
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await listCategories();
      setCategories(data.filter((c) => c.is_active));
      if (data.length > 0) {
        setValue("category_id", data[0].id);
      }
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to load categories"
      );
    } finally {
      setIsLoading(false);
    }
  }, [router, setValue]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onSubmit = async (data: ArticleFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload: ArticleCreate = {
        category_id: data.category_id,
        slug: data.slug || undefined,
        title_uz_latin: data.title_uz_latin || undefined,
        title_uz_cyrillic: data.title_uz_cyrillic || undefined,
        title_ru: data.title_ru || undefined,
        title_en: data.title_en || undefined,
        content_uz_latin: data.content_uz_latin || undefined,
        content_uz_cyrillic: data.content_uz_cyrillic || undefined,
        content_ru: data.content_ru || undefined,
        content_en: data.content_en || undefined,
      };

      const article = await createArticle(payload);
      router.push(`/admin/articles/${article.id}`);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      if (err instanceof ApiError && err.detail) {
        const detail = err.detail;
        if (typeof detail === "object" && "detail" in detail) {
          setError(String((detail as { detail: string }).detail));
        } else if (Array.isArray(detail)) {
          setError(detail.map((d) => d.msg || String(d)).join(", "));
        } else {
          setError(JSON.stringify(detail));
        }
      } else {
        setError(
          err instanceof Error ? err.message : "Failed to create article"
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch content values for the markdown editor
  const contentUzLatin = watch("content_uz_latin") || "";
  const contentUzCyrillic = watch("content_uz_cyrillic") || "";
  const contentRu = watch("content_ru") || "";
  const contentEn = watch("content_en") || "";

  const getContentValue = () => {
    switch (activeTab) {
      case "uz_latin":
        return contentUzLatin;
      case "uz_cyrillic":
        return contentUzCyrillic;
      case "ru":
        return contentRu;
      case "en":
        return contentEn;
    }
  };

  const setContentValue = (value: string) => {
    switch (activeTab) {
      case "uz_latin":
        setValue("content_uz_latin", value);
        break;
      case "uz_cyrillic":
        setValue("content_uz_cyrillic", value);
        break;
      case "ru":
        setValue("content_ru", value);
        break;
      case "en":
        setValue("content_en", value);
        break;
    }
  };

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading...
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Article
          </h1>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  {...register("category_id", { valueAsNumber: true })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_uz_latin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug (optional, auto-generated if empty)
                </label>
                <input
                  {...register("slug")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="my-article-slug"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6 space-y-6">
              {/* Title input for current language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                {activeTab === "uz_latin" && (
                  <input
                    {...register("title_uz_latin")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Article title in O'zbekcha (Lotin)"
                  />
                )}
                {activeTab === "uz_cyrillic" && (
                  <input
                    {...register("title_uz_cyrillic")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Мақола сарлавҳаси Ўзбекча (Кирилл)"
                  />
                )}
                {activeTab === "ru" && (
                  <input
                    {...register("title_ru")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Заголовок статьи на русском"
                  />
                )}
                {activeTab === "en" && (
                  <input
                    {...register("title_en")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Article title in English"
                  />
                )}
              </div>

              {/* Content (Markdown) for current language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Content (Markdown)
                </label>
                <MarkdownEditor
                  value={getContentValue()}
                  onChange={setContentValue}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Creating..." : "Save Draft"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
