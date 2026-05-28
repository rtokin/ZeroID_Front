// Панель логов — отдельные логи для каждого блока
import React, { useState, useRef, useEffect } from 'react';
import { useZeroStore } from '../../store/useZeroStore';
import type { LogLevel, ZeroNodeData } from '../../types/zero.types';
import type { Node } from 'reactflow';

// Цвет уровня лога
const LEVEL_COLORS: Record<LogLevel, string> = {
  debug:   'var(--color-gray-400)',
  info:    '#14bcff',
  success: 'var(--primary-accent)',
  warning: '#ffd748',
  error:   'var(--danger-high-contrast)',
};

interface Props {
  profileId: string;
}

export const ZeroLogsPanel: React.FC<Props> = ({ profileId }) => {
  const { logs, clearLogs, getActiveProfile } = useZeroStore();
  const profile = getActiveProfile();
  const profileLogs = logs[profileId] ?? {};

  // Выбранный узел для просмотра логов
  const [selectedNodeId, setSelectedNodeId] = useState<string>('__all__');
  const logsEndRef = useRef<HTMLDivElement>(null);

  const nodes: Node<ZeroNodeData>[] = profile?.nodes ?? [];

  // Получить логи для отображения
  const displayedLogs = selectedNodeId === '__all__'
    ? Object.values(profileLogs).flat().sort((a, b) => a.timestamp.localeCompare(b.timestamp))
    : profileLogs[selectedNodeId] ?? [];

  // Прокрутка вниз при новых логах
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayedLogs.length]);

  const handleClear = () => {
    if (selectedNodeId === '__all__') {
      nodes.forEach((n) => clearLogs(profileId, n.id));
    } else {
      clearLogs(profileId, selectedNodeId);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
        background: 'var(--global-background)',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--pane-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          background: 'var(--pane-background)',
        }}
      >
        <span style={{ fontSize: 'var(--font-size-5)', fontWeight: 600 }}>Логи профиля</span>
        <button
          onClick={handleClear}
          style={{
            background: 'transparent',
            border: '1px solid var(--pane-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '4px 12px',
            color: 'var(--global-mute-text)',
            fontFamily: 'var(--main-font)',
            fontSize: 'var(--font-size-3)',
            cursor: 'pointer',
            transition: 'border-color var(--default-hover-animation-duration) ease-out, color var(--default-hover-animation-duration) ease-out',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-default)';
            (e.currentTarget as HTMLElement).style.color = 'var(--danger-high-contrast)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)';
            (e.currentTarget as HTMLElement).style.color = 'var(--global-mute-text)';
          }}
        >
          Очистить
        </button>
      </div>

      {/* Вкладки блоков */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          padding: '8px 12px',
          borderBottom: '1px solid var(--pane-border)',
          flexShrink: 0,
          flexWrap: 'wrap',
          background: 'var(--pane-background)',
        }}
      >
        {/* Вкладка "Все" */}
        <button
          onClick={() => setSelectedNodeId('__all__')}
          style={{
            background: selectedNodeId === '__all__' ? 'var(--primary-accent-overlay)' : 'transparent',
            border: `1px solid ${selectedNodeId === '__all__' ? 'var(--primary-accent)' : 'var(--pane-border)'}`,
            borderRadius: 'var(--border-radius-md)',
            padding: '3px 10px',
            color: selectedNodeId === '__all__' ? 'var(--primary-accent)' : 'var(--global-mute-text)',
            fontFamily: 'var(--main-font)',
            fontSize: 'var(--font-size-3)',
            cursor: 'pointer',
            transition: 'all var(--default-hover-animation-duration) ease-out',
          }}
        >
          Все ({Object.values(profileLogs).flat().length})
        </button>

        {/* Вкладки по блокам */}
        {nodes.map((node) => {
          const count = (profileLogs[node.id] ?? []).length;
          const isActive = selectedNodeId === node.id;
          return (
            <button
              key={node.id}
              onClick={() => setSelectedNodeId(node.id)}
              style={{
                background: isActive ? 'var(--primary-accent-overlay)' : 'transparent',
                border: `1px solid ${isActive ? 'var(--primary-accent)' : 'var(--pane-border)'}`,
                borderRadius: 'var(--border-radius-md)',
                padding: '3px 10px',
                color: isActive ? 'var(--primary-accent)' : 'var(--global-mute-text)',
                fontFamily: 'var(--main-font)',
                fontSize: 'var(--font-size-3)',
                cursor: 'pointer',
                transition: 'all var(--default-hover-animation-duration) ease-out',
              }}
            >
              {node.data.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Лог-записи */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {displayedLogs.length === 0 && (
          <div
            style={{
              padding: '24px',
              textAlign: 'center',
              color: 'var(--global-mute-text)',
              fontSize: 'var(--font-size-4)',
            }}
          >
            Логов пока нет
          </div>
        )}

        {displayedLogs.map((entry) => (
          <div
            key={entry.id}
            style={{
              display: 'flex',
              gap: '8px',
              padding: '3px 0',
              borderBottom: '1px solid var(--global-border)',
              fontSize: 'var(--font-size-3)',
              fontFamily: 'var(--code-font)',
              lineHeight: 1.5,
            }}
          >
            {/* Время */}
            <span style={{ color: 'var(--color-gray-400)', flexShrink: 0, minWidth: '80px' }}>
              {new Date(entry.timestamp).toLocaleTimeString('ru-RU')}
            </span>
            {/* Уровень */}
            <span
              style={{
                color: LEVEL_COLORS[entry.level],
                fontWeight: 600,
                flexShrink: 0,
                minWidth: '52px',
                textTransform: 'uppercase',
                fontSize: 'var(--font-size-2)',
                alignSelf: 'center',
              }}
            >
              {entry.level}
            </span>
            {/* Сообщение */}
            <span style={{ color: 'var(--global-body-text)', flex: 1, wordBreak: 'break-word' }}>
              {entry.message}
            </span>
          </div>
        ))}
        <div ref={logsEndRef} />
      </div>
    </div>
  );
};
