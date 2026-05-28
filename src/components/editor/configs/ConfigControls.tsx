// Переиспользуемые UI-контролы для панелей конфигурации блоков
import React from 'react';

// Секция с заголовком
export const ConfigSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div style={{ marginBottom: '16px' }}>
    <div
      style={{
        fontSize: 'var(--font-size-3)',
        fontWeight: 600,
        color: 'var(--primary-accent)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: '10px',
        paddingBottom: '6px',
        borderBottom: '1px solid var(--pane-border)',
      }}
    >
      {title}
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {children}
    </div>
  </div>
);

// Строка с лейблом и контролом
export const ConfigRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
    <label style={{ fontSize: 'var(--font-size-3)', color: 'var(--global-mute-text)', fontWeight: 500 }}>
      {label}
    </label>
    {children}
  </div>
);

// Базовые стили для инпутов
const inputStyle: React.CSSProperties = {
  background: 'var(--global-background)',
  border: '1px solid var(--pane-border)',
  borderRadius: 'var(--border-radius-md)',
  padding: '7px 10px',
  color: 'var(--global-foreground)',
  fontSize: 'var(--font-size-4)',
  fontFamily: 'var(--code-font)',
  outline: 'none',
  width: '100%',
  transition: 'border-color var(--default-hover-animation-duration) ease-out',
};

// Текстовый / числовой / password инпут
export const ConfigInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}> = ({ value, onChange, placeholder, type = 'text' }) => (
  <input
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    style={inputStyle}
    onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
    onBlur={(e) => (e.target.style.borderColor = 'var(--pane-border)')}
  />
);

// Textarea
export const ConfigTextarea: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}> = ({ value, onChange, placeholder, rows = 3 }) => (
  <textarea
    value={value}
    placeholder={placeholder}
    rows={rows}
    onChange={(e) => onChange(e.target.value)}
    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
    onFocus={(e) => (e.target.style.borderColor = 'var(--primary-accent)')}
    onBlur={(e) => (e.target.style.borderColor = 'var(--pane-border)')}
  />
);

// Select
export const ConfigSelect: React.FC<{
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ value, options, onChange }) => (
  <select
    value={value}
    onChange={(e) => onChange(e.target.value)}
    style={{
      ...inputStyle,
      cursor: 'pointer',
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%235f6366' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 10px center',
      paddingRight: '30px',
    }}
  >
    {options.map((o) => (
      <option key={o.value} value={o.value} style={{ background: 'var(--pane-background)' }}>
        {o.label}
      </option>
    ))}
  </select>
);

// Toggle (чекбокс в стиле переключателя)
export const ConfigToggle: React.FC<{
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}> = ({ label, value, onChange, description }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '12px',
      padding: '6px 0',
      cursor: 'pointer',
    }}
    onClick={() => onChange(!value)}
  >
    <div>
      <div style={{ fontSize: 'var(--font-size-4)', color: 'var(--global-body-text)', fontWeight: 500 }}>
        {label}
      </div>
      {description && (
        <div style={{ fontSize: 'var(--font-size-3)', color: 'var(--global-mute-text)', marginTop: '2px' }}>
          {description}
        </div>
      )}
    </div>
    {/* Переключатель */}
    <div
      style={{
        width: 36,
        height: 20,
        borderRadius: 'var(--border-radius-full)',
        background: value ? 'var(--primary-accent)' : 'var(--color-gray-700)',
        position: 'relative',
        flexShrink: 0,
        transition: 'background var(--default-animation-duration) ease-out',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 3,
          left: value ? 19 : 3,
          width: 14,
          height: 14,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left var(--default-animation-duration) ease-out',
        }}
      />
    </div>
  </div>
);

// Число со слайдером
export const ConfigSlider: React.FC<{
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
}> = ({ value, min, max, step = 1, onChange }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{
        flex: 1,
        accentColor: 'var(--primary-accent)',
        cursor: 'pointer',
      }}
    />
    <span
      style={{
        minWidth: '28px',
        textAlign: 'right',
        fontSize: 'var(--font-size-4)',
        color: 'var(--primary-accent)',
        fontFamily: 'var(--code-font)',
        fontWeight: 600,
      }}
    >
      {value}
    </span>
  </div>
);
