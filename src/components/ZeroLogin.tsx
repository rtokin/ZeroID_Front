// Экран авторизации Zero.ID
import React, { useState } from 'react';
import { useZeroStore } from '../store/useZeroStore';

export const ZeroLogin: React.FC = () => {
  const login = useZeroStore((s) => s.login);
  const [form, setForm] = useState({ login: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Небольшая задержка для имитации проверки
    setTimeout(() => {
      const ok = login(form.login, form.password);
      if (!ok) {
        setError('Неверный логин или пароль');
      }
      setIsLoading(false);
    }, 600);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--global-background)',
        flexDirection: 'column',
        gap: '32px',
      }}
    >
      {/* Логотип */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '8px',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 'var(--border-radius-lg)',
              background: 'var(--primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* SVG щит */}
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="#141616"
                stroke="#141616"
                strokeWidth="0"
              />
            </svg>
          </div>
          <span
            style={{
              fontFamily: 'var(--main-font)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--global-foreground)',
              letterSpacing: '-0.5px',
            }}
          >
            Zero.ID
          </span>
        </div>
        <p
          style={{
            fontSize: 'var(--font-size-4)',
            color: 'var(--global-mute-text)',
            marginTop: '4px',
          }}
        >
          Security Audit Tool
        </p>
      </div>

      {/* Карточка формы */}
      <div
        className="animate-fade-in"
        style={{
          width: '360px',
          background: 'var(--pane-background)',
          border: '1px solid var(--pane-border)',
          borderRadius: 'var(--border-radius-xl)',
          padding: '32px',
        }}
      >
        <h2
          style={{
            fontSize: 'var(--font-size-8)',
            fontWeight: 600,
            marginBottom: '24px',
            color: 'var(--global-foreground)',
          }}
        >
          Вход в систему
        </h2>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Поле логина */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-4)', color: 'var(--global-mute-text)' }}>
              Логин
            </label>
            <input
              type="text"
              value={form.login}
              onChange={(e) => setForm((f) => ({ ...f, login: e.target.value }))}
              placeholder="admin"
              required
              style={{
                background: 'var(--global-background)',
                border: `1px solid ${error ? 'var(--danger-default)' : 'var(--pane-border)'}`,
                borderRadius: 'var(--border-radius-md)',
                padding: '10px 12px',
                color: 'var(--global-foreground)',
                fontSize: 'var(--font-size-5)',
                fontFamily: 'var(--main-font)',
                outline: 'none',
                transition: 'border-color var(--default-hover-animation-duration) ease-out',
                width: '100%',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
              onBlur={(e) =>
                (e.target.style.borderColor = error ? 'var(--danger-default)' : 'var(--pane-border)')
              }
            />
          </div>

          {/* Поле пароля */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: 'var(--font-size-4)', color: 'var(--global-mute-text)' }}>
              Пароль
            </label>
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              placeholder="••••••"
              required
              style={{
                background: 'var(--global-background)',
                border: `1px solid ${error ? 'var(--danger-default)' : 'var(--pane-border)'}`,
                borderRadius: 'var(--border-radius-md)',
                padding: '10px 12px',
                color: 'var(--global-foreground)',
                fontSize: 'var(--font-size-5)',
                fontFamily: 'var(--main-font)',
                outline: 'none',
                transition: 'border-color var(--default-hover-animation-duration) ease-out',
                width: '100%',
              }}
              onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
              onBlur={(e) =>
                (e.target.style.borderColor = error ? 'var(--danger-default)' : 'var(--pane-border)')
              }
            />
          </div>

          {/* Ошибка */}
          {error && (
            <div
              style={{
                background: 'rgba(247,80,73,0.1)',
                border: '1px solid rgba(247,80,73,0.2)',
                borderRadius: 'var(--border-radius-md)',
                padding: '8px 12px',
                fontSize: 'var(--font-size-4)',
                color: '#ea928e',
              }}
            >
              {error}
            </div>
          )}

          {/* Кнопка входа */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: '8px',
              background: isLoading ? 'var(--primary-accent-overlay)' : 'var(--primary-accent)',
              color: '#141616',
              border: 'none',
              borderRadius: 'var(--border-radius-md)',
              padding: '11px 0',
              fontFamily: 'var(--main-font)',
              fontSize: 'var(--font-size-5)',
              fontWeight: 600,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'background var(--default-hover-animation-duration) ease-out, opacity 100ms ease-out',
              width: '100%',
            }}
            onMouseEnter={(e) => {
              if (!isLoading) (e.target as HTMLElement).style.background = 'var(--primary-hover)';
            }}
            onMouseLeave={(e) => {
              if (!isLoading) (e.target as HTMLElement).style.background = 'var(--primary-accent)';
            }}
          >
            {isLoading ? 'Проверка...' : 'Войти'}
          </button>
        </form>

        {/* Подсказка */}
        <p
          style={{
            marginTop: '16px',
            fontSize: 'var(--font-size-3)',
            color: 'var(--global-mute-text)',
            textAlign: 'center',
          }}
        >
          Тестовый доступ: admin / admin
        </p>
      </div>

      <p style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-400)' }}>
        Zero.ID v1.0.0 — Security Audit Tool
      </p>
    </div>
  );
};
