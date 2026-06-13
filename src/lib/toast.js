import { create } from 'zustand';

let _id = 0;

export const useToastStore = create((set) => ({
  toasts: [],

  showToast: ({ message, type = 'info', duration = 2500 }) => {
    const id = ++_id;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, duration);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

// Convenience helper — import this anywhere and call like: toast.success('Done!')
export const toast = {
  success: (message, duration) => useToastStore.getState().showToast({ message, type: 'success', duration }),
  error:   (message, duration) => useToastStore.getState().showToast({ message, type: 'error',   duration }),
  info:    (message, duration) => useToastStore.getState().showToast({ message, type: 'info',    duration }),
  points:  (message, duration) => useToastStore.getState().showToast({ message, type: 'points',  duration }),
  warn:    (message, duration) => useToastStore.getState().showToast({ message, type: 'warn',    duration }),
};
