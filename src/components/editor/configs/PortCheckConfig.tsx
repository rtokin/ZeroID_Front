// Конфигурация проверки портов
import React from 'react';
import { ConfigRow, ConfigInput, ConfigSelect, ConfigToggle, ConfigSection } from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const PortCheckConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    target: string; ports: string; protocol: string;
    timeout: number; checkBanner: boolean; checkFirewall: boolean;
  };

  return (
    <>
      <ConfigSection title="Цель">
        <ConfigRow label="Хост / IP">
          <ConfigInput value={c.target} placeholder="192.168.1.1" onChange={(v) => onChange('target', v)} />
        </ConfigRow>
        <ConfigRow label="Порты">
          <ConfigInput value={c.ports} placeholder="22,80,443,3306,5432" onChange={(v) => onChange('ports', v)} />
        </ConfigRow>
        <ConfigRow label="Протокол">
          <ConfigSelect
            value={c.protocol}
            options={[
              { value: 'tcp',  label: 'TCP' },
              { value: 'udp',  label: 'UDP' },
              { value: 'both', label: 'TCP + UDP' },
            ]}
            onChange={(v) => onChange('protocol', v)}
          />
        </ConfigRow>
        <ConfigRow label="Таймаут (сек)">
          <ConfigInput type="number" value={String(c.timeout)} placeholder="5" onChange={(v) => onChange('timeout', Number(v))} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Дополнительно">
        <ConfigToggle
          label="Получить баннер сервиса"
          description="Определить версию и имя приложения на порту"
          value={c.checkBanner}
          onChange={(v) => onChange('checkBanner', v)}
        />
        <ConfigToggle
          label="Проверить наличие firewall"
          description="Определить фильтрацию (filtered vs closed)"
          value={c.checkFirewall}
          onChange={(v) => onChange('checkFirewall', v)}
        />
      </ConfigSection>
    </>
  );
};
