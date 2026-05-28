// Система toast-уведомлений для Zero.ID
import React from 'react';
import { useZeroStore } from '../store/useZeroStore';
import type { ToastMessage } from '../types/zero.types';

// Цвета уведомлений
const TOAST_STYLES: Record<ToastMessage['type'], { bg: string; border: string; color: string }> = {
  success: {
    bg:     'rgba(29, 237, 131, 0.1)',
    border: 'rgba(29, 237, 131, 0.3)',
    color:  '#5ec692',
  },
  error: {
    bg:     'rgba(247, 80, 73, 0.1)',
    border: 'rgba(247, 80, 73, 0.3)',
    color:  '#ea928e',
  },
  warning: {
    bg:     'rgba(255, 215, 72, 0.1)',
    border: 'rgba(255, 215, 72, 0.3)',
    color:  '#c3b476',
  },
  info: {
    bg:     'rgba(20, 188, 255, 0.1)',
    border: 'rgba(20, 188, 255, 0.3)',
    color:  '#97bdcb',
  },
};

export const ZeroToast: React.FC = () => {
  const { toasts, removeToast } = useZeroStore();

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 'var(--z-index-toast)' as unknown as number,
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        maxWidth: '320px',
        width: '100%',
      }}
    >
      {toasts.map((toast) => {
        const style = TOAST_STYLES[toast.type];
        return (
          <div
            key={toast.id}
            className="animate-toast-in"
            style={{
              background: style.bg,
              border: `1px solid ${style.border}`,
              borderRadius: 'var(--border-radius-lg)',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
            }}
          >
            <span style={{ fontSize: 'var(--font-size-4)', color: style.color, flex: 1 }}>
              {toast.message}
            </span>
            <button
              onClick={() => removeToast(toast.id)}
              style={{
                background: 'transparent',
                border: 'none',
                color: style.color,
                cursor: 'pointer',
                padding: '0',
                lineHeight: 1,
                flexShrink: 0,
                opacity: 0.7,
                transition: 'opacity var(--default-hover-animation-duration) ease-out',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = '1')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = '0.7')}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
};
