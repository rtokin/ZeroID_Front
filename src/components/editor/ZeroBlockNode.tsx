// Кастомный узел React Flow для блока Zero.ID
import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';
import type { NodeProps } from 'reactflow';
import type { ZeroNodeData, BlockStatus } from '../../types/zero.types';
import { CATEGORY_COLORS, getBlockDef } from '../../lib/blockDefinitions';
import { useZeroStore } from '../../store/useZeroStore';

// Цвет статуса блока
const STATUS_COLORS: Record<BlockStatus, string> = {
  idle:    'var(--color-gray-400)',
  running: '#14bcff',
  success: 'var(--primary-accent)',
  error:   'var(--danger-high-contrast)',
  warning: '#ffd748',
};

export const ZeroBlockNode: React.FC<NodeProps<ZeroNodeData>> = ({ id, data, selected }) => {
  const [hovered, setHovered] = useState(false);
  const setSelectedBlock = useZeroStore((s) => s.setSelectedBlock);
  const def = getBlockDef(data.blockType);
  const accentColor = def ? CATEGORY_COLORS[def.category] ?? 'var(--primary-accent)' : 'var(--primary-accent)';
  const statusColor = STATUS_COLORS[data.status ?? 'idle'];

  const handleClick = () => {
    setSelectedBlock(id);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '200px',
        background: hovered || selected ? 'var(--pane-muted-background)' : 'var(--pane-background)',
        border: `1.5px solid ${selected ? accentColor : hovered ? 'var(--pane-border-hover)' : 'var(--pane-border)'}`,
        borderRadius: 'var(--border-radius-lg)',
        fontFamily: 'var(--main-font)',
        cursor: 'pointer',
        transition: 'border-color var(--default-hover-animation-duration) ease-out, background var(--default-hover-animation-duration) ease-out, box-shadow var(--default-hover-animation-duration) ease-out',
        boxShadow: selected ? `0 0 0 1px ${accentColor}22` : 'none',
        userSelect: 'none',
        overflow: 'hidden',
      }}
    >
      {/* Цветная полоска категории */}
      <div
        style={{
          height: '3px',
          background: accentColor,
          width: '100%',
        }}
      />

      {/* Заголовок блока */}
      <div
        style={{
          padding: '10px 12px 8px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        {/* Индикатор статуса */}
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            boxShadow: data.status === 'running' ? `0 0 6px ${statusColor}` : 'none',
            transition: 'background var(--default-animation-duration) ease-out',
          }}
        />
        <div
          style={{
            flex: 1,
            fontSize: 'var(--font-size-4)',
            fontWeight: 600,
            color: 'var(--global-foreground)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.label}
        </div>
      </div>

      {/* Описание */}
      {def && (
        <div
          style={{
            padding: '0 12px 10px',
            fontSize: 'var(--font-size-3)',
            color: 'var(--global-mute-text)',
            lineHeight: 1.4,
          }}
        >
          {def.description}
        </div>
      )}

      {/* Последний результат (краткий) */}
      {data.lastResult && (
        <div
          style={{
            margin: '0 12px 8px',
            padding: '4px 8px',
            background: 'var(--global-background)',
            borderRadius: 'var(--border-radius-base)',
            fontSize: 'var(--font-size-2)',
            color: 'var(--global-mute-text)',
            fontFamily: 'var(--code-font)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {data.lastResult}
        </div>
      )}

      {/* Input handle (вход сверху) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ top: -5 }}
      />

      {/* Output handle (выход снизу) */}
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ bottom: -5 }}
      />

      {/* Доп. выход для condition блока */}
      {data.blockType === 'condition' && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="false"
            style={{ right: -5, top: '60%' }}
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ bottom: -5 }}
          />
        </>
      )}
    </div>
  );
};
