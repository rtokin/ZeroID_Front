// Конфигурация условного блока (ветвление потока)
import React from 'react';
import { ConfigRow, ConfigInput, ConfigSelect, ConfigSection } from './ConfigControls';

interface Props {
  config: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}

export const ConditionConfig: React.FC<Props> = ({ config, onChange }) => {
  const c = config as {
    field: string; operator: string; value: string;
    trueLabel: string; falseLabel: string;
  };

  return (
    <>
      <ConfigSection title="Условие">
        <ConfigRow label="Поле из результата предыдущего блока">
          <ConfigInput value={c.field} placeholder="status / severity / open_ports" onChange={(v) => onChange('field', v)} />
        </ConfigRow>
        <ConfigRow label="Оператор">
          <ConfigSelect
            value={c.operator}
            options={[
              { value: 'eq',       label: '== Равно' },
              { value: 'ne',       label: '!= Не равно' },
              { value: 'gt',       label: '>  Больше' },
              { value: 'lt',       label: '<  Меньше' },
              { value: 'contains', label: 'Содержит' },
              { value: 'regex',    label: 'RegEx совпадение' },
            ]}
            onChange={(v) => onChange('operator', v)}
          />
        </ConfigRow>
        <ConfigRow label="Значение">
          <ConfigInput value={c.value} placeholder="vulnerable / critical / 0" onChange={(v) => onChange('value', v)} />
        </ConfigRow>
      </ConfigSection>

      <ConfigSection title="Метки ветвей">
        <ConfigRow label="Метка ветви ИСТИНА (низ)">
          <ConfigInput value={c.trueLabel} placeholder="Уязвимость найдена" onChange={(v) => onChange('trueLabel', v)} />
        </ConfigRow>
        <ConfigRow label="Метка ветви ЛОЖЬ (право)">
          <ConfigInput value={c.falseLabel} placeholder="Чисто" onChange={(v) => onChange('falseLabel', v)} />
        </ConfigRow>
      </ConfigSection>
    </>
  );
};
