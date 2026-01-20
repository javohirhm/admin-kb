"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/lib/auth-context";

interface LoginForm {
  apiUrl: string;
  adminKey: string;
}

export default function LoginPage() {
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    defaultValues: {
      apiUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
      adminKey: "",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    setIsLoading(true);

    try {
      // Test the credentials by making a request via proxy
      const response = await fetch("/api/proxy/api/admin/categories", {
        headers: {
          "X-Backend-URL": data.apiUrl,
          "X-ADMIN-KEY": data.adminKey,
        },
      });

      if (response.status === 401) {
        setError("Invalid admin key");
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        setError(
          errorData?.error || errorData?.detail || `Server error: ${response.status}`
        );
        setIsLoading(false);
        return;
      }

      login(data.apiUrl, data.adminKey);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect to server"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-gray-900 dark:text-white">
            Admin Panel
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Enter your credentials to access the admin panel
          </p>
        </div>

        <form
          className="mt-8 space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow"
          onSubmit={handleSubmit(onSubmit)}
        >
          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="apiUrl"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Backend URL
            </label>
            <input
              {...register("apiUrl", { required: "Backend URL is required" })}
              type="url"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="http://localhost:8000"
            />
            {errors.apiUrl && (
              <p className="mt-1 text-sm text-red-600">
                {errors.apiUrl.message}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="adminKey"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Admin Key
            </label>
            <input
              {...register("adminKey", { required: "Admin key is required" })}
              type="password"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              placeholder="Enter your admin key"
            />
            {errors.adminKey && (
              <p className="mt-1 text-sm text-red-600">
                {errors.adminKey.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Connecting..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
