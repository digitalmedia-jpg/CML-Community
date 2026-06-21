export interface Toast {
  id: string;
  title?: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'drift';
  duration?: number; // ms
}

type ToastListener = (toasts: Toast[]) => void;

class ToastService {
  private toasts: Toast[] = [];
  private listeners: Set<ToastListener> = new Set();

  show(message: string, type: Toast['type'] = 'info', duration = 6000, title?: string) {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = {
      id,
      title,
      message,
      type,
      duration
    };

    this.toasts.push(newToast);
    this.notify();

    if (duration > 0) {
      setTimeout(() => {
        this.dismiss(id);
      }, duration);
    }

    return id;
  }

  // Handy helpers
  success(message: string, title?: string, duration = 6000) {
    return this.show(message, 'success', duration, title);
  }

  error(message: string, title?: string, duration = 8000) {
    return this.show(message, 'error', duration, title);
  }

  warning(message: string, title?: string, duration = 7000) {
    return this.show(message, 'warning', duration, title);
  }

  info(message: string, title?: string, duration = 5000) {
    return this.show(message, 'info', duration, title);
  }

  drift(message: string, title = "State Drift Warning", duration = 8000) {
    return this.show(message, 'drift', duration, title);
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.notify();
  }

  getToasts() {
    return [...this.toasts];
  }

  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    listener(this.getToasts());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => {
      try {
        l(this.getToasts());
      } catch (e) {
        console.error("[ToastService] Listener error", e);
      }
    });
  }
}

export const toastService = new ToastService();
