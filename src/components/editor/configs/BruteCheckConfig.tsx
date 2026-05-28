// Конфигурация Brute Force проверки (hydra)
import React from 'react';
import {
  ConfigRow, ConfigInput, ConfigSelect, ConfigToggle,
  ConfigSection, ConfigSlider,
} from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const BruteCheckConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    target: string; port: number; service: string; username: string;
    wordlistPath: string; maxAttempts: number; delay: number; stopOnSuccess: boolean;
  };

  return (
    <>
      <ConfigSection title="Цель">
        <ConfigRow label="Хост / IP">
          <ConfigInput value={c.target} placeholder="192.168.1.1" onChange={(v) => onChange('target', v)} />
        </ConfigRow>
        <ConfigRow label="Порт">
          <ConfigInput type="number" value={String(c.port)} placeholder="22" onChange={(v) => onChange('port', Number(v))} />
        </ConfigRow>
        <ConfigRow label="Сервис">
          <ConfigSelect
            value={c.service}
            options={[
              { value: 'ssh',    label: 'SSH' },
              { value: 'ftp',    label: 'FTP' },
              { value: 'http',   label: 'HTTP Basic Auth' },
              { value: 'https',  label: 'HTTPS Basic Auth' },
              { value: 'smb',    label: 'SMB / Samba' },
              { value: 'rdp',    label: 'RDP' },
              { value: 'telnet', label: 'Telnet' },
            ]}
            onChange={(v) => onChange('service', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Учётные данные">
        <ConfigRow label="Имя пользователя">
          <ConfigInput value={c.username} placeholder="root" onChange={(v) => onChange('username', v)} />
        </ConfigRow>
        <ConfigRow label="Путь к словарю">
          <ConfigInput
            value={c.wordlistPath}
            placeholder="/usr/share/wordlists/rockyou.txt"
            onChange={(v) => onChange('wordlistPath', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Ограничения">
        <ConfigRow label={`Максимум попыток: ${c.maxAttempts}`}>
          <ConfigSlider value={c.maxAttempts} min={10} max={10000} step={10} onChange={(v) => onChange('maxAttempts', v)} />
        </ConfigRow>
        <ConfigRow label={`Задержка между попытками: ${c.delay} мс`}>
          <ConfigSlider value={c.delay} min={0} max={5000} step={100} onChange={(v) => onChange('delay', v)} />
        </ConfigRow>
        <ConfigToggle
          label="Остановить при первом успехе (-f)"
          value={c.stopOnSuccess}
          onChange={(v) => onChange('stopOnSuccess', v)}
        />
      </ConfigSection>
    </>
  );
};
