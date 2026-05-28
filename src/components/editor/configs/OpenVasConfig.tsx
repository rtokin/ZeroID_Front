// Конфигурация OpenVAS / GVM сканирования
import React from 'react';
import { ConfigRow, ConfigInput, ConfigSelect, ConfigSection } from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const OpenVasConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    host: string; port: number; username: string; password: string;
    scanConfigId: string; targetHost: string; portList: string;
    maxHosts: number; maxChecks: number; reportFormat: string;
  };

  return (
    <>
      <ConfigSection title="Подключение к GVM">
        <ConfigRow label="Хост GVM">
          <ConfigInput value={c.host} placeholder="127.0.0.1" onChange={(v) => onChange('host', v)} />
        </ConfigRow>
        <ConfigRow label="Порт">
          <ConfigInput type="number" value={String(c.port)} placeholder="9390" onChange={(v) => onChange('port', Number(v))} />
        </ConfigRow>
        <ConfigRow label="Пользователь">
          <ConfigInput value={c.username} placeholder="admin" onChange={(v) => onChange('username', v)} />
        </ConfigRow>
        <ConfigRow label="Пароль">
          <ConfigInput type="password" value={c.password} placeholder="••••••" onChange={(v) => onChange('password', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Конфигурация сканирования">
        <ConfigRow label="ID конфигурации сканирования">
          <ConfigInput
            value={c.scanConfigId}
            placeholder="daba56c8-73ec-11df-a475-002264764cea (Full and Fast)"
            onChange={(v) => onChange('scanConfigId', v)}
          />
        </ConfigRow>
        <ConfigRow label="Целевой хост">
          <ConfigInput value={c.targetHost} placeholder="192.168.1.100" onChange={(v) => onChange('targetHost', v)} />
        </ConfigRow>
        <ConfigRow label="Список портов">
          <ConfigInput value={c.portList} placeholder="All IANA assigned TCP" onChange={(v) => onChange('portList', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Параметры производительности">
        <ConfigRow label="Макс. хостов">
          <ConfigInput type="number" value={String(c.maxHosts)} placeholder="1" onChange={(v) => onChange('maxHosts', Number(v))} />
        </ConfigRow>
        <ConfigRow label="Макс. проверок">
          <ConfigInput type="number" value={String(c.maxChecks)} placeholder="10" onChange={(v) => onChange('maxChecks', Number(v))} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Отчёт">
        <ConfigRow label="Формат отчёта">
          <ConfigSelect
            value={c.reportFormat}
            options={[
              { value: 'pdf',  label: 'PDF' },
              { value: 'xml',  label: 'XML' },
              { value: 'html', label: 'HTML' },
              { value: 'csv',  label: 'CSV' },
            ]}
            onChange={(v) => onChange('reportFormat', v)}
          />
        </ConfigRow>
      </ConfigSection>
    </>
  );
};
