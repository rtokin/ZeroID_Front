// Полная конфигурация Nmap — все флаги как в nmap --help
import React from 'react';
import {
  ConfigRow, ConfigInput, ConfigSelect, ConfigToggle,
  ConfigSection, ConfigSlider, ConfigTextarea,
} from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const NmapConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    target: string; scanType: string; flags: Record<string, boolean>;
    ports: string; timing: number; outputFormat: string; outputFile: string; extraArgs: string;
  };
  const flags = c.flags ?? {};

  const setFlag = (key: string, val: boolean) =>
    onChange('flags', { ...flags, [key]: val });

  return (
    <>
      <ConfigSection title="Цель">
        <ConfigRow label="Хост / IP / Подсеть">
          <ConfigInput
            value={c.target}
            placeholder="192.168.1.0/24 или example.com"
            onChange={(v) => onChange('target', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Тип сканирования">
        <ConfigRow label="Режим">
          <ConfigSelect
            value={c.scanType}
            options={[
              { value: 'sS', label: '-sS  SYN Stealth (по умолчанию)' },
              { value: 'sT', label: '-sT  TCP Connect' },
              { value: 'sU', label: '-sU  UDP сканирование' },
              { value: 'sA', label: '-sA  TCP ACK' },
              { value: 'sW', label: '-sW  TCP Window' },
              { value: 'sM', label: '-sM  Maimon' },
            ]}
            onChange={(v) => onChange('scanType', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Флаги обнаружения">
        <ConfigToggle
          label="-sV  Определение версий сервисов"
          value={flags.serviceVersion ?? true}
          onChange={(v) => setFlag('serviceVersion', v)}
        />
        <ConfigToggle
          label="-sC  Скрипты по умолчанию (NSE)"
          value={flags.defaultScripts ?? false}
          onChange={(v) => setFlag('defaultScripts', v)}
        />
        <ConfigToggle
          label="-O   Определение ОС"
          value={flags.osDetection ?? false}
          onChange={(v) => setFlag('osDetection', v)}
        />
        <ConfigToggle
          label="-A   Агрессивное сканирование (-sV -sC -O --traceroute)"
          value={flags.aggressiveScan ?? false}
          onChange={(v) => setFlag('aggressiveScan', v)}
        />
        <ConfigToggle
          label="-v   Подробный вывод"
          value={flags.verboseMode ?? false}
          onChange={(v) => setFlag('verboseMode', v)}
        />
        <ConfigToggle
          label="-Pn  Пропустить обнаружение хоста (считать онлайн)"
          value={flags.noHostDiscovery ?? false}
          onChange={(v) => setFlag('noHostDiscovery', v)}
        />
        <ConfigToggle
          label="-F   Быстрый режим (100 портов)"
          value={flags.fastMode ?? false}
          onChange={(v) => setFlag('fastMode', v)}
        />
        <ConfigToggle
          label="-p-  Сканировать все 65535 портов"
          value={flags.allPorts ?? false}
          onChange={(v) => setFlag('allPorts', v)}
        />
      </ConfigSection>

      <ConfigSection title="Порты">
        <ConfigRow label="Диапазон портов (игнорируется при -F или -p-)">
          <ConfigInput
            value={c.ports}
            placeholder="80,443,22 или 1-1000"
            onChange={(v) => onChange('ports', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Производительность">
        <ConfigRow label={`-T${c.timing}  Тайминг (0=paranoid ... 5=insane)`}>
          <ConfigSlider
            value={c.timing as number}
            min={0}
            max={5}
            onChange={(v) => onChange('timing', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Вывод">
        <ConfigRow label="Формат">
          <ConfigSelect
            value={c.outputFormat}
            options={[
              { value: 'normal',   label: '-oN  Обычный текст' },
              { value: 'xml',      label: '-oX  XML' },
              { value: 'grepable', label: '-oG  Grepable' },
              { value: 'all',      label: '-oA  Все форматы' },
            ]}
            onChange={(v) => onChange('outputFormat', v)}
          />
        </ConfigRow>
        <ConfigRow label="Файл вывода">
          <ConfigInput
            value={c.outputFile}
            placeholder="nmap_result.txt"
            onChange={(v) => onChange('outputFile', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Дополнительно">
        <ConfigRow label="Произвольные аргументы">
          <ConfigTextarea
            value={c.extraArgs}
            placeholder="--script vuln --traceroute --reason"
            rows={2}
            onChange={(v) => onChange('extraArgs', v)}
          />
        </ConfigRow>
      </ConfigSection>
    </>
  );
};
