"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function Navbar() {
  const { logout, apiUrl } = useAuth();
  const pathname = usePathname();

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                Admin Panel
              </span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                href="/admin/articles"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/admin/articles")
                    ? "border-blue-500 text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                Articles
              </Link>
              <Link
                href="/admin/categories"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/admin/categories")
                    ? "border-blue-500 text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                Categories
              </Link>
              <Link
                href="/admin/tests"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive("/admin/tests")
                    ? "border-blue-500 text-gray-900 dark:text-white"
                    : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white"
                }`}
              >
                Tests
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {apiUrl && (
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden md:block">
                {apiUrl}
              </span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      <div className="sm:hidden border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-4 px-4 py-2">
          <Link
            href="/admin/articles"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/admin/articles")
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Articles
          </Link>
          <Link
            href="/admin/categories"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/admin/categories")
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Categories
          </Link>
          <Link
            href="/admin/tests"
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              isActive("/admin/tests")
                ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            Tests
          </Link>
        </div>
      </div>
    </nav>
  );
}
