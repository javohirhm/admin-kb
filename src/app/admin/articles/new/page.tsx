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
import { translateArticle } from "@/lib/translate";
import { LANGUAGES, type Category, type ArticleCreate, type LanguageKey } from "@/types";

interface ArticleFormData extends ArticleCreate {
  category_id: number;
}

export default function NewArticlePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translateError, setTranslateError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageKey>("uz_latin");

  const { register, handleSubmit, setValue, watch, getValues } =
    useForm<ArticleFormData>({
      defaultValues: {
        slug: "",
        category_id: 0,
        reading_time_minutes: 1,
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

  const pickSourceLanguage = (values: ArticleFormData): LanguageKey | null => {
    const hasText = (lang: LanguageKey) => {
      const title = String(values[`title_${lang}` as keyof ArticleFormData] || "");
      const content = String(
        values[`content_${lang}` as keyof ArticleFormData] || ""
      );
      return title.trim() || content.trim();
    };

    if (hasText(activeTab)) {
      return activeTab;
    }

    for (const { key } of LANGUAGES) {
      if (hasText(key)) {
        return key;
      }
    }

    return null;
  };

  const onSubmit = async (data: ArticleFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      let values = getValues();
      const missingUzLatinTitle = !(values.title_uz_latin || "").trim();
      const missingUzLatinContent = !(values.content_uz_latin || "").trim();

      if (missingUzLatinTitle || missingUzLatinContent) {
        const sourceLanguage = pickSourceLanguage(values);
        if (!sourceLanguage) {
          setError("Add a title or content before saving.");
          return;
        }

        const sourceTitle = String(
          values[`title_${sourceLanguage}` as keyof ArticleFormData] || ""
        );
        const sourceContent = String(
          values[`content_${sourceLanguage}` as keyof ArticleFormData] || ""
        );

        try {
          setIsTranslating(true);
          const targetLanguages = LANGUAGES.map((lang) => lang.key).filter(
            (lang) => lang !== sourceLanguage && lang === "uz_latin"
          );

          const result = await translateArticle({
            sourceLanguage,
            targets: targetLanguages,
            title: sourceTitle,
            content: sourceContent,
          });

          for (const [lang, translation] of Object.entries(
            result.translations
          ) as [LanguageKey, { title: string; content: string }][]) {
            setValue(`title_${lang}` as keyof ArticleFormData, translation.title);
            setValue(
              `content_${lang}` as keyof ArticleFormData,
              translation.content
            );
          }
          values = getValues();
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to auto-translate required language"
          );
          return;
        } finally {
          setIsTranslating(false);
        }
      }

      const payload: ArticleCreate = {
        category_id: values.category_id,
        slug: values.slug || undefined,
        reading_time_minutes: values.reading_time_minutes || undefined,
        title_uz_latin: values.title_uz_latin || undefined,
        title_uz_cyrillic: values.title_uz_cyrillic || undefined,
        title_ru: values.title_ru || undefined,
        title_en: values.title_en || undefined,
        content_uz_latin: values.content_uz_latin || undefined,
        content_uz_cyrillic: values.content_uz_cyrillic || undefined,
        content_ru: values.content_ru || undefined,
        content_en: values.content_en || undefined,
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
  const titleUzLatin = watch("title_uz_latin") || "";
  const titleUzCyrillic = watch("title_uz_cyrillic") || "";
  const titleRu = watch("title_ru") || "";
  const titleEn = watch("title_en") || "";
  const contentUzLatin = watch("content_uz_latin") || "";
  const contentUzCyrillic = watch("content_uz_cyrillic") || "";
  const contentRu = watch("content_ru") || "";
  const contentEn = watch("content_en") || "";

  // Compute missing languages for visual indicator
  const missingLanguages = LANGUAGES.map((lang) => lang.key).filter((lang) => {
    const title =
      lang === "uz_latin"
        ? titleUzLatin
        : lang === "uz_cyrillic"
        ? titleUzCyrillic
        : lang === "ru"
        ? titleRu
        : titleEn;
    const content =
      lang === "uz_latin"
        ? contentUzLatin
        : lang === "uz_cyrillic"
        ? contentUzCyrillic
        : lang === "ru"
        ? contentRu
        : contentEn;
    return !title.trim() || !content.trim();
  });

  const getTitleValue = () => {
    switch (activeTab) {
      case "uz_latin":
        return titleUzLatin;
      case "uz_cyrillic":
        return titleUzCyrillic;
      case "ru":
        return titleRu;
      case "en":
        return titleEn;
    }
  };

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

  const handleAutoTranslate = async () => {
    setTranslateError(null);

    const sourceTitle = (getTitleValue() || "").trim();
    const sourceContent = (getContentValue() || "").trim();
    if (!sourceTitle && !sourceContent) {
      setTranslateError("Enter a title or content before translating.");
      return;
    }

    const targetLanguages = LANGUAGES.map((lang) => lang.key).filter(
      (lang) => lang !== activeTab
    );

    const existingTargets = targetLanguages.filter((lang) => {
      const currentTitle = String(
        getValues(`title_${lang}` as keyof ArticleFormData) || ""
      );
      const currentContent = String(
        getValues(`content_${lang}` as keyof ArticleFormData) || ""
      );
      return currentTitle.trim() || currentContent.trim();
    });

    if (existingTargets.length > 0) {
      const existingLabels = existingTargets
        .map(
          (lang) => LANGUAGES.find((item) => item.key === lang)?.label || lang
        )
        .join(", ");
      if (
        !confirm(
          `This will overwrite existing translations for: ${existingLabels}. Continue?`
        )
      ) {
        return;
      }
    }

    try {
      setIsTranslating(true);
      const result = await translateArticle({
        sourceLanguage: activeTab,
        targets: targetLanguages,
        title: sourceTitle,
        content: sourceContent,
      });

      for (const [lang, translation] of Object.entries(
        result.translations
      ) as [LanguageKey, { title: string; content: string }][]) {
        setValue(`title_${lang}` as keyof ArticleFormData, translation.title);
        setValue(`content_${lang}` as keyof ArticleFormData, translation.content);
      }
    } catch (err) {
      setTranslateError(
        err instanceof Error ? err.message : "Translation failed"
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const activeLanguageLabel =
    LANGUAGES.find((language) => language.key === activeTab)?.label || activeTab;

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Reading Time (minutes)
                </label>
                <input
                  {...register("reading_time_minutes", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} missingLanguages={missingLanguages} />

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Write in one language and auto-translate the rest.
              </p>
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={isTranslating || isSubmitting}
                className="px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 disabled:opacity-60 dark:bg-blue-900/30 dark:text-blue-200 dark:hover:bg-blue-900/50"
              >
                {isTranslating
                  ? "Translating..."
                  : `Auto-translate from ${activeLanguageLabel}`}
              </button>
            </div>

            {translateError && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                {translateError}
              </div>
            )}

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
