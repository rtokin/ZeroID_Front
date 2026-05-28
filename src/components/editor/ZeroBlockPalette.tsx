// Левая панель — палитра блоков для перетаскивания на холст
import React, { useState } from 'react';
import { BLOCK_DEFINITIONS, CATEGORY_COLORS, CATEGORY_LABELS } from '../../lib/blockDefinitions';
import type { BlockDefinition } from '../../types/zero.types';

export const ZeroBlockPalette: React.FC = () => {
  const [search, setSearch] = useState('');
  const [hoveredType, setHoveredType] = useState<string | null>(null);

  // Группировка блоков по категории
  const grouped = BLOCK_DEFINITIONS.reduce<Record<string, BlockDefinition[]>>((acc, def) => {
    if (
      !search ||
      def.label.toLowerCase().includes(search.toLowerCase()) ||
      def.description.toLowerCase().includes(search.toLowerCase())
    ) {
      acc[def.category] = [...(acc[def.category] ?? []), def];
    }
    return acc;
  }, {});

  // Начало drag&drop — передаём тип блока через dataTransfer
  const onDragStart = (e: React.DragEvent, def: BlockDefinition) => {
    e.dataTransfer.setData('application/zeroblocktype', def.type);
    e.dataTransfer.setData('application/zeroblocklabel', def.label);
    e.dataTransfer.effectAllowed = 'copy';
  };

  return (
    <div
      style={{
        width: '220px',
        minWidth: '220px',
        borderRight: '1px solid var(--pane-border)',
        background: 'var(--pane-background)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          padding: '12px 14px',
          borderBottom: '1px solid var(--pane-border)',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 'var(--font-size-3)', fontWeight: 600, color: 'var(--global-mute-text)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px' }}>
          Блоки
        </div>
        {/* Поиск по блокам */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск..."
          style={{
            width: '100%',
            background: 'var(--global-background)',
            border: '1px solid var(--pane-border)',
            borderRadius: 'var(--border-radius-md)',
            padding: '6px 10px',
            color: 'var(--global-foreground)',
            fontSize: 'var(--font-size-4)',
            fontFamily: 'var(--main-font)',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
          onBlur={(e) => (e.target.style.borderColor = 'var(--pane-border)')}
        />
      </div>

      {/* Список блоков по категориям */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
        {Object.entries(grouped).map(([category, defs]) => (
          <div key={category} style={{ marginBottom: '4px' }}>
            {/* Лейбл категории */}
            <div
              style={{
                padding: '4px 14px',
                fontSize: 'var(--font-size-2)',
                fontWeight: 600,
                color: CATEGORY_COLORS[category] ?? 'var(--global-mute-text)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: '2px',
              }}
            >
              {CATEGORY_LABELS[category] ?? category}
            </div>

            {/* Карточки блоков */}
            {defs.map((def) => (
              <div
                key={def.type}
                draggable
                onDragStart={(e) => onDragStart(e, def)}
                onMouseEnter={() => setHoveredType(def.type)}
                onMouseLeave={() => setHoveredType(null)}
                style={{
                  margin: '2px 8px',
                  padding: '8px 10px',
                  background: hoveredType === def.type ? 'var(--pane-muted-background)' : 'transparent',
                  border: `1px solid ${hoveredType === def.type ? 'var(--pane-border-hover)' : 'transparent'}`,
                  borderRadius: 'var(--border-radius-md)',
                  cursor: 'grab',
                  transition: 'background var(--default-hover-animation-duration) ease-out, border-color var(--default-hover-animation-duration) ease-out',
                  userSelect: 'none',
                }}
              >
                {/* Маркер-полоска + название */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: 3,
                      height: 20,
                      borderRadius: '2px',
                      background: CATEGORY_COLORS[def.category] ?? 'var(--primary-accent)',
                      flexShrink: 0,
                    }}
                  />
                  <div>
                    <div style={{ fontSize: 'var(--font-size-4)', fontWeight: 500, color: 'var(--global-foreground)', lineHeight: 1.2 }}>
                      {def.label}
                    </div>
                    <div
                      style={{
                        fontSize: 'var(--font-size-2)',
                        color: 'var(--global-mute-text)',
                        marginTop: '2px',
                        lineHeight: 1.3,
                      }}
                    >
                      {def.description}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {Object.keys(grouped).length === 0 && (
          <p style={{ padding: '16px 14px', color: 'var(--global-mute-text)', fontSize: 'var(--font-size-4)' }}>
            Ничего не найдено
          </p>
        )}
      </div>

      {/* Подсказка */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--pane-border)',
          fontSize: 'var(--font-size-2)',
          color: 'var(--color-gray-400)',
          flexShrink: 0,
        }}
      >
        Перетащите блок на холст
      </div>
    </div>
  );
};
