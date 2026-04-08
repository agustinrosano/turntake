import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const NotificationContext = createContext(null);
const createToastId = () =>
  (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600',
    ringClass: 'ring-emerald-200',
    badgeClass: 'bg-emerald-50 text-emerald-700'
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600',
    ringClass: 'ring-red-200',
    badgeClass: 'bg-red-50 text-red-700'
  },
  info: {
    icon: Info,
    iconClass: 'text-blue-600',
    ringClass: 'ring-blue-200',
    badgeClass: 'bg-blue-50 text-blue-700'
  }
};

const buildToast = (payload) => ({
  id: createToastId(),
  type: payload.type || 'info',
  title: payload.title || 'Aviso',
  message: payload.message || '',
  duration: payload.duration ?? 3600
});

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const notify = useCallback(
    (payload) => {
      const toast = buildToast(payload);
      setToasts((prev) => [...prev, toast]);

      if (toast.duration > 0) {
        window.setTimeout(() => removeToast(toast.id), toast.duration);
      }
    },
    [removeToast]
  );

  const api = useMemo(
    () => ({
      notify,
      success: (message, options = {}) => notify({ ...options, type: 'success', message }),
      error: (message, options = {}) => notify({ ...options, type: 'error', message }),
      info: (message, options = {}) => notify({ ...options, type: 'info', message })
    }),
    [notify]
  );

  return (
    <NotificationContext.Provider value={api}>
      {children}

      <div className="fixed top-6 right-6 z-[100] flex w-[min(92vw,420px)] flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className={`anim-toast-in pointer-events-auto rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-2xl backdrop-blur-sm ring-1 ${style.ringClass}`}
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <Icon size={20} className={style.iconClass} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400 mb-1">
                    {toast.title}
                  </p>
                  <p className="text-sm font-semibold text-slate-700 leading-snug break-words">
                    {toast.message}
                  </p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${style.badgeClass}`}>
                    {toast.type}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                  aria-label="Cerrar alerta"
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotify debe usarse dentro de NotificationProvider');
  }
  return context;
};
