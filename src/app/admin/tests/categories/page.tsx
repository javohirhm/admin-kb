"use client";

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { Modal } from "@/components/Modal";
import {
  listTestCategories,
  createTestCategory,
  updateTestCategory,
  deleteTestCategory,
  UnauthorizedError,
} from "@/lib/api";
import type { TestCategory, TestCategoryCreate } from "@/types";

type CategoryFormData = TestCategoryCreate;

export default function TestCategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<TestCategory | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CategoryFormData>();

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await listTestCategories();
      setCategories(data);
      setError(null);
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
  }, [router]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const openCreateModal = () => {
    setEditingCategory(null);
    reset({
      slug: "",
      icon: "",
      color: "",
      sort_order: 0,
      is_active: true,
      name_uz_latin: "",
      name_uz_cyrillic: "",
      name_ru: "",
      name_en: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (category: TestCategory) => {
    setEditingCategory(category);
    reset({
      slug: category.slug,
      icon: category.icon || "",
      color: category.color || "",
      sort_order: category.sort_order,
      is_active: category.is_active,
      name_uz_latin: category.name_uz_latin,
      name_uz_cyrillic: category.name_uz_cyrillic || "",
      name_ru: category.name_ru || "",
      name_en: category.name_en || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    reset();
  };

  const onSubmit = async (data: CategoryFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        ...data,
        icon: data.icon || null,
        color: data.color || null,
      };

      if (editingCategory) {
        await updateTestCategory(editingCategory.id, payload);
      } else {
        await createTestCategory(payload);
      }

      closeModal();
      fetchCategories();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: TestCategory) => {
    if (
      !confirm(`Are you sure you want to delete "${category.name_uz_latin}"?`)
    ) {
      return;
    }

    try {
      await deleteTestCategory(category.id);
      fetchCategories();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setError(
        err instanceof Error ? err.message : "Failed to delete category"
      );
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/tests"
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              &larr; Back to Tests
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Test Categories
            </h1>
          </div>
          <button
            onClick={openCreateModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Create Category
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            No categories found. Create your first category.
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Slug
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name (UZ Latin)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Color
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Active
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Sort Order
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {category.id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {category.slug}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        {category.icon && <span>{category.icon}</span>}
                        {category.name_uz_latin}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {category.color && (
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="text-xs text-gray-500">
                            {category.color}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          category.is_active
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {category.is_active ? "Active" : "Disabled"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {category.sort_order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm space-x-2">
                      <button
                        onClick={() => openEditModal(category)}
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={editingCategory ? "Edit Category" : "Create Category"}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Slug
                </label>
                <input
                  {...register("slug", { required: "Slug is required" })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.slug.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Icon (optional)
                </label>
                <input
                  {...register("icon")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="icon-name or emoji"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Color (hex)
                </label>
                <input
                  {...register("color")}
                  type="text"
                  placeholder="#FF5733"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Sort Order
                </label>
                <input
                  {...register("sort_order", { valueAsNumber: true })}
                  type="number"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div className="flex items-center pt-6">
                <input
                  {...register("is_active")}
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Active
                </label>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Names (all languages)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    O&apos;zbekcha (Lotin) *
                  </label>
                  <input
                    {...register("name_uz_latin", {
                      required: "Required",
                    })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                  {errors.name_uz_latin && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.name_uz_latin.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ўзбекча (Кирилл)
                  </label>
                  <input
                    {...register("name_uz_cyrillic")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Русский
                  </label>
                  <input
                    {...register("name_ru")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    English
                  </label>
                  <input
                    {...register("name_en")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSubmitting
                  ? "Saving..."
                  : editingCategory
                  ? "Update"
                  : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    </ProtectedLayout>
  );
}
