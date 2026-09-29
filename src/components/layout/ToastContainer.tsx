import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../../state/AppContext';

export const ToastContainer: React.FC = () => {
  const { state, dispatch } = useApp();

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {state.toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => dispatch({ type: 'REMOVE_TOAST', payload: toast.id })} />
      ))}
    </div>
  );
};

interface ToastItemProps {
  toast: {
    id: string;
    type: 'success' | 'warning' | 'error' | 'info';
    title: string;
    message: string;
    timestamp: string;
  };
  onClose: () => void;
}

const ToastItem: React.FC<ToastItemProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4500);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      default:
        return <Info className="w-4 h-4 text-sky-600 flex-shrink-0" />;
    }
  };

  const getBorder = () => {
    switch (toast.type) {
      case 'success':
        return 'border-emerald-200 bg-white';
      case 'warning':
        return 'border-amber-200 bg-white';
      case 'error':
        return 'border-rose-200 bg-white';
      default:
        return 'border-sky-200 bg-white';
    }
  };

  return (
    <div
      className={`pointer-events-auto p-3.5 rounded-xl border ${getBorder()} shadow-lg flex items-start justify-between gap-3 text-xs transition-all animate-in fade-in slide-in-from-bottom-2`}
    >
      <div className="flex items-start gap-2.5">
        {getIcon()}
        <div>
          <div className="font-semibold text-gray-900 leading-tight">{toast.title}</div>
          <div className="text-gray-600 mt-0.5 leading-snug">{toast.message}</div>
          <div className="text-[10px] text-gray-400 font-mono mt-1">{toast.timestamp}</div>
        </div>
      </div>
      <button
        onClick={onClose}
        className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
