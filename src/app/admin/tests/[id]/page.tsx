"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { ProtectedLayout } from "@/components/ProtectedLayout";
import { LanguageTabs } from "@/components/LanguageTabs";
import { Modal } from "@/components/Modal";
import {
  listTestCategories,
  getTest,
  updateTest,
  publishTest,
  unpublishTest,
  deleteTest,
  createTestQuestion,
  updateTestQuestion,
  deleteTestQuestion,
  createTestOption,
  updateTestOption,
  deleteTestOption,
  createTestResultRange,
  updateTestResultRange,
  deleteTestResultRange,
  getTestMissingLanguages,
  UnauthorizedError,
  ApiError,
} from "@/lib/api";
import type {
  TestCategory,
  TestFull,
  TestUpdate,
  TestQuestionWithOptions,
  TestOptionInQuestion,
  TestResultRangeInTest,
  TestQuestionCreate,
  TestOptionCreate,
  TestResultRangeCreate,
  LanguageKey,
  ResultLevel,
} from "@/types";

interface TestFormData extends TestUpdate {
  category_id: number | null;
}

const RESULT_LEVELS: { value: ResultLevel; label: string; color: string }[] = [
  { value: "bad", label: "Yomon (Bad)", color: "#EF4444" },
  { value: "average", label: "O'rtacha (Average)", color: "#F59E0B" },
  { value: "good", label: "Yaxshi (Good)", color: "#10B981" },
  { value: "excellent", label: "A'lo (Excellent)", color: "#06B6D4" },
];

