// Конфигурация DoS/DDoS проверки
import React from 'react';
import {
  ConfigRow, ConfigInput, ConfigSelect, ConfigToggle,
  ConfigSection, ConfigSlider,
} from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const DosCheckConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    target: string; port: number; protocol: string; threads: number;
    duration: number; requestsPerSecond: number;
    checkSynFlood: boolean; checkUdpFlood: boolean;
    checkHttpFlood: boolean; checkSlowloris: boolean;
  };

  return (
    <>
      <ConfigSection title="Цель">
        <ConfigRow label="Хост / IP">
          <ConfigInput value={c.target} placeholder="192.168.1.1" onChange={(v) => onChange('target', v)} />
        </ConfigRow>
        <ConfigRow label="Порт">
          <ConfigInput type="number" value={String(c.port)} placeholder="80" onChange={(v) => onChange('port', Number(v))} />
        </ConfigRow>
        <ConfigRow label="Протокол">
          <ConfigSelect
            value={c.protocol}
            options={[
              { value: 'tcp', label: 'TCP' },
              { value: 'udp', label: 'UDP' },
              { value: 'http', label: 'HTTP' },
              { value: 'https', label: 'HTTPS' },
            ]}
            onChange={(v) => onChange('protocol', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Параметры нагрузки">
        <ConfigRow label={`Потоков: ${c.threads}`}>
          <ConfigSlider value={c.threads} min={1} max={500} onChange={(v) => onChange('threads', v)} />
        </ConfigRow>
        <ConfigRow label={`Длительность: ${c.duration} сек`}>
          <ConfigSlider value={c.duration} min={5} max={300} onChange={(v) => onChange('duration', v)} />
        </ConfigRow>
        <ConfigRow label={`Запросов в секунду: ${c.requestsPerSecond}`}>
          <ConfigSlider value={c.requestsPerSecond} min={1} max={10000} step={50} onChange={(v) => onChange('requestsPerSecond', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Типы проверок">
        <ConfigToggle
          label="SYN Flood"
          description="Лавина TCP SYN пакетов"
          value={c.checkSynFlood}
          onChange={(v) => onChange('checkSynFlood', v)}
        />
        <ConfigToggle
          label="UDP Flood"
          description="Лавина UDP пакетов"
          value={c.checkUdpFlood}
          onChange={(v) => onChange('checkUdpFlood', v)}
        />
        <ConfigToggle
          label="HTTP Flood"
          description="Массовые HTTP-запросы"
          value={c.checkHttpFlood}
          onChange={(v) => onChange('checkHttpFlood', v)}
        />
        <ConfigToggle
          label="Slowloris"
          description="Медленное удержание соединений"
          value={c.checkSlowloris}
          onChange={(v) => onChange('checkSlowloris', v)}
        />
      </ConfigSection>
    </>
  );
};
