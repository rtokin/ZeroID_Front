// Конфигурация блока отчёта
import React from 'react';
import { ConfigRow, ConfigInput, ConfigSelect, ConfigToggle, ConfigSection } from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const ReportConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    title: string; format: string; outputPath: string;
    includeLogs: boolean; includeSummary: boolean;
    sendEmail: boolean; emailTo: string; severity: string;
  };

  return (
    <>
      <ConfigSection title="Отчёт">
        <ConfigRow label="Заголовок">
          <ConfigInput value={c.title} placeholder="Zero.ID Security Report" onChange={(v) => onChange('title', v)} />
        </ConfigRow>
        <ConfigRow label="Формат">
          <ConfigSelect
            value={c.format}
            options={[
              { value: 'html',     label: 'HTML' },
              { value: 'json',     label: 'JSON' },
              { value: 'pdf',      label: 'PDF' },
              { value: 'markdown', label: 'Markdown' },
            ]}
            onChange={(v) => onChange('format', v)}
          />
        </ConfigRow>
        <ConfigRow label="Папка сохранения">
          <ConfigInput value={c.outputPath} placeholder="./reports/" onChange={(v) => onChange('outputPath', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Содержимое">
        <ConfigToggle label="Включить логи блоков" value={c.includeLogs} onChange={(v) => onChange('includeLogs', v)} />
        <ConfigToggle label="Включить сводку" value={c.includeSummary} onChange={(v) => onChange('includeSummary', v)} />
        <ConfigRow label="Минимальный уровень угроз">
          <ConfigSelect
            value={c.severity}
            options={[
              { value: 'all',      label: 'Все находки' },
              { value: 'high',     label: 'High и выше' },
              { value: 'critical', label: 'Только Critical' },
            ]}
            onChange={(v) => onChange('severity', v)}
          />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Уведомление">
        <ConfigToggle
          label="Отправить на Email"
          value={c.sendEmail}
          onChange={(v) => onChange('sendEmail', v)}
        />
        {c.sendEmail && (
          <ConfigRow label="Email адрес">
            <ConfigInput type="email" value={c.emailTo} placeholder="security@company.com" onChange={(v) => onChange('emailTo', v)} />
          </ConfigRow>
        )}
      </ConfigSection>
    </>
  );
};
