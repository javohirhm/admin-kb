"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import {
  listTests,
  listTestCategories,
  deleteTest,
  publishTest,
  unpublishTest,
  getTestMissingLanguages,
  UnauthorizedError,
} from "@/lib/api";
import type { Test, TestCategory, TestStatus } from "@/types";

export default function TestsPage() {
  const router = useRouter();
  const [tests, setTests] = useState<Test[]>([]);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [testsData, categoriesData] = await Promise.all([
        listTests({
          status: statusFilter || undefined,
        }),
        listTestCategories(),
      ]);
      setTests(testsData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [router, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredTests = useMemo(() => {
    if (!searchQuery.trim()) return tests;

    const query = searchQuery.toLowerCase();
    return tests.filter(
      (test) =>
        test.title_uz_latin?.toLowerCase().includes(query) ||
        test.title_uz_cyrillic?.toLowerCase().includes(query) ||
        test.title_ru?.toLowerCase().includes(query) ||
        test.title_en?.toLowerCase().includes(query) ||
        test.slug?.toLowerCase().includes(query)
    );
  }, [tests, searchQuery]);

  const getCategoryName = (categoryId: number | null | undefined) => {
    if (!categoryId) return "-";
    const category = categories.find((c) => c.id === categoryId);
    return category?.name_uz_latin || `Category #${categoryId}`;
  };

  const handlePublish = async (test: Test) => {
    try {
      setActionError(null);
      await publishTest(test.id);
      fetchData();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      const errorMsg =
        err instanceof Error ? err.message : "Failed to publish test";
      setActionError(errorMsg);
    }
  };

  const handleUnpublish = async (test: Test) => {
    try {
      setActionError(null);
      await unpublishTest(test.id);
      fetchData();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Failed to unpublish test"
      );
    }
  };

  const handleDelete = async (test: Test) => {
    if (
      !confirm(
        `Are you sure you want to delete "${test.title_uz_latin || test.slug}"?`
      )
    ) {
      return;
    }

    try {
      setActionError(null);
      await deleteTest(test.id);
      fetchData();
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setActionError(
        err instanceof Error ? err.message : "Failed to delete test"
      );
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadgeClass = (status: TestStatus) => {
    switch (status) {
      case "published":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "draft":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "archived":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  return (
    <ProtectedLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Health Tests
          </h1>
          <div className="flex gap-2">
            <Link
              href="/admin/tests/categories"
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Categories
            </Link>
            <Link
              href="/admin/tests/new"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Test
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title or slug..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {actionError && (
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
            {actionError}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Loading tests...
          </div>
        ) : filteredTests.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            {tests.length === 0
              ? "No tests found. Create your first test."
              : "No tests match your filters."}
          </div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Questions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Duration
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTests.map((test) => {
                  const missingLangs = getTestMissingLanguages(test);
                  return (
                    <tr key={test.id}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {test.id}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">
                              {test.title_uz_latin || (
                                <span className="text-gray-400 italic">
                                  No title
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {test.slug}
                            </div>
                          </div>
                          {missingLangs.length > 0 && (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300"
                              title={`Missing: ${missingLangs.join(", ")}`}
                            >
                              {missingLangs.length} missing
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(
                            test.status
                          )}`}
                        >
                          {test.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {getCategoryName(test.category_id)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {test.question_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {test.estimated_minutes} min
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(test.updated_at)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm space-x-2">
                        <Link
                          href={`/admin/tests/${test.id}`}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          Edit
                        </Link>
                        {test.status === "draft" && (
                          <button
                            onClick={() => handlePublish(test)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            Publish
                          </button>
                        )}
                        {test.status === "published" && (
                          <button
                            onClick={() => handleUnpublish(test)}
                            className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300"
                          >
                            Unpublish
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(test)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ProtectedLayout>
  );
}
