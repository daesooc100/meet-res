import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

interface NotificationToastProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-white rounded-xl border border-slate-200 shadow-xl p-4 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-3 dark:bg-slate-900 dark:border-slate-800">
      <div className="shrink-0 mt-0.5">
        {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600" />}
        {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="text-xs font-bold text-slate-900 dark:text-white">{toast.title}</h4>
        <p className="text-[11px] text-slate-500 mt-0.5 dark:text-slate-400">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="p-1 text-slate-400 hover:text-slate-600 rounded dark:hover:text-slate-200"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
