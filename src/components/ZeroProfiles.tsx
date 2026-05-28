// Экран выбора и управления профилями
import React, { useState } from 'react';
import { useZeroStore } from '../store/useZeroStore';

export const ZeroProfiles: React.FC = () => {
  const {
    profiles,
    createProfile,
    deleteProfile,
    toggleProfileActive,
    setActiveProfile,
    setActiveView,
    currentUser,
    logout,
  } = useZeroStore();



  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Открыть профиль в редакторе
  const openProfile = (id: string) => {
    setActiveProfile(id);
    setActiveView('editor');
  };

  // Создать и закрыть форму
  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createProfile(newName.trim(), newDesc.trim());
    setNewName('');
    setNewDesc('');
    setShowCreate(false);
  };

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--global-background)',
        overflow: 'hidden',
      }}
    >
      {/* Верхняя панель */}
      <header
        style={{
          height: 'var(--layout-app-bar-height)',
          minHeight: 'var(--layout-app-bar-height)',
          borderBottom: '1px solid var(--global-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--pane-background)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Логотип */}
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#141616" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-7)', letterSpacing: '-0.3px' }}>
            Zero.ID
          </span>
        </div>

        {/* Пользователь и выход */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => setActiveView('docs')}
            style={{
              background: 'transparent',
              border: '1px solid var(--pane-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '5px 12px',
              color: 'var(--global-body-text)',
              fontSize: 'var(--font-size-4)',
              cursor: 'pointer',
              fontFamily: 'var(--main-font)',
              transition: 'border-color var(--default-hover-animation-duration) ease-out',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)')}
          >
            Документация
          </button>
          <span style={{ fontSize: 'var(--font-size-4)', color: 'var(--global-mute-text)' }}>
            {currentUser}
          </span>
          <button
            onClick={logout}
            style={{
              background: 'transparent',
              border: '1px solid var(--pane-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '5px 12px',
              color: 'var(--global-body-text)',
              fontSize: 'var(--font-size-4)',
              cursor: 'pointer',
              fontFamily: 'var(--main-font)',
              transition: 'border-color var(--default-hover-animation-duration) ease-out, color var(--default-hover-animation-duration) ease-out',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-default)';
              (e.currentTarget as HTMLElement).style.color = 'var(--danger-high-contrast)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)';
              (e.currentTarget as HTMLElement).style.color = 'var(--global-body-text)';
            }}
          >
            Выйти
          </button>
        </div>
      </header>

      {/* Контент */}
      <main
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          alignItems: 'center',
        }}
      >
        {/* Заголовок страницы */}
        <div style={{ width: '100%', maxWidth: '800px' }}>
          <h1 style={{ fontSize: 'var(--font-size-10)', fontWeight: 700, marginBottom: '4px' }}>
            Профили
          </h1>
          <p style={{ fontSize: 'var(--font-size-5)', color: 'var(--global-mute-text)' }}>
            Управляйте сценариями проверки безопасности
          </p>
        </div>

        {/* Форма создания профиля */}
        {showCreate && (
          <div
            className="animate-fade-in"
            style={{
              width: '100%',
              maxWidth: '800px',
              background: 'var(--pane-background)',
              border: '1px solid var(--primary-accent)',
              borderRadius: 'var(--border-radius-xl)',
              padding: '20px 24px',
            }}
          >
            <h3 style={{ fontSize: 'var(--font-size-6)', fontWeight: 600, marginBottom: '16px' }}>
              Новый профиль
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                autoFocus
                type="text"
                placeholder="Название профиля"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                style={{
                  background: 'var(--global-background)',
                  border: '1px solid var(--pane-border)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '9px 12px',
                  color: 'var(--global-foreground)',
                  fontSize: 'var(--font-size-5)',
                  fontFamily: 'var(--main-font)',
                  outline: 'none',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--pane-border)')}
              />
              <textarea
                placeholder="Описание (необязательно)"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                style={{
                  background: 'var(--global-background)',
                  border: '1px solid var(--pane-border)',
                  borderRadius: 'var(--border-radius-md)',
                  padding: '9px 12px',
                  color: 'var(--global-foreground)',
                  fontSize: 'var(--font-size-5)',
                  fontFamily: 'var(--main-font)',
                  outline: 'none',
                  resize: 'vertical',
                }}
                onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
                onBlur={(e) => (e.target.style.borderColor = 'var(--pane-border)')}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  style={{
                    background: 'var(--primary-accent)',
                    color: '#141616',
                    border: 'none',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '8px 20px',
                    fontFamily: 'var(--main-font)',
                    fontSize: 'var(--font-size-5)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'background var(--default-hover-animation-duration) ease-out',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--primary-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--primary-accent)')}
                >
                  Создать
                </button>
                <button
                  type="button"
                  onClick={() => { setShowCreate(false); setNewName(''); setNewDesc(''); }}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--pane-border)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '8px 20px',
                    color: 'var(--global-body-text)',
                    fontFamily: 'var(--main-font)',
                    fontSize: 'var(--font-size-5)',
                    cursor: 'pointer',
                    transition: 'border-color var(--default-hover-animation-duration) ease-out',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border-hover)')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)')}
                >
                  Отмена
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Список профилей + кнопка создания */}
        <div style={{ width: '100%', maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {/* Кнопка нового профиля — только если форма закрыта */}
          {!showCreate && (
            <button
              onClick={() => setShowCreate(true)}
              style={{
                background: 'var(--primary-accent-overlay)',
                border: '1px dashed var(--primary-accent)',
                borderRadius: 'var(--border-radius-lg)',
                padding: '14px',
                color: 'var(--primary-accent)',
                fontFamily: 'var(--main-font)',
                fontSize: 'var(--font-size-5)',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background var(--default-hover-animation-duration) ease-out',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--primary-accent-overlay-hover)')}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--primary-accent-overlay)')}
            >
              + Новый профиль
            </button>
          )}

          {/* Пустое состояние */}
          {profiles.length === 0 && !showCreate && (
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
                color: 'var(--global-mute-text)',
                fontSize: 'var(--font-size-5)',
              }}
            >
              Профилей пока нет. Создайте первый!
            </div>
          )}

          {/* Карточки профилей */}
          {profiles.map((profile) => (
            <div
              key={profile.id}
              className="animate-fade-in"
              onMouseEnter={() => setHoveredId(profile.id)}
              onMouseLeave={() => setHoveredId(null)}
              style={{
                background: hoveredId === profile.id ? 'var(--pane-muted-background)' : 'var(--pane-background)',
                border: `1px solid ${hoveredId === profile.id ? 'var(--pane-border-hover)' : 'var(--pane-border)'}`,
                borderRadius: 'var(--border-radius-lg)',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                transition: 'background var(--default-hover-animation-duration) ease-out, border-color var(--default-hover-animation-duration) ease-out',
              }}
            >
              {/* Статус-индикатор */}
              <div
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 'var(--border-radius-full)',
                  background: profile.isActive ? 'var(--primary-accent)' : 'var(--color-gray-400)',
                  flexShrink: 0,
                  boxShadow: profile.isActive ? '0 0 6px var(--primary-accent)' : 'none',
                  transition: 'background var(--default-animation-duration) ease-out, box-shadow var(--default-animation-duration) ease-out',
                }}
              />

              {/* Инфо */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-6)', marginBottom: '2px' }}>
                  {profile.name}
                </div>
                {profile.description && (
                  <div
                    style={{
                      fontSize: 'var(--font-size-4)',
                      color: 'var(--global-mute-text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {profile.description}
                  </div>
                )}
                <div style={{ fontSize: 'var(--font-size-3)', color: 'var(--color-gray-400)', marginTop: '4px' }}>
                  {profile.nodes.length} блоков · Изменён {new Date(profile.updatedAt).toLocaleString('ru-RU')}
                </div>
              </div>

              {/* Кнопки управления */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                {/* Переключатель активности */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleProfileActive(profile.id); }}
                  title={profile.isActive ? 'Деактивировать' : 'Активировать'}
                  style={{
                    background: profile.isActive ? 'var(--primary-accent-overlay)' : 'transparent',
                    border: `1px solid ${profile.isActive ? 'var(--primary-accent)' : 'var(--pane-border)'}`,
                    borderRadius: 'var(--border-radius-md)',
                    padding: '5px 10px',
                    color: profile.isActive ? 'var(--primary-accent)' : 'var(--global-mute-text)',
                    fontFamily: 'var(--main-font)',
                    fontSize: 'var(--font-size-3)',
                    cursor: 'pointer',
                    transition: 'all var(--default-hover-animation-duration) ease-out',
                    fontWeight: 500,
                  }}
                >
                  {profile.isActive ? 'Активен' : 'Неактивен'}
                </button>

                {/* Открыть редактор */}
                <button
                  onClick={() => openProfile(profile.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--pane-border)',
                    borderRadius: 'var(--border-radius-md)',
                    padding: '5px 14px',
                    color: 'var(--global-body-text)',
                    fontFamily: 'var(--main-font)',
                    fontSize: 'var(--font-size-4)',
                    cursor: 'pointer',
                    transition: 'border-color var(--default-hover-animation-duration) ease-out, color var(--default-hover-animation-duration) ease-out',
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border-hover)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--global-foreground)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)';
                    (e.currentTarget as HTMLElement).style.color = 'var(--global-body-text)';
                  }}
                >
                  Открыть
                </button>

                {/* Удаление — с подтверждением */}
                {deleteConfirm === profile.id ? (
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => { deleteProfile(profile.id); setDeleteConfirm(null); }}
                      style={{
                        background: 'var(--danger-default)',
                        border: 'none',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '5px 10px',
                        color: '#fff',
                        fontFamily: 'var(--main-font)',
                        fontSize: 'var(--font-size-3)',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'background var(--default-hover-animation-duration) ease-out',
                      }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--danger-hover)')}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = 'var(--danger-default)')}
                    >
                      Удалить
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      style={{
                        background: 'transparent',
                        border: '1px solid var(--pane-border)',
                        borderRadius: 'var(--border-radius-md)',
                        padding: '5px 8px',
                        color: 'var(--global-mute-text)',
                        fontFamily: 'var(--main-font)',
                        fontSize: 'var(--font-size-3)',
                        cursor: 'pointer',
                      }}
                    >
                      Нет
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteConfirm(profile.id); }}
                    title="Удалить профиль"
                    style={{
                      background: 'transparent',
                      border: '1px solid transparent',
                      borderRadius: 'var(--border-radius-md)',
                      padding: '5px 8px',
                      color: 'var(--color-gray-400)',
                      cursor: 'pointer',
                      transition: 'color var(--default-hover-animation-duration) ease-out',
                      fontSize: '14px',
                      lineHeight: 1,
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--danger-high-contrast)')}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--color-gray-400)')}
                  >
                    {/* Крестик-иконка SVG */}
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      <path d="M10 11v6M14 11v6" />
                      <path d="M9 6V4h6v2" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};
