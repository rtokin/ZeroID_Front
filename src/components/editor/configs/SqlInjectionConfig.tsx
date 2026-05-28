// Конфигурация SQL инъекций (sqlmap)
import React from 'react';
import {
  ConfigRow, ConfigInput, ConfigSelect, ConfigToggle,
  ConfigSection, ConfigSlider, ConfigTextarea,
} from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const SqlInjectionConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    url: string; method: string; data: string; cookies: string;
    level: number; risk: number; dbms: string; technique: string;
    dumpAll: boolean; tablesOnly: boolean; extraArgs: string;
  };

  return (
    <>
      <ConfigSection title="Цель">
        <ConfigRow label="URL">
          <ConfigInput value={c.url} placeholder="http://example.com/page?id=1" onChange={(v) => onChange('url', v)} />
        </ConfigRow>
        <ConfigRow label="Метод">
          <ConfigSelect
            value={c.method}
            options={[{ value: 'GET', label: 'GET' }, { value: 'POST', label: 'POST' }]}
            onChange={(v) => onChange('method', v)}
          />
        </ConfigRow>
        {c.method === 'POST' && (
          <ConfigRow label="Данные POST">
            <ConfigTextarea value={c.data} placeholder="user=admin&pass=test" onChange={(v) => onChange('data', v)} rows={2} />
          </ConfigRow>
        )}
        <ConfigRow label="Cookie">
          <ConfigInput value={c.cookies} placeholder="PHPSESSID=abc123" onChange={(v) => onChange('cookies', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Глубина тестирования">
        <ConfigRow label={`--level ${c.level}  (1=базовый, 5=максимум)`}>
          <ConfigSlider value={c.level} min={1} max={5} onChange={(v) => onChange('level', v)} />
        </ConfigRow>
        <ConfigRow label={`--risk ${c.risk}  (1=безопасный, 3=опасные тесты)`}>
          <ConfigSlider value={c.risk} min={1} max={3} onChange={(v) => onChange('risk', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="База данных">
        <ConfigRow label="СУБД (оставить пустым для автоопределения)">
          <ConfigSelect
            value={c.dbms}
            options={[
              { value: '', label: 'Автоопределение' },
              { value: 'mysql', label: 'MySQL' },
              { value: 'postgresql', label: 'PostgreSQL' },
              { value: 'mssql', label: 'Microsoft SQL Server' },
              { value: 'oracle', label: 'Oracle' },
              { value: 'sqlite', label: 'SQLite' },
              { value: 'access', label: 'Microsoft Access' },
            ]}
            onChange={(v) => onChange('dbms', v)}
          />
        </ConfigRow>
        <ConfigRow label="--technique (B=Boolean, E=Error, U=Union, S=Stack, T=Time, Q=Query)">
          <ConfigInput value={c.technique} placeholder="BEUSTQ" onChange={(v) => onChange('technique', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Действия при нахождении">
        <ConfigToggle
          label="--dump-all  Выгрузить все БД"
          value={c.dumpAll}
          onChange={(v) => onChange('dumpAll', v)}
        />
        <ConfigToggle
          label="--tables  Только список таблиц"
          value={c.tablesOnly}
          onChange={(v) => onChange('tablesOnly', v)}
        />
      </ConfigSection>

      <ConfigSection title="Дополнительно">
        <ConfigRow label="Произвольные аргументы">
          <ConfigTextarea value={c.extraArgs} placeholder="--random-agent --tor --dbs" rows={2} onChange={(v) => onChange('extraArgs', v)} />
        </ConfigRow>
      </ConfigSection>
    </>
  );
};
