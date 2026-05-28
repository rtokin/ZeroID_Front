// Правая панель конфигурации выбранного блока
import React, { useState } from 'react';
import { useZeroStore } from '../../store/useZeroStore';
import { buildCommand } from '../../lib/commandBuilder';
import { getBlockDef, CATEGORY_COLORS } from '../../lib/blockDefinitions';
import type { BlockType } from '../../types/zero.types';

// Импорт всех конфигураций
import { SshConfig } from './configs/SshConfig';
import { NmapConfig } from './configs/NmapConfig';
import { OpenVasConfig } from './configs/OpenVasConfig';
import { SqlInjectionConfig } from './configs/SqlInjectionConfig';
import { DosCheckConfig } from './configs/DosCheckConfig';
import { LibAuditConfig } from './configs/LibAuditConfig';
import { SslCheckConfig } from './configs/SslCheckConfig';
import { PortCheckConfig } from './configs/PortCheckConfig';
import { BruteCheckConfig } from './configs/BruteCheckConfig';
import { ConditionConfig } from './configs/ConditionConfig';
import { ReportConfig } from './configs/ReportConfig';

interface Props {
  profileId: string;
}

export const ZeroBlockConfigPanel: React.FC<Props> = ({ profileId }) => {
  const { selectedBlockId, setSelectedBlock, getActiveProfile, updateBlockConfig, addLog } = useZeroStore();
  const profile = getActiveProfile();
  const [showCommand, setShowCommand] = useState(false);

  if (!selectedBlockId || !profile) {
    return (
      <div
        style={{
          width: '280px',
          minWidth: '280px',
          borderLeft: '1px solid var(--pane-border)',
          background: 'var(--pane-background)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          flexShrink: 0,
        }}
      >
        <p
          style={{
            color: 'var(--global-mute-text)',
            fontSize: 'var(--font-size-4)',
            textAlign: 'center',
            lineHeight: 1.6,
          }}
        >
          Выберите блок на холсте для настройки
        </p>
      </div>
    );
  }

  const node = profile.nodes.find((n) => n.id === selectedBlockId);
  if (!node) return null;

  const blockType = node.data.blockType as BlockType;
  const config = (node.data.config as Record<string, unknown>) ?? {};
  const def = getBlockDef(blockType);
  const accentColor = def ? CATEGORY_COLORS[def.category] ?? 'var(--primary-accent)' : 'var(--primary-accent)';

  // Обновление одного ключа конфига и логирование изменения
  const handleChange = (key: string, value: unknown) => {
    updateBlockConfig(profileId, selectedBlockId, { [key]: value });
    addLog(profileId, selectedBlockId, {
      level: 'debug',
      message: `Конфиг обновлён: ${key} = ${JSON.stringify(value)}`,
    });
  };

  // Сформировать и показать итоговую команду
  const cmdResult = buildCommand(blockType, selectedBlockId, profileId, config);

  // Выбор нужной конфиг-панели по типу блока
  const renderConfig = () => {
    const props = { config, onChange: handleChange };
    switch (blockType) {
      case 'ssh_connect':   return <SshConfig {...props} />;
      case 'nmap_scan':     return <NmapConfig {...props} />;
      case 'openvas_scan':  return <OpenVasConfig {...props} />;
      case 'sql_injection': return <SqlInjectionConfig {...props} />;
      case 'dos_check':     return <DosCheckConfig {...props} />;
      case 'lib_audit':     return <LibAuditConfig {...props} />;
      case 'ssl_check':     return <SslCheckConfig {...props} />;
      case 'port_check':    return <PortCheckConfig {...props} />;
      case 'brute_check':   return <BruteCheckConfig {...props} />;
      case 'condition':     return <ConditionConfig {...props} />;
      case 'report':        return <ReportConfig {...props} />;
      default:              return <p style={{ color: 'var(--global-mute-text)' }}>Конфигурация недоступна</p>;
    }
  };

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        borderLeft: '1px solid var(--pane-border)',
        background: 'var(--pane-background)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}
    >
      {/* Заголовок панели */}
      <div
        style={{
          borderBottom: '1px solid var(--pane-border)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Маркер цвета категории */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: accentColor,
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontSize: 'var(--font-size-5)', fontWeight: 600, lineHeight: 1.2 }}>
              {node.data.label}
            </div>
            <div style={{ fontSize: 'var(--font-size-3)', color: 'var(--global-mute-text)' }}>
              {def?.category}
            </div>
          </div>
        </div>
        {/* Закрыть панель */}
        <button
          onClick={() => setSelectedBlock(null)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--global-mute-text)',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
            padding: '4px',
            borderRadius: 'var(--border-radius-base)',
            transition: 'color var(--default-hover-animation-duration) ease-out',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--global-foreground)')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = 'var(--global-mute-text)')}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Скроллируемый контент конфигурации */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {renderConfig()}

        {/* Секция API-команды */}
        <div style={{ marginTop: '16px' }}>
          <button
            onClick={() => setShowCommand((v) => !v)}
            style={{
              width: '100%',
              background: 'var(--global-background)',
              border: '1px solid var(--pane-border)',
              borderRadius: 'var(--border-radius-md)',
              padding: '8px 12px',
              color: 'var(--global-body-text)',
              fontFamily: 'var(--main-font)',
              fontSize: 'var(--font-size-4)',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'border-color var(--default-hover-animation-duration) ease-out',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border-hover)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)')}
          >
            <span>Сформированная команда (API)</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ transform: showCommand ? 'rotate(180deg)' : 'none', transition: 'transform 200ms ease' }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showCommand && (
            <div
              style={{
                marginTop: '8px',
                background: 'var(--global-background)',
                border: '1px solid var(--pane-border)',
                borderRadius: 'var(--border-radius-md)',
                padding: '10px',
                fontSize: 'var(--font-size-3)',
                fontFamily: 'var(--code-font)',
                color: 'var(--primary-accent)',
                wordBreak: 'break-all',
                lineHeight: 1.6,
                maxHeight: '150px',
                overflow: 'auto',
              }}
            >
              {cmdResult.builtCommand}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
