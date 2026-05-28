// Конфигурация аудита библиотек/зависимостей
import React from 'react';
import {
  ConfigRow, ConfigInput, ConfigSelect, ConfigToggle, ConfigSection,
} from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const LibAuditConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    path: string; packageManager: string;
    checkOutdated: boolean; checkVulnerable: boolean;
    severityThreshold: string; autoFix: boolean; ignoreDevDeps: boolean;
  };

  return (
    <>
      <ConfigSection title="Проект">
        <ConfigRow label="Путь к проекту на сервере">
          <ConfigInput value={c.path} placeholder="/var/www/app" onChange={(v) => onChange('path', v)} />
        </ConfigRow>
        <ConfigRow label="Менеджер пакетов">
          <ConfigSelect
            value={c.packageManager}
            options={[
              { value: 'npm',      label: 'npm (Node.js)' },
              { value: 'pip',      label: 'pip (Python)' },
              { value: 'gem',      label: 'Bundler (Ruby)' },
              { value: 'composer', label: 'Composer (PHP)' },
              { value: 'cargo',    label: 'Cargo (Rust)' },
              { value: 'maven',    label: 'Maven (Java)' },
              { value: 'gradle',   label: 'Gradle (Java/Kotlin)' },
            ]}
            onChange={(v) => onChange('packageManager', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Проверки">
        <ConfigToggle
          label="Устаревшие зависимости"
          description="Найти пакеты, для которых вышли обновления"
          value={c.checkOutdated}
          onChange={(v) => onChange('checkOutdated', v)}
        />
        <ConfigToggle
          label="Уязвимые зависимости"
          description="Поиск CVE по базе NVD / OSV"
          value={c.checkVulnerable}
          onChange={(v) => onChange('checkVulnerable', v)}
        />
        <ConfigToggle
          label="Игнорировать dev-зависимости"
          value={c.ignoreDevDeps}
          onChange={(v) => onChange('ignoreDevDeps', v)}
        />
        <ConfigToggle
          label="Автоисправление (npm audit fix)"
          description="Только для npm, без гарантий"
          value={c.autoFix}
          onChange={(v) => onChange('autoFix', v)}
        />
      </ConfigSection>

      <ConfigSection title="Фильтр">
        <ConfigRow label="Минимальный уровень критичности">
          <ConfigSelect
            value={c.severityThreshold}
            options={[
              { value: 'low',      label: 'Low (все уязвимости)' },
              { value: 'moderate', label: 'Moderate' },
              { value: 'high',     label: 'High' },
              { value: 'critical', label: 'Critical только' },
            ]}
            onChange={(v) => onChange('severityThreshold', v)}
          />
        </ConfigRow>
      </ConfigSection>
    </>
  );
};
