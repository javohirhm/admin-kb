"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

interface HistoryState {
  undoStack: string[];
  redoStack: string[];
}

type TransformFn = (
  selectedText: string,
  fullText: string,
  start: number,
  end: number
) => { newText: string; newSelectionStart: number; newSelectionEnd: number };

// Toolbar button config
interface ToolbarButtonConfig {
  id: string;
  label: string;
  tooltip: string;
  className?: string;
}

const toolbarButtons: ToolbarButtonConfig[] = [
  { id: "h1", label: "H1", tooltip: "Heading 1" },
  { id: "h2", label: "H2", tooltip: "Heading 2" },
  { id: "h3", label: "H3", tooltip: "Heading 3" },
  { id: "divider1", label: "", tooltip: "" },
  { id: "bold", label: "B", tooltip: "Bold (Ctrl+B)", className: "font-bold" },
  { id: "italic", label: "I", tooltip: "Italic (Ctrl+I)", className: "italic" },
  { id: "code", label: "</>", tooltip: "Inline Code" },
  { id: "divider2", label: "", tooltip: "" },
  { id: "bullets", label: "•", tooltip: "Bullet List" },
  { id: "numbered", label: "1.", tooltip: "Numbered List" },
  { id: "quote", label: '"', tooltip: "Blockquote" },
  { id: "divider3", label: "", tooltip: "" },
  { id: "link", label: "🔗", tooltip: "Link" },
  { id: "image", label: "🖼", tooltip: "Image" },
  { id: "divider4", label: "", tooltip: "" },
  { id: "codeblock", label: "```", tooltip: "Code Block" },
  { id: "table", label: "⊞", tooltip: "Table" },
  { id: "hr", label: "—", tooltip: "Horizontal Line" },
  { id: "divider5", label: "", tooltip: "" },
  { id: "undo", label: "↶", tooltip: "Undo (Ctrl+Z)" },
  { id: "redo", label: "↷", tooltip: "Redo (Ctrl+Y)" },
];

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write your content in Markdown...",
  rows = 15,
}: MarkdownEditorProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"write" | "preview">("write");
  const [hasSelection, setHasSelection] = useState(false);
  const [history, setHistory] = useState<HistoryState>({
    undoStack: [],
    redoStack: [],
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastValueRef = useRef(value);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Track selection changes
  const handleSelectionChange = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      setHasSelection(start !== end);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("selectionchange", handleSelectionChange);
    return () =>
      document.removeEventListener("selectionchange", handleSelectionChange);
  }, [handleSelectionChange]);

  // Push to undo stack helper
  const pushToUndo = useCallback((prevValue: string) => {
    setHistory((prev) => ({
      undoStack: [...prev.undoStack.slice(-50), prevValue],
      redoStack: [],
    }));
  }, []);

  // Apply transform to selected text
  const applyTransform = useCallback(
    (transformFn: TransformFn) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;

      // If no selection, do nothing
      if (start === end) return;

      const selectedText = value.substring(start, end);
      const result = transformFn(selectedText, value, start, end);

      // Push current value to undo stack
      pushToUndo(value);

      // Update value
      onChange(result.newText);

      // Restore selection after React re-renders
      requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(
          result.newSelectionStart,
          result.newSelectionEnd
        );
        handleSelectionChange();
      });
    },
    [value, onChange, pushToUndo, handleSelectionChange]
  );

  // Transform functions for each formatting action
  const transforms: Record<string, TransformFn> = {
    h1: (sel, full, start, end) => {
      const lines = sel.split("\n").map((line) => `# ${line}`);
      const newSel = lines.join("\n");
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
    h2: (sel, full, start, end) => {
      const lines = sel.split("\n").map((line) => `## ${line}`);
      const newSel = lines.join("\n");
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
    h3: (sel, full, start, end) => {
      const lines = sel.split("\n").map((line) => `### ${line}`);
      const newSel = lines.join("\n");
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
    bold: (sel, full, start, end) => {
      const newSel = `**${sel}**`;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + 2,
        newSelectionEnd: start + 2 + sel.length,
      };
    },
    italic: (sel, full, start, end) => {
      const newSel = `*${sel}*`;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + 1,
        newSelectionEnd: start + 1 + sel.length,
      };
    },
    code: (sel, full, start, end) => {
      const newSel = `\`${sel}\``;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + 1,
        newSelectionEnd: start + 1 + sel.length,
      };
    },
    bullets: (sel, full, start, end) => {
      const lines = sel.split("\n").map((line) => {
        if (line.trimStart().startsWith("- ")) return line;
        return `- ${line}`;
      });
      const newSel = lines.join("\n");
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
    numbered: (sel, full, start, end) => {
      const lines = sel.split("\n").map((line, i) => `${i + 1}. ${line}`);
      const newSel = lines.join("\n");
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
    quote: (sel, full, start, end) => {
      const lines = sel.split("\n").map((line) => `> ${line}`);
      const newSel = lines.join("\n");
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
    link: (sel, full, start, end) => {
      const newSel = `[${sel}](https://)`;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + sel.length + 3,
        newSelectionEnd: start + newSel.length - 1,
      };
    },
    image: (sel, full, start, end) => {
      const newSel = `![${sel}](https://)`;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + sel.length + 4,
        newSelectionEnd: start + newSel.length - 1,
      };
    },
    codeblock: (sel, full, start, end) => {
      const newSel = `\`\`\`\n${sel}\n\`\`\``;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + 4,
        newSelectionEnd: start + 4 + sel.length,
      };
    },
    table: (sel, full, start, end) => {
      const newSel = `| Column 1 | Column 2 |\n|---|---|\n| ${sel} |  |`;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start + 34,
        newSelectionEnd: start + 34 + sel.length,
      };
    },
    hr: (sel, full, start, end) => {
      const newSel = `\n---\n`;
      const newText = full.substring(0, start) + newSel + full.substring(end);
      return {
        newText,
        newSelectionStart: start,
        newSelectionEnd: start + newSel.length,
      };
    },
  };

  // Handle toolbar button click
  const handleToolbarClick = useCallback(
    (id: string) => {
      if (id === "undo") {
        if (history.undoStack.length === 0) return;
        const prevValue = history.undoStack[history.undoStack.length - 1];
        setHistory((prev) => ({
          undoStack: prev.undoStack.slice(0, -1),
          redoStack: [...prev.redoStack, value],
        }));
        onChange(prevValue);
        return;
      }

      if (id === "redo") {
        if (history.redoStack.length === 0) return;
        const nextValue = history.redoStack[history.redoStack.length - 1];
        setHistory((prev) => ({
          undoStack: [...prev.undoStack, value],
          redoStack: prev.redoStack.slice(0, -1),
        }));
        onChange(nextValue);
        return;
      }

      if (transforms[id]) {
        applyTransform(transforms[id]);
      }
    },
    [history, value, onChange, applyTransform, transforms]
  );

  // Handle text change with undo tracking
  const handleChange = useCallback(
    (newValue: string) => {
      // Push to undo only if value actually changed (debounce typing)
      if (lastValueRef.current !== newValue) {
        // Simple debounce: only push if change is significant
        const lastVal = lastValueRef.current;
        const timeSinceLastChange =
          Math.abs(newValue.length - lastVal.length) > 10;
        if (timeSinceLastChange || !history.undoStack.length) {
          pushToUndo(lastVal);
        }
        lastValueRef.current = newValue;
      }
      onChange(newValue);
    },
    [onChange, pushToUndo, history.undoStack.length]
  );

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            if (hasSelection) handleToolbarClick("bold");
            break;
          case "i":
            e.preventDefault();
            if (hasSelection) handleToolbarClick("italic");
            break;
          case "z":
            e.preventDefault();
            if (e.shiftKey) {
              handleToolbarClick("redo");
            } else {
              handleToolbarClick("undo");
            }
            break;
          case "y":
            e.preventDefault();
            handleToolbarClick("redo");
            break;
        }
      }
    },
    [hasSelection, handleToolbarClick]
  );

  // Toolbar button component
  const ToolbarButton = ({
    id,
    label,
    tooltip,
    className = "",
  }: {
    id: string;
    label: string;
    tooltip: string;
    className?: string;
  }) => {
    const isUndo = id === "undo";
    const isRedo = id === "redo";
    const isDisabled =
      isUndo
        ? history.undoStack.length === 0
        : isRedo
          ? history.redoStack.length === 0
          : !hasSelection;

    return (
      <button
        type="button"
        title={tooltip}
        disabled={isDisabled}
        onClick={() => handleToolbarClick(id)}
        className={`px-2 py-1 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-30 disabled:cursor-not-allowed ${className}`}
      >
        {label}
      </button>
    );
  };

  // Divider component
  const Divider = () => (
    <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
  );

  // Render toolbar
  const renderToolbar = () => (
    <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
      {toolbarButtons.map((btn) =>
        btn.id.startsWith("divider") ? (
          <Divider key={btn.id} />
        ) : (
          <ToolbarButton
            key={btn.id}
            id={btn.id}
            label={btn.label}
            tooltip={btn.tooltip}
            className={btn.className || ""}
          />
        )
      )}
    </div>
  );

  // Render preview
  const renderPreview = () => (
    <div
      className="p-4 overflow-auto bg-white dark:bg-gray-900 markdown-preview prose prose-sm dark:prose-invert max-w-none"
      style={{ minHeight: `${rows * 1.5}rem` }}
    >
      {value ? (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
      ) : (
        <p className="text-gray-400 dark:text-gray-500 italic">
          Nothing to preview
        </p>
      )}
    </div>
  );

  // Render editor textarea
  const renderEditor = () => (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={handleKeyDown}
      onSelect={handleSelectionChange}
      onMouseUp={handleSelectionChange}
      placeholder={placeholder}
      rows={rows}
      className="w-full h-full p-4 border-0 focus:ring-0 focus:outline-none resize-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 font-mono text-sm"
      style={{ minHeight: `${rows * 1.5}rem` }}
    />
  );

  // Mobile layout with tabs
  if (isMobile) {
    return (
      <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
        <div className="flex border-b border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
          <button
            type="button"
            onClick={() => setMobileTab("write")}
            className={`px-4 py-2 text-sm font-medium ${
              mobileTab === "write"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Write
          </button>
          <button
            type="button"
            onClick={() => setMobileTab("preview")}
            className={`px-4 py-2 text-sm font-medium ${
              mobileTab === "preview"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Preview
          </button>
        </div>

        {mobileTab === "write" ? (
          <div>
            {renderToolbar()}
            {renderEditor()}
          </div>
        ) : (
          renderPreview()
        )}
      </div>
    );
  }

  // Desktop layout with split view
  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-md overflow-hidden">
      {renderToolbar()}
      <div className="flex" style={{ minHeight: `${rows * 1.5}rem` }}>
        {/* Editor panel */}
        <div className="flex-1 border-r border-gray-300 dark:border-gray-600">
          {renderEditor()}
        </div>
        {/* Preview panel */}
        <div className="flex-1 overflow-auto">{renderPreview()}</div>
      </div>
    </div>
  );
}
