// Конфигурационная панель SSH подключения
import React from 'react';
import { ConfigRow, ConfigInput, ConfigSelect, ConfigSection } from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const SshConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    host: string; port: number; username: string;
    authMethod: string; password: string; privateKeyPath: string; timeout: number;
  };

  return (
    <>
      <ConfigSection title="Подключение">
        <ConfigRow label="Хост / IP">
          <ConfigInput
            value={c.host}
            placeholder="192.168.1.1 или example.com"
            onChange={(v) => onChange('host', v)}
          />
        </ConfigRow>
        <ConfigRow label="Порт">
          <ConfigInput
            type="number"
            value={String(c.port)}
            placeholder="22"
            onChange={(v) => onChange('port', Number(v))}
          />
        </ConfigRow>
        <ConfigRow label="Пользователь">
          <ConfigInput
            value={c.username}
            placeholder="root"
            onChange={(v) => onChange('username', v)}
          />
        </ConfigRow>
        <ConfigRow label="Таймаут (сек)">
          <ConfigInput
            type="number"
            value={String(c.timeout)}
            placeholder="30"
            onChange={(v) => onChange('timeout', Number(v))}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Аутентификация">
        <ConfigRow label="Метод">
          <ConfigSelect
            value={c.authMethod}
            options={[
              { value: 'password', label: 'Пароль' },
              { value: 'key', label: 'SSH ключ' },
            ]}
            onChange={(v) => onChange('authMethod', v)}
          />
        </ConfigRow>

        {c.authMethod === 'password' && (
          <ConfigRow label="Пароль">
            <ConfigInput
              type="password"
              value={c.password}
              placeholder="••••••••"
              onChange={(v) => onChange('password', v)}
            />
          </ConfigRow>
        )}

        {c.authMethod === 'key' && (
          <ConfigRow label="Путь к ключу">
            <ConfigInput
              value={c.privateKeyPath}
              placeholder="/home/user/.ssh/id_rsa"
              onChange={(v) => onChange('privateKeyPath', v)}
            />
          </ConfigRow>
        )}
      </ConfigSection>
    </>
  );
};
