import React from 'react';
import { ToastMsg } from '../types';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Props {
  toasts: ToastMsg[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<Props> = ({ toasts, onDismiss }) => {
  if (!toasts.length) return null;
  return (
    <div className="toast-portal" role="status" aria-live="polite">
      {toasts.map(t => (
        <div key={t.id} className={`toast-item ${t.type || 'info'}`}>
          {t.type === 'success' && <CheckCircle2 size={16} />}
          {t.type === 'alert'   && <AlertCircle  size={16} />}
          {(!t.type || t.type==='info') && <Info size={16} />}
          <span style={{flex:1}}>{t.message}</span>
          <button type="button" className="toast-close icon-btn" onClick={() => onDismiss(t.id)} aria-label="Dismiss">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  );
};
