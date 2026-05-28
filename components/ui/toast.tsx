"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
  duration?: number;
}

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  resolve: (value: boolean) => void;
}

interface ToastContextType {
  toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
  };
  confirm: (message: string, title?: string, confirmText?: string, cancelText?: string) => Promise<boolean>;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [confirmState, setConfirmState] = useState<ConfirmOptions | null>(null);

  const addToast = useCallback((type: "success" | "error" | "info", message: string, duration = 3000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message, duration }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const toast = {
    success: (message: string, duration?: number) => addToast("success", message, duration),
    error: (message: string, duration?: number) => addToast("error", message, duration),
    info: (message: string, duration?: number) => addToast("info", message, duration),
  };

  const confirm = useCallback((message: string, title = "请确认", confirmText = "确定", cancelText = "取消") => {
    return new Promise<boolean>((resolve) => {
      setConfirmState({
        title,
        message,
        confirmText,
        cancelText,
        resolve: (value) => {
          setConfirmState(null);
          resolve(value);
        },
      });
    });
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Floating Toast List */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 max-w-sm w-full p-4 pointer-events-none">
        {toasts.map((t) => {
          const isSuccess = t.type === "success";
          const isError = t.type === "error";
          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-lg border backdrop-blur-md animate-slide-in transition-all duration-300 ${
                isSuccess
                  ? "bg-white/95 border-emerald-100 text-emerald-800 shadow-emerald-500/5"
                  : isError
                  ? "bg-white/95 border-rose-100 text-rose-800 shadow-rose-500/5"
                  : "bg-white/95 border-gray-100 text-gray-800"
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                {isError && <AlertCircle className="w-5 h-5 text-rose-500" />}
                {!isSuccess && !isError && <Info className="w-5 h-5 text-blue-500" />}
              </div>
              <div className="flex-1 text-sm font-medium leading-relaxed">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-gray-400 hover:text-gray-600 flex-shrink-0 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Custom Confirm Modal */}
      {confirmState && (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-[#F0E4E0] animate-scale-up">
            <h3 className="text-lg font-bold text-gray-900 mb-2">{confirmState.title}</h3>
            <p className="text-sm text-[#B8A099] mb-6 leading-relaxed">{confirmState.message}</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => confirmState.resolve(false)}
                className="px-4 py-2 text-sm font-semibold text-[#B8A099] hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
              >
                {confirmState.cancelText}
              </button>
              <button
                onClick={() => confirmState.resolve(true)}
                className="px-5 py-2 text-sm font-semibold text-white bg-[#FF2442] hover:bg-[#E01F3B] rounded-full shadow-md shadow-[#FF2442]/20 transition-all active:scale-95 cursor-pointer"
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
