"use client";

import { useEffect } from "react";

type DialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  showCancel?: boolean;
};

export default function Dialog({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "OK",
  cancelText = "Cancel",
  onConfirm,
  showCancel = false,
}: DialogProps) {
  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const typeStyles = {
    success: {
      icon: (
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      ),
      gradient: "from-green-500 to-emerald-500",
      border: "border-green-200 dark:border-green-800",
    },
    error: {
      icon: (
        <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
      ),
      gradient: "from-red-500 to-rose-500",
      border: "border-red-200 dark:border-red-800",
    },
    warning: {
      icon: (
        <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
      ),
      gradient: "from-yellow-500 to-orange-500",
      border: "border-yellow-200 dark:border-yellow-800",
    },
    info: {
      icon: (
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      ),
      gradient: "from-blue-500 to-purple-500",
      border: "border-blue-200 dark:border-blue-800",
    },
  };

  const styles = typeStyles[type];

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border-2 ${styles.border} animate-in zoom-in-95`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient Accent */}
        <div className={`h-2 bg-gradient-to-r ${styles.gradient} rounded-t-2xl`} />

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            {styles.icon}
            <div className="flex-1">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">
                {title}
              </h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex gap-3 ${showCancel ? "justify-end" : "justify-end"}`}>
            {showCancel && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
              >
                {cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`px-6 py-2 bg-gradient-to-r ${styles.gradient} text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

