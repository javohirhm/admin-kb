"use client";

import { LANGUAGES, type LanguageKey } from "@/types";

interface LanguageTabsProps {
  activeTab: LanguageKey;
  onTabChange: (tab: LanguageKey) => void;
  missingLanguages?: string[];
}

export function LanguageTabs({
  activeTab,
  onTabChange,
  missingLanguages = [],
}: LanguageTabsProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-700">
      <nav className="-mb-px flex space-x-4" aria-label="Tabs">
        {LANGUAGES.map(({ key, label }) => {
          const isMissing = missingLanguages.includes(key);
          const isActive = activeTab === key;

          return (
            <button
              key={key}
              onClick={() => onTabChange(key)}
              className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-1 ${
                isActive
                  ? "border-blue-500 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
              }`}
            >
              {label}
              {isMissing && (
                <span className="inline-flex items-center justify-center w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
