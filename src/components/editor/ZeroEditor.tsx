// Главный редактор профиля — React Flow холст + все панели
import React, { useCallback, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
  type Connection,
  type NodeTypes,
  type OnConnect,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { v4 as uuidv4 } from 'uuid';

import { useZeroStore } from '../../store/useZeroStore';
import { ZeroBlockNode } from './ZeroBlockNode';
import { ZeroBlockPalette } from './ZeroBlockPalette';
import { ZeroBlockConfigPanel } from './ZeroBlockConfigPanel';
import { ZeroLogsPanel } from './ZeroLogsPanel';
import { getBlockDef } from '../../lib/blockDefinitions';
import type { BlockType, ZeroNodeData } from '../../types/zero.types';
import type { Node } from 'reactflow';

// Регистрация кастомного типа узла
const nodeTypes: NodeTypes = { zeroBlock: ZeroBlockNode };

interface Props {
  profileId: string;
}

export const ZeroEditor: React.FC<Props> = ({ profileId }) => {
  const {
    getActiveProfile, setNodes: storeSetNodes, setEdges: storeSetEdges,
    setActiveView, setActiveProfile, addLog,
  } = useZeroStore();

  const profile = getActiveProfile();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [showLogs, setShowLogs] = useState(false);

  // Инициализация React Flow из профиля
  const [nodes, setNodes, onNodesChange] = useNodesState(profile?.nodes ?? []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(profile?.edges ?? []);

  // Синхронизация с хранилищем при изменениях
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes);
      setNodes((curr) => {
        storeSetNodes(profileId, curr);
        return curr;
      });
    },
    [onNodesChange, setNodes, storeSetNodes, profileId]
  );

  const handleEdgesChange = useCallback(
    (changes: Parameters<typeof onEdgesChange>[0]) => {
      onEdgesChange(changes);
      setEdges((curr) => {
        storeSetEdges(profileId, curr);
        return curr;
      });
    },
    [onEdgesChange, setEdges, storeSetEdges, profileId]
  );

  // Добавление нового ребра при соединении ручек
  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      setEdges((eds) => {
        const newEdges = addEdge({ ...connection, animated: true }, eds);
        storeSetEdges(profileId, newEdges);
        return newEdges;
      });
      addLog(profileId, connection.source ?? '', {
        level: 'info',
        message: `Блок соединён: ${connection.source} -> ${connection.target}`,
      });
    },
    [setEdges, storeSetEdges, profileId, addLog]
  );

  // Drop блока с палитры на холст
  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const blockType = e.dataTransfer.getData('application/zeroblocktype') as BlockType;
      const blockLabel = e.dataTransfer.getData('application/zeroblocklabel');
      if (!blockType || !reactFlowWrapper.current) return;

      const rect = reactFlowWrapper.current.getBoundingClientRect();
      const def = getBlockDef(blockType);

      // Вычисляем позицию относительно холста
      const position = {
        x: e.clientX - rect.left - 100,
        y: e.clientY - rect.top - 40,
      };

      const newNode: Node<ZeroNodeData> = {
        id: uuidv4(),
        type: 'zeroBlock',
        position,
        data: {
          blockType,
          label: blockLabel,
          status: 'idle',
          config: def?.defaultConfig as Record<string, unknown> ?? {},
        },
      };

      setNodes((nds) => {
        const updated = [...nds, newNode];
        storeSetNodes(profileId, updated);
        return updated;
      });

      addLog(profileId, newNode.id, {
        level: 'info',
        message: `Блок "${blockLabel}" добавлен на холст`,
      });
    },
    [setNodes, storeSetNodes, profileId, addLog]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  // Вернуться к профилям
  const goBack = () => {
    setActiveProfile(null);
    setActiveView('profiles');
  };

  if (!profile) return null;

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
      {/* Верхняя панель редактора */}
      <header
        style={{
          height: 'var(--layout-app-bar-height)',
          minHeight: 'var(--layout-app-bar-height)',
          borderBottom: '1px solid var(--global-border)',
          display: 'flex',
          alignItems: 'center',
          gap: '0',
          background: 'var(--pane-background)',
          flexShrink: 0,
          overflow: 'hidden',
        }}
      >
        {/* Лого + кнопка назад */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0',
            padding: '0 16px 0 16px',
            borderRight: '1px solid var(--pane-border)',
            height: '100%',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 'var(--border-radius-md)',
              background: 'var(--primary-accent)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: '8px',
              flexShrink: 0,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#141616" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-6)', marginRight: '16px' }}>
            Zero.ID
          </span>
          <button
            onClick={goBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--global-mute-text)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-4)',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              borderRadius: 'var(--border-radius-base)',
              transition: 'color var(--default-hover-animation-duration) ease-out',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--global-foreground)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--global-mute-text)')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Профили
          </button>
        </div>

        {/* Название профиля */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
            gap: '10px',
            overflow: 'hidden',
          }}
        >
          {/* Индикатор статуса профиля */}
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: profile.isActive ? 'var(--primary-accent)' : 'var(--color-gray-400)',
              flexShrink: 0,
              boxShadow: profile.isActive ? '0 0 6px var(--primary-accent)' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 'var(--font-size-6)',
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {profile.name}
          </span>
          <span style={{ fontSize: 'var(--font-size-3)', color: 'var(--global-mute-text)', flexShrink: 0 }}>
            {nodes.length} блоков · {edges.length} связей
          </span>
        </div>

        {/* Кнопки панели инструментов */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 16px', flexShrink: 0 }}>
          {/* Переключатель логов */}
          <button
            onClick={() => setShowLogs((v) => !v)}
            style={{
              background: showLogs ? 'var(--primary-accent-overlay)' : 'transparent',
              border: `1px solid ${showLogs ? 'var(--primary-accent)' : 'var(--pane-border)'}`,
              borderRadius: 'var(--border-radius-md)',
              padding: '5px 12px',
              color: showLogs ? 'var(--primary-accent)' : 'var(--global-body-text)',
              fontFamily: 'var(--main-font)',
              fontSize: 'var(--font-size-4)',
              cursor: 'pointer',
              transition: 'all var(--default-hover-animation-duration) ease-out',
            }}
          >
            Логи
          </button>
        </div>
      </header>

      {/* Рабочая область: палитра + холст + конфиг + [логи] */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Палитра блоков */}
        <ZeroBlockPalette />

        {/* Холст React Flow */}
        <div
          ref={reactFlowWrapper}
          style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          {/* Основной холст */}
          <div style={{ flex: showLogs ? '1 1 60%' : '1 1 100%', overflow: 'hidden', transition: 'flex 300ms ease' }}>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              onConnect={onConnect}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={nodeTypes}
              fitView
              deleteKeyCode="Delete"
              style={{ background: 'var(--global-background)' }}
              defaultEdgeOptions={{ animated: false, style: { stroke: 'var(--color-gray-400)', strokeWidth: 2 } }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="var(--color-gray-700)"
              />
              <Controls />
              <MiniMap
                nodeColor={(n) => {
                  const def = getBlockDef((n.data as ZeroNodeData)?.blockType);
                  return def ? '#1ded83' : '#5f6366';
                }}
                maskColor="rgba(20,22,22,0.6)"
              />
            </ReactFlow>
          </div>

          {/* Панель логов (снизу) */}
          {showLogs && (
            <div
              className="animate-fade-in"
              style={{
                flex: '0 0 220px',
                borderTop: '1px solid var(--pane-border)',
                overflow: 'hidden',
              }}
            >
              <ZeroLogsPanel profileId={profileId} />
            </div>
          )}
        </div>

        {/* Панель конфигурации блока */}
        <ZeroBlockConfigPanel profileId={profileId} />
      </div>
    </div>
  );
};
