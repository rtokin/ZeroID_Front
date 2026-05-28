// Конфигурация SSL/TLS проверки
import React from 'react';
import {
  ConfigRow, ConfigInput, ConfigToggle, ConfigSection, ConfigSlider,
} from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const SslCheckConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    host: string; port: number; checkExpiry: boolean; checkChain: boolean;
    checkProtocols: boolean; checkCiphers: boolean; checkHsts: boolean;
    expiryWarningDays: number;
    protocols: Record<string, boolean>;
  };
  const protocols = c.protocols ?? {};

  const setProto = (key: string, val: boolean) =>
    onChange('protocols', { ...protocols, [key]: val });

  return (
    <>
      <ConfigSection title="Цель">
        <ConfigRow label="Хост">
          <ConfigInput value={c.host} placeholder="example.com" onChange={(v) => onChange('host', v)} />
        </ConfigRow>
        <ConfigRow label="Порт">
          <ConfigInput type="number" value={String(c.port)} placeholder="443" onChange={(v) => onChange('port', Number(v))} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Проверки сертификата">
        <ConfigToggle
          label="Срок действия"
          description="Предупреждение за N дней до истечения"
          value={c.checkExpiry}
          onChange={(v) => onChange('checkExpiry', v)}
        />
        {c.checkExpiry && (
          <ConfigRow label={`Предупреждать за ${c.expiryWarningDays} дней`}>
            <ConfigSlider value={c.expiryWarningDays} min={1} max={90} onChange={(v) => onChange('expiryWarningDays', v)} />
          </ConfigRow>
        )}
        <ConfigToggle
          label="Цепочка доверия (Chain of Trust)"
          value={c.checkChain}
          onChange={(v) => onChange('checkChain', v)}
        />
        <ConfigToggle
          label="HSTS заголовок"
          value={c.checkHsts}
          onChange={(v) => onChange('checkHsts', v)}
        />
      </ConfigSection>

      <ConfigSection title="Протоколы и шифры">
        <ConfigToggle
          label="Проверить поддерживаемые протоколы"
          value={c.checkProtocols}
          onChange={(v) => onChange('checkProtocols', v)}
        />
        <ConfigToggle
          label="Аудит шифров (cipher suites)"
          value={c.checkCiphers}
          onChange={(v) => onChange('checkCiphers', v)}
        />
      </ConfigSection>

      <ConfigSection title="Допустимые протоколы">
        <ConfigToggle label="SSLv2 (крайне небезопасно)" value={protocols.sslv2 ?? false} onChange={(v) => setProto('sslv2', v)} />
        <ConfigToggle label="SSLv3 (небезопасно)" value={protocols.sslv3 ?? false} onChange={(v) => setProto('sslv3', v)} />
        <ConfigToggle label="TLS 1.0 (устаревший)" value={protocols.tls10 ?? false} onChange={(v) => setProto('tls10', v)} />
        <ConfigToggle label="TLS 1.1 (устаревший)" value={protocols.tls11 ?? false} onChange={(v) => setProto('tls11', v)} />
        <ConfigToggle label="TLS 1.2 (рекомендуется)" value={protocols.tls12 ?? true} onChange={(v) => setProto('tls12', v)} />
        <ConfigToggle label="TLS 1.3 (оптимальный)" value={protocols.tls13 ?? true} onChange={(v) => setProto('tls13', v)} />
      </ConfigSection>
    </>
  );
};
