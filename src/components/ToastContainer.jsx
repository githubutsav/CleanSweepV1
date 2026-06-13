import { useEffect, useState } from 'react';
import { useToastStore } from '../lib/toast';
import { CheckCircle2, XCircle, Info, AlertTriangle, Star } from 'lucide-react';

const TYPE_CONFIG = {
  success: { Icon: CheckCircle2, color: 'toast-card--success' },
  error:   { Icon: XCircle,       color: 'toast-card--error'   },
  info:    { Icon: Info,           color: 'toast-card--info'    },
  warn:    { Icon: AlertTriangle,  color: 'toast-card--warn'    },
  points:  { Icon: Star,           color: 'toast-card--points'  },
};

function ToastCard({ id, message, type, duration = 2500 }) {
  const [exiting, setExiting] = useState(false);
  const removeToast = useToastStore((s) => s.removeToast);

  useEffect(() => {
    // Start exit animation 450ms before removal
    const exitTimer = setTimeout(() => setExiting(true), duration - 450);
    return () => clearTimeout(exitTimer);
  }, [duration]);

  const { Icon, color } = TYPE_CONFIG[type] || TYPE_CONFIG.info;

  return (
    <div
      className={`toast-card ${color} ${exiting ? 'toast-card--exit' : 'toast-card--enter'}`}
      role="alert"
      onClick={() => { setExiting(true); setTimeout(() => removeToast(id), 450); }}
    >
      <div className="toast-card__icon">
        <Icon size={18} strokeWidth={2.3} />
      </div>
      <p className="toast-card__text">{message}</p>
      <div
        className="toast-card__progress"
        style={{ animationDuration: `${duration - 450}ms` }}
      />
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <ToastCard key={t.id} {...t} />
      ))}
    </div>
  );
}
