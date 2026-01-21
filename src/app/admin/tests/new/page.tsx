"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { LanguageTabs } from "@/components/LanguageTabs";
import {
  listTestCategories,
  createTest,
  UnauthorizedError,
  ApiError,
} from "@/lib/api";
import type { TestCategory, TestCreate, LanguageKey } from "@/types";

interface TestFormData extends TestCreate {
  category_id: number | null;
}

export default function NewTestPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageKey>("uz_latin");

  const { register, handleSubmit, setValue, watch } = useForm<TestFormData>({
    defaultValues: {
      slug: "",
      category_id: null,
      title_uz_latin: "",
      title_uz_cyrillic: "",
      title_ru: "",
      title_en: "",
      description_uz_latin: "",
      description_uz_cyrillic: "",
      description_ru: "",
      description_en: "",
      icon: "",
      estimated_minutes: 5,
    },
  });

  const fetchCategories = useCallback(async () => {
    try {
      const data = await listTestCategories();
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

  const onSubmit = async (data: TestFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload: TestCreate = {
        category_id: data.category_id || undefined,
        slug: data.slug || undefined,
        title_uz_latin: data.title_uz_latin,
        title_uz_cyrillic: data.title_uz_cyrillic || undefined,
        title_ru: data.title_ru || undefined,
        title_en: data.title_en || undefined,
        description_uz_latin: data.description_uz_latin || undefined,
        description_uz_cyrillic: data.description_uz_cyrillic || undefined,
        description_ru: data.description_ru || undefined,
        description_en: data.description_en || undefined,
        icon: data.icon || undefined,
        estimated_minutes: data.estimated_minutes,
      };

      const test = await createTest(payload);
      router.push(`/admin/tests/${test.id}`);
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
        setError(err instanceof Error ? err.message : "Failed to create test");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Watch description values
  const descUzLatin = watch("description_uz_latin") || "";
  const descUzCyrillic = watch("description_uz_cyrillic") || "";
  const descRu = watch("description_ru") || "";
  const descEn = watch("description_en") || "";

  const getDescValue = () => {
    switch (activeTab) {
      case "uz_latin":
        return descUzLatin;
      case "uz_cyrillic":
        return descUzCyrillic;
      case "ru":
        return descRu;
      case "en":
        return descEn;
    }
  };

  const setDescValue = (value: string) => {
    switch (activeTab) {
      case "uz_latin":
        setValue("description_uz_latin", value);
        break;
      case "uz_cyrillic":
        setValue("description_uz_cyrillic", value);
        break;
      case "ru":
        setValue("description_ru", value);
        break;
      case "en":
        setValue("description_en", value);
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
            Create New Test
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
            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Category
                </label>
                <select
                  {...register("category_id", { valueAsNumber: true })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">No Category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name_uz_latin}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug (optional, auto-generated)
                </label>
                <input
                  {...register("slug")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="stress-test"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Estimated Duration (minutes)
                </label>
                <input
                  {...register("estimated_minutes", { valueAsNumber: true })}
                  type="number"
                  min="1"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Icon (optional)
              </label>
              <input
                {...register("icon")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="brain, heart, sleep, activity..."
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LanguageTabs activeTab={activeTab} onTabChange={setActiveTab} />

            <div className="mt-6 space-y-6">
              {/* Title input for current language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title *
                </label>
                {activeTab === "uz_latin" && (
                  <input
                    {...register("title_uz_latin", {
                      required: "Title is required",
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Stress darajasi testi"
                  />
                )}
                {activeTab === "uz_cyrillic" && (
                  <input
                    {...register("title_uz_cyrillic")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Стресс даражаси тести"
                  />
                )}
                {activeTab === "ru" && (
                  <input
                    {...register("title_ru")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Тест уровня стресса"
                  />
                )}
                {activeTab === "en" && (
                  <input
                    {...register("title_en")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="Stress Level Test"
                  />
                )}
              </div>

              {/* Description for current language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={getDescValue()}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Bir necha daqiqada stress, uyqu va umumiy holatingizni bilib oling..."
                />
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 px-4 py-3 rounded">
            After creating the test, you can add questions, answer options, and
            result ranges on the edit page.
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
              {isSubmitting ? "Creating..." : "Create Test"}
            </button>
          </div>
        </form>
      </div>
    </ProtectedLayout>
  );
}
