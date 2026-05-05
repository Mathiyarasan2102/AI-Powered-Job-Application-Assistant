import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';
import { useEffect } from 'react';

// ─── Toast Store ────────────────────────────────────────────
export const useToastStore = create((set) => ({
  toasts: [],
  addToast: (message, type = 'error', duration = 4000) => {
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type, duration }] }));
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
  },
}));

// ─── Shorthand helpers ──────────────────────────────────────
export const toast = {
  error: (msg, duration) => useToastStore.getState().addToast(msg, 'error', duration),
  success: (msg, duration) => useToastStore.getState().addToast(msg, 'success', duration),
  warning: (msg, duration) => useToastStore.getState().addToast(msg, 'warning', duration),
  info: (msg, duration) => useToastStore.getState().addToast(msg, 'info', duration),
};

// ─── Icons & Styles by type ─────────────────────────────────
const config = {
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    iconColor: 'text-emerald-400',
    bar: 'bg-emerald-400',
  },
  error: {
    icon: XCircle,
    bg: 'bg-red-500/15',
    border: 'border-red-500/30',
    iconColor: 'text-red-400',
    bar: 'bg-red-400',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    iconColor: 'text-amber-400',
    bar: 'bg-amber-400',
  },
  info: {
    icon: Info,
    bg: 'bg-indigo-500/15',
    border: 'border-indigo-500/30',
    iconColor: 'text-indigo-400',
    bar: 'bg-indigo-400',
  },
};

// ─── Single Toast Item ──────────────────────────────────────
function ToastItem({ id, message, type, duration }) {
  const { removeToast } = useToastStore();
  const { icon: Icon, bg, border, iconColor, bar } = config[type] || config.error;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 80, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative overflow-hidden flex items-start gap-3 px-4 py-3.5 rounded-xl border backdrop-blur-xl shadow-2xl min-w-[300px] max-w-[420px] ${bg} ${border}`}
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColor}`} />
      <p className="text-sm text-white/90 leading-relaxed flex-1 pr-4">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="absolute top-2.5 right-2.5 text-white/30 hover:text-white/70 transition"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      {/* Progress bar */}
      <motion.div
        initial={{ scaleX: 1 }}
        animate={{ scaleX: 0 }}
        transition={{ duration: duration / 1000, ease: 'linear' }}
        className={`absolute bottom-0 left-0 right-0 h-[2px] origin-left ${bar}`}
      />
    </motion.div>
  );
}

// ─── Toast Container (render once in App) ───────────────────
export default function ToastContainer() {
  const { toasts } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-auto">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
