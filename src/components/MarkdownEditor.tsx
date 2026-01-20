"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  rows = 15,
}: MarkdownEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      <div className="flex border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className={`px-4 py-2 text-sm font-medium ${
            !showPreview
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Write
        </button>
        <button
          type="button"
          onClick={() => setShowPreview(true)}
          className={`px-4 py-2 text-sm font-medium ${
            showPreview
              ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          Preview
        </button>
      </div>

      {showPreview ? (
        <div
          className="p-4 min-h-[300px] bg-white dark:bg-gray-900 markdown-preview prose dark:prose-invert max-w-none"
          style={{ minHeight: `${rows * 1.5}rem` }}
        >
          {value ? (
            <ReactMarkdown>{value}</ReactMarkdown>
          ) : (
            <p className="text-gray-400 dark:text-gray-500 italic">
              Nothing to preview
            </p>
          )}
        </div>
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className="w-full p-4 border-0 focus:ring-0 focus:outline-none resize-y bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400"
        />
      )}
    </div>
  );
}