export default function EditTestPage() {
  const router = useRouter();
  const params = useParams();
  const testId = parseInt(params.id as string);

  const [test, setTest] = useState<TestFull | null>(null);
  const [categories, setCategories] = useState<TestCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LanguageKey>("uz_latin");

  // Question modal state
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] =
    useState<TestQuestionWithOptions | null>(null);

  // Option modal state
  const [optionModalOpen, setOptionModalOpen] = useState(false);
  const [editingOption, setEditingOption] = useState<TestOptionInQuestion | null>(null);
  const [currentQuestionId, setCurrentQuestionId] = useState<number | null>(null);

  // Result range modal state
  const [rangeModalOpen, setRangeModalOpen] = useState(false);
  const [editingRange, setEditingRange] = useState<TestResultRangeInTest | null>(null);

  const { register, handleSubmit, setValue, watch, reset } =
    useForm<TestFormData>();

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [testData, categoriesData] = await Promise.all([
        getTest(testId),
        listTestCategories(),
      ]);

      setTest(testData);
      setCategories(categoriesData.filter((c) => c.is_active));

      reset({
        slug: testData.slug,
        category_id: testData.category_id,
        title_uz_latin: testData.title_uz_latin || "",
        title_uz_cyrillic: testData.title_uz_cyrillic || "",
        title_ru: testData.title_ru || "",
        title_en: testData.title_en || "",
        description_uz_latin: testData.description_uz_latin || "",
        description_uz_cyrillic: testData.description_uz_cyrillic || "",
        description_ru: testData.description_ru || "",
        description_en: testData.description_en || "",
        icon: testData.icon || "",
        estimated_minutes: testData.estimated_minutes,
      });
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      setError(err instanceof Error ? err.message : "Failed to load test");
    } finally {
      setIsLoading(false);
    }
  }, [testId, router, reset]);

  useEffect(() => {
    if (testId) {
      fetchData();
    }
  }, [testId, fetchData]);

  const onSubmit = async (data: TestFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      setSuccessMessage(null);

      const payload: TestUpdate = {
        category_id: data.category_id || undefined,
        slug: data.slug || undefined,
        title_uz_latin: data.title_uz_latin || undefined,
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

      await updateTest(testId, payload);
      await fetchData();
      setSuccessMessage("Test saved successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to update test");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublish = async () => {
    try {
      setIsPublishing(true);
      setError(null);
      setSuccessMessage(null);

      await publishTest(testId);
      await fetchData();
      setSuccessMessage("Test published successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to publish test");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    try {
      setIsPublishing(true);
      setError(null);

      await unpublishTest(testId);
      await fetchData();
      setSuccessMessage("Test unpublished successfully!");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to unpublish test");
    } finally {
      setIsPublishing(false);
    }
  };

  const handleDelete = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this test? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setError(null);
      await deleteTest(testId);
      router.push("/admin/tests");
    } catch (err) {
      if (err instanceof UnauthorizedError) {
        router.push("/admin/login");
        return;
      }
      handleApiError(err, "Failed to delete test");
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
        if ("message" in detail) {
          setError(String((detail as { message: string }).message));
          return;
        }
        if ("missing_fields" in detail) {
          const fields = (detail as { missing_fields: string[] }).missing_fields;
          setError(`Missing: ${fields.join(", ")}`);
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

  // Question handlers
  const handleAddQuestion = () => {
    setEditingQuestion(null);
    setQuestionModalOpen(true);
  };

  const handleEditQuestion = (question: TestQuestionWithOptions) => {
    setEditingQuestion(question);
    setQuestionModalOpen(true);
  };

  const handleDeleteQuestion = async (questionId: number) => {
    if (!confirm("Delete this question and all its options?")) return;
    try {
      await deleteTestQuestion(questionId);
      await fetchData();
    } catch (err) {
      handleApiError(err, "Failed to delete question");
    }
  };

  const handleSaveQuestion = async (data: TestQuestionCreate) => {
    try {
      if (editingQuestion) {
        await updateTestQuestion(editingQuestion.id, data);
      } else {
        await createTestQuestion(testId, data);
      }
      setQuestionModalOpen(false);
      await fetchData();
    } catch (err) {
      handleApiError(err, "Failed to save question");
    }
  };

  // Option handlers
  const handleAddOption = (questionId: number) => {
    setCurrentQuestionId(questionId);
    setEditingOption(null);
    setOptionModalOpen(true);
  };

  const handleEditOption = (questionId: number, option: TestOptionInQuestion) => {
    setCurrentQuestionId(questionId);
    setEditingOption(option);
    setOptionModalOpen(true);
  };

  const handleDeleteOption = async (optionId: number) => {
    if (!confirm("Delete this option?")) return;
    try {
      await deleteTestOption(optionId);
      await fetchData();
    } catch (err) {
      handleApiError(err, "Failed to delete option");
    }
  };

  const handleSaveOption = async (data: TestOptionCreate) => {
    try {
      if (editingOption) {
        await updateTestOption(editingOption.id, data);
      } else if (currentQuestionId) {
        await createTestOption(currentQuestionId, data);
      }
      setOptionModalOpen(false);
      await fetchData();
    } catch (err) {
      handleApiError(err, "Failed to save option");
    }
  };

  // Result range handlers
  const handleAddRange = () => {
    setEditingRange(null);
    setRangeModalOpen(true);
  };

  const handleEditRange = (range: TestResultRangeInTest) => {
    setEditingRange(range);
    setRangeModalOpen(true);
  };

  const handleDeleteRange = async (rangeId: number) => {
    if (!confirm("Delete this result range?")) return;
    try {
      await deleteTestResultRange(rangeId);
      await fetchData();
    } catch (err) {
      handleApiError(err, "Failed to delete range");
    }
  };

  const handleSaveRange = async (data: TestResultRangeCreate) => {
    try {
      if (editingRange) {
        await updateTestResultRange(editingRange.id, data);
      } else {
        await createTestResultRange(testId, data);
      }
      setRangeModalOpen(false);
      await fetchData();
    } catch (err) {
      handleApiError(err, "Failed to save range");
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

  const missingLanguages = test ? getTestMissingLanguages(test) : [];

  if (isLoading) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          Loading test...
        </div>
      </ProtectedLayout>
    );
  }

  if (!test) {
    return (
      <ProtectedLayout>
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">Test not found</p>
          <button
            onClick={() => router.push("/admin/tests")}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Back to Tests
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
            Edit Test #{test.id}
          </h1>
          <button
            onClick={() => router.push("/admin/tests")}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            &larr; Back to Tests
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
                  test.status === "published"
                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                    : test.status === "draft"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
                    : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                }`}
              >
                {test.status}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Questions
              </span>
              <span className="text-gray-900 dark:text-white">
                {test.questions.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Result Ranges
              </span>
              <span className="text-gray-900 dark:text-white">
                {test.result_ranges.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Duration
              </span>
              <span className="text-gray-900 dark:text-white">
                {test.estimated_minutes} min
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 block">
                Slug
              </span>
              <span className="text-gray-900 dark:text-white text-xs">
                {test.slug}
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

        {/* Basic Info Form */}
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
                  Slug
                </label>
                <input
                  {...register("slug")}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Duration (minutes)
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
                Icon
              </label>
              <input
                {...register("icon")}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <LanguageTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              missingLanguages={missingLanguages}
            />

            <div className="mt-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title
                </label>
                {activeTab === "uz_latin" && (
                  <input
                    {...register("title_uz_latin")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
                {activeTab === "uz_cyrillic" && (
                  <input
                    {...register("title_uz_cyrillic")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
                {activeTab === "ru" && (
                  <input
                    {...register("title_ru")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
                {activeTab === "en" && (
                  <input
                    {...register("title_en")}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={getDescValue()}
                  onChange={(e) => setDescValue(e.target.value)}
                  rows={3}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>

        {/* Questions Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Questions ({test.questions.length})
            </h2>
            <button
              onClick={handleAddQuestion}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Add Question
            </button>
          </div>

          {test.questions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No questions yet. Add your first question.
            </p>
          ) : (
            <div className="space-y-4">
              {test.questions
                .sort((a, b) => a.order - b.order)
                .map((question, idx) => (
                  <div
                    key={question.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                          Q{idx + 1}.
                        </span>
                        <span className="ml-2 text-gray-900 dark:text-white">
                          {question.question_uz_latin}
                        </span>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditQuestion(question)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(question.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="ml-4 mt-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Options ({question.options.length})
                        </span>
                        <button
                          onClick={() => handleAddOption(question.id)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          + Add Option
                        </button>
                      </div>
                      {question.options.length === 0 ? (
                        <p className="text-xs text-gray-400">No options</p>
                      ) : (
                        <div className="space-y-1">
                          {question.options
                            .sort((a, b) => a.order - b.order)
                            .map((option) => (
                              <div
                                key={option.id}
                                className="flex justify-between items-center py-1 px-2 bg-gray-50 dark:bg-gray-700 rounded text-sm"
                              >
                                <span className="text-gray-700 dark:text-gray-300">
                                  {option.label_uz_latin}
                                  <span className="ml-2 text-xs text-gray-500">
                                    (score: {option.score})
                                  </span>
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() =>
                                      handleEditOption(question.id, option)
                                    }
                                    className="text-blue-600 hover:text-blue-800 text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteOption(option.id)}
                                    className="text-red-600 hover:text-red-800 text-xs"
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Result Ranges Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">
              Result Ranges ({test.result_ranges.length})
            </h2>
            <button
              onClick={handleAddRange}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
            >
              Add Range
            </button>
          </div>

          {test.result_ranges.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No result ranges yet. Add ranges to define score interpretations.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Score Range
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Level
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Label
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Color
                    </th>
                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {test.result_ranges
                    .sort((a, b) => a.min_score - b.min_score)
                    .map((range) => (
                      <tr key={range.id}>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {range.min_score} - {range.max_score}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white capitalize">
                          {range.level}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {range.label_uz_latin}
                        </td>
                        <td className="px-4 py-2">
                          {range.color && (
                            <div
                              className="w-6 h-6 rounded border"
                              style={{ backgroundColor: range.color }}
                            />
                          )}
                        </td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button
                            onClick={() => handleEditRange(range)}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteRange(range.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
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
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-between gap-4">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete Test
          </button>
          <div className="space-x-2">
            {test.status === "draft" && (
              <button
                type="button"
                onClick={handlePublish}
                disabled={isPublishing}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {isPublishing ? "Publishing..." : "Publish"}
              </button>
            )}
            {test.status === "published" && (
              <button
                type="button"
                onClick={handleUnpublish}
                disabled={isPublishing}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
              >
                {isPublishing ? "Unpublishing..." : "Unpublish"}
              </button>
            )}
          </div>
        </div>

        {/* Question Modal */}
        <QuestionModal
          isOpen={questionModalOpen}
          onClose={() => setQuestionModalOpen(false)}
          question={editingQuestion}
          onSave={handleSaveQuestion}
          nextOrder={test.questions.length + 1}
        />

        {/* Option Modal */}
        <OptionModal
          isOpen={optionModalOpen}
          onClose={() => setOptionModalOpen(false)}
          option={editingOption}
          onSave={handleSaveOption}
        />

        {/* Range Modal */}
        <RangeModal
          isOpen={rangeModalOpen}
          onClose={() => setRangeModalOpen(false)}
          range={editingRange}
          onSave={handleSaveRange}
        />
      </div>
    </ProtectedLayout>
  );
}

// Question Modal Component
function QuestionModal({
  isOpen,
  onClose,
  question,
  onSave,
  nextOrder,
}: {
  isOpen: boolean;
  onClose: () => void;
  question: TestQuestionWithOptions | null;
  onSave: (data: TestQuestionCreate) => Promise<void>;
  nextOrder: number;
}) {
  const { register, handleSubmit, reset } = useForm<TestQuestionCreate>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      reset({
        question_uz_latin: question?.question_uz_latin || "",
        question_uz_cyrillic: question?.question_uz_cyrillic || "",
        question_ru: question?.question_ru || "",
        question_en: question?.question_en || "",
        order: question?.order || nextOrder,
      });
    }
  }, [isOpen, question, nextOrder, reset]);

  const onSubmit = async (data: TestQuestionCreate) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={question ? "Edit Question" : "Add Question"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Question (O&apos;zbekcha) *
          </label>
          <textarea
            {...register("question_uz_latin", { required: true })}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Question (Ўзбекча)
          </label>
          <textarea
            {...register("question_uz_cyrillic")}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Question (Русский)
          </label>
          <textarea
            {...register("question_ru")}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Question (English)
          </label>
          <textarea
            {...register("question_en")}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Order
          </label>
          <input
            {...register("order", { valueAsNumber: true })}
            type="number"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Option Modal Component
function OptionModal({
  isOpen,
  onClose,
  option,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  option: TestOptionInQuestion | null;
  onSave: (data: TestOptionCreate) => Promise<void>;
}) {
  const { register, handleSubmit, reset } = useForm<TestOptionCreate>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      reset({
        label_uz_latin: option?.label_uz_latin || "",
        label_uz_cyrillic: option?.label_uz_cyrillic || "",
        label_ru: option?.label_ru || "",
        label_en: option?.label_en || "",
        score: option?.score || 0,
        order: option?.order || 0,
      });
    }
  }, [isOpen, option, reset]);

  const onSubmit = async (data: TestOptionCreate) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={option ? "Edit Option" : "Add Option"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Label (O&apos;zbekcha) *
          </label>
          <input
            {...register("label_uz_latin", { required: true })}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Label (Ўзбекча)
          </label>
          <input
            {...register("label_uz_cyrillic")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Label (Русский)
          </label>
          <input
            {...register("label_ru")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Label (English)
          </label>
          <input
            {...register("label_en")}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Score
            </label>
            <input
              {...register("score", { valueAsNumber: true })}
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Order
            </label>
            <input
              {...register("order", { valueAsNumber: true })}
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Range Modal Component
function RangeModal({
  isOpen,
  onClose,
  range,
  onSave,
}: {
  isOpen: boolean;
  onClose: () => void;
  range: TestResultRangeInTest | null;
  onSave: (data: TestResultRangeCreate) => Promise<void>;
}) {
  const { register, handleSubmit, reset } = useForm<TestResultRangeCreate>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      reset({
        min_score: range?.min_score || 0,
        max_score: range?.max_score || 10,
        level: range?.level || "average",
        label_uz_latin: range?.label_uz_latin || "",
        label_uz_cyrillic: range?.label_uz_cyrillic || "",
        label_ru: range?.label_ru || "",
        label_en: range?.label_en || "",
        color: range?.color || "#10B981",
        recommendation_uz_latin: range?.recommendation_uz_latin || "",
        recommendation_uz_cyrillic: range?.recommendation_uz_cyrillic || "",
        recommendation_ru: range?.recommendation_ru || "",
        recommendation_en: range?.recommendation_en || "",
      });
    }
  }, [isOpen, range, reset]);

  const onSubmit = async (data: TestResultRangeCreate) => {
    setIsSubmitting(true);
    await onSave(data);
    setIsSubmitting(false);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={range ? "Edit Result Range" : "Add Result Range"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Min Score
            </label>
            <input
              {...register("min_score", { valueAsNumber: true })}
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Max Score
            </label>
            <input
              {...register("max_score", { valueAsNumber: true })}
              type="number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Level
            </label>
            <select
              {...register("level")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {RESULT_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Color
            </label>
            <input
              {...register("color")}
              type="text"
              placeholder="#10B981"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Label (O&apos;zbekcha) *
          </label>
          <input
            {...register("label_uz_latin", { required: true })}
            placeholder="Yomon, O'rtacha, Yaxshi, A'lo"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Recommendation (O&apos;zbekcha)
          </label>
          <textarea
            {...register("recommendation_uz_latin")}
            rows={2}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
