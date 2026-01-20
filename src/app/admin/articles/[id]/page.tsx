"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { LanguageTabs } from "@/components/LanguageTabs";
import { MarkdownEditor } from "@/components/MarkdownEditor";
import {
  listCategories,
  getArticle,
  updateArticle,
  publishArticle,
  unpublishArticle,
  deleteArticle,
  getArticleMissingLanguages,
  UnauthorizedError,
  ApiError,
} from "@/lib/api";
import type { Article, Category, ArticleUpdate, LanguageKey } from "@/types";

interface ArticleFormData extends ArticleUpdate {
  category_id: number;
}

export default function EditArticlePage() {
  const router = useRouter();
  const params = useParams();
  const articleId = parseInt(params.id as string);

  const [article, setArticle] = useState<Article | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageKey>("uz_latin");

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<ArticleFormData>();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [articleData, categoriesData] = await Promise.all([
        getArticle(articleId),
        listCategories(),
      ]);

      setArticle(articleData);
      setCategories(categoriesData);

      reset({
        slug: articleData.slug,
        category_id: articleData.category_id,
        title_uz_latin: articleData.title_uz_latin || "",
        title_uz_cyrillic: articleData.title_uz_cyrillic || "",
        title_ru: articleData.title_ru || "",
        title_en: articleData.title_en || "",
        content_uz_latin: articleData.content_uz_latin || "",
        content_uz_cyrillic: articleData.content_uz_cyrillic || "",
        content_ru: articleData.content_ru || "",
        content_en: articleData.content_en || "",
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load article");
    } finally {
      setIsLoading(false);
    }
  }, [articleId, router, reset]);

  useEffect(() => {
    if (articleId) {
      fetchData();
    }
  }, [articleId, fetchData]);

  const onSubmit = async (data: ArticleFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: ArticleUpdate = {
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

      const updated = await updateArticle(articleId, payload);
      setArticle(updated);
      setSuccessMessage("Article saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to update article");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setError(null);
      setSuccessMessage(null);

      const updated = await publishArticle(articleId);
      setArticle(updated);
      setSuccessMessage("Article published successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to publish article");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setIsPublishing(true);
      setError(null);

      const updated = await unpublishArticle(articleId);
      setArticle(updated);
      setSuccessMessage("Article unpublished successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to unpublish article");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this article? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setError(null);
      await deleteArticle(articleId);
      router.push("/admin/articles");
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to delete article");
    }
  };

  const handleApiError = (err: unknown, defaultMessage: string) => {
    if (err instanceof ApiError && err.detail) {
      const detail = err.detail;
      if (typeof detail === "object" && detail !== null) {
        if ("detail" in detail) {
          setError(String((detail as { detail: string }).detail));
          return;
        }
      }
      if (Array.isArray(detail)) {
        setError(
          detail
            .map((d) => (typeof d === "object" && d.msg ? d.msg : String(d)))
            .join(", ")
        );
        return;
      }
      setError(JSON.stringify(detail));
    } else {
      setError(err instanceof Error ? err.message : defaultMessage);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleString();
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

  const missingLanguages = article ? getArticleMissingLanguages(article) : [];

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading article...
        </div>
      </ProtectedLayout>
    );
  }

  if (!article) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Article not found</p>
          <button
            onClick={() => router.push("/admin/articles")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Articles
          </button>
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Edit Article #{article.id}
          </h1>
          <button
            onClick={() => router.push("/admin/articles")}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Articles
          </button>
        </div>

        {/* Status and Meta Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Status
              </span>
              <span
                className={`inline-block mt-1 px-2 py-1 rounded-full text-xs font-medium ${
                  article.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : article.status === "draft"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {article.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Views
              </span>
              <span className="text-gray-900 dark:text-white">
                {article.views_count}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Created
              </span>
              <span className="text-gray-900 dark:text-white text-xs">
                {formatDate(article.created_at)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Updated
              </span>
              <span className="text-gray-900 dark:text-white text-xs">
                {formatDate(article.updated_at)}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Published
              </span>
              <span className="text-gray-900 dark:text-white text-xs">
                {formatDate(article.published_at)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded">
            {successMessage}
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
                  Slug
                </label>
                <input
                  {...register("slug")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              missingLanguages={missingLanguages}
            />

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

          <div className="flex flex-wrap justify-between gap-4">
            <div className="space-x-2">
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
              >
                Delete
              </button>
            </div>
            <div className="space-x-2">
              {article.status === "draft" && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isPublishing ? "Publishing..." : "Publish"}
                </button>
              )}
              {article.status === "published" && (
                <button
                  type="button"
                  onClick={handleUnpublish}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
                >
                  {isPublishing ? "Unpublishing..." : "Unpublish"}
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
