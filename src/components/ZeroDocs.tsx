// Экран документации и справки по приложению
import React, { useState } from 'react';
import { useZeroStore } from '../store/useZeroStore';
import { BLOCK_DEFINITIONS, CATEGORY_LABELS, CATEGORY_COLORS } from '../lib/blockDefinitions';

const SECTIONS = [
  { id: 'overview',    title: 'Обзор' },
  { id: 'auth',        title: 'Авторизация' },
  { id: 'profiles',    title: 'Профили' },
  { id: 'editor',      title: 'Редактор' },
  { id: 'blocks',      title: 'Блоки' },
  { id: 'api',         title: 'API блоков' },
  { id: 'install',     title: 'Установка и сборка' },
];

export const ZeroDocs: React.FC = () => {
  const { setActiveView, logout } = useZeroStore();
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--global-background)', overflow: 'hidden' }}>
      {/* Шапка */}
      <header
        style={{
          height: 'var(--layout-app-bar-height)',
          minHeight: 'var(--layout-app-bar-height)',
          borderBottom: '1px solid var(--global-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 24px',
          background: 'var(--pane-background)',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: 28, height: 28, borderRadius: 'var(--border-radius-md)', background: 'var(--primary-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#141616" /></svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 'var(--font-size-7)' }}>Zero.ID</span>
          <span style={{ color: 'var(--global-mute-text)', fontSize: 'var(--font-size-4)' }}>/ Документация</span>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setActiveView('profiles')} style={{ background: 'transparent', border: '1px solid var(--pane-border)', borderRadius: 'var(--border-radius-md)', padding: '5px 14px', color: 'var(--global-body-text)', fontFamily: 'var(--main-font)', fontSize: 'var(--font-size-4)', cursor: 'pointer', transition: 'border-color 100ms ease-out' }} onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border-hover)')} onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)')}>
            Профили
          </button>
          <button onClick={logout} style={{ background: 'transparent', border: '1px solid var(--pane-border)', borderRadius: 'var(--border-radius-md)', padding: '5px 14px', color: 'var(--global-body-text)', fontFamily: 'var(--main-font)', fontSize: 'var(--font-size-4)', cursor: 'pointer', transition: 'all 100ms ease-out' }} onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--danger-default)'; (e.currentTarget as HTMLElement).style.color = 'var(--danger-high-contrast)'; }} onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = 'var(--pane-border)'; (e.currentTarget as HTMLElement).style.color = 'var(--global-body-text)'; }}>
            Выйти
          </button>
        </div>
      </header>

      {/* Контент: навигация + содержимое */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Боковая навигация */}
        <nav style={{ width: '200px', minWidth: '200px', borderRight: '1px solid var(--pane-border)', background: 'var(--pane-background)', padding: '16px 0', flexShrink: 0, overflow: 'auto' }}>
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '8px 16px',
                background: activeSection === s.id ? 'var(--primary-accent-overlay)' : 'transparent',
                border: 'none',
                borderLeft: `2px solid ${activeSection === s.id ? 'var(--primary-accent)' : 'transparent'}`,
                color: activeSection === s.id ? 'var(--primary-accent)' : 'var(--global-body-text)',
                fontFamily: 'var(--main-font)',
                fontSize: 'var(--font-size-4)',
                cursor: 'pointer',
                transition: 'all var(--default-hover-animation-duration) ease-out',
              }}
            >
              {s.title}
            </button>
          ))}
        </nav>

        {/* Текст документации */}
        <div style={{ flex: 1, overflow: 'auto', padding: '32px 40px', maxWidth: '800px' }}>
          {activeSection === 'overview' && <OverviewSection />}
          {activeSection === 'auth' && <AuthSection />}
          {activeSection === 'profiles' && <ProfilesSection />}
          {activeSection === 'editor' && <EditorSection />}
          {activeSection === 'blocks' && <BlocksSection />}
          {activeSection === 'api' && <ApiSection />}
          {activeSection === 'install' && <InstallSection />}
        </div>
      </div>
    </div>
  );
};

// --- Разделы документации ---

const H1: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h1 style={{ fontSize: 'var(--font-size-10)', fontWeight: 700, marginBottom: '16px', color: 'var(--global-foreground)' }}>{children}</h1>
);
const H2: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ fontSize: 'var(--font-size-8)', fontWeight: 600, marginTop: '28px', marginBottom: '10px', color: 'var(--global-foreground)' }}>{children}</h2>
);
const P: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p style={{ fontSize: 'var(--font-size-5)', color: 'var(--global-body-text)', lineHeight: 1.7, marginBottom: '12px' }}>{children}</p>
);
const Code: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <code style={{ fontFamily: 'var(--code-font)', background: 'var(--pane-muted-background)', border: '1px solid var(--pane-border)', borderRadius: 'var(--border-radius-base)', padding: '1px 6px', fontSize: 'var(--font-size-4)', color: 'var(--primary-accent)' }}>{children}</code>
);
const CodeBlock: React.FC<{ children: string }> = ({ children }) => (
  <pre style={{ fontFamily: 'var(--code-font)', background: 'var(--pane-background)', border: '1px solid var(--pane-border)', borderRadius: 'var(--border-radius-lg)', padding: '16px', fontSize: 'var(--font-size-4)', color: 'var(--global-body-text)', overflowX: 'auto', lineHeight: 1.6, marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{children}</pre>
);

const OverviewSection = () => (
  <div>
    <H1>Zero.ID — Security Audit Tool</H1>
    <P>Zero.ID — это настольный инструмент для ИБ-специалистов, позволяющий визуально строить сценарии проверки безопасности серверов с помощью блочного редактора в стиле Node-RED.</P>
    <H2>Основные возможности</H2>
    <P>Создание профилей — набора блоков, выстроенных в граф. Каждый блок представляет одну операцию: подключение по SSH, сканирование nmap, поиск SQL-инъекций и т.д.</P>
    <P>Блоки соединяются стрелками, образуя DAG-сценарий. Результат каждого блока может быть передан следующему.</P>
    <H2>Технологии</H2>
    <P>Frontend: React + TypeScript + React Flow + Zustand. Сборка в EXE: Tauri (Rust + WebView).</P>
  </div>
);

const AuthSection = () => (
  <div>
    <H1>Авторизация</H1>
    <P>При запуске приложение требует ввода логина и пароля. В текущей тестовой версии используются захардкоженные данные:</P>
    <CodeBlock>Логин: admin\nПароль: admin</CodeBlock>
    <P>В продуктовой версии рекомендуется подключить базу данных (PostgreSQL / SQLite) с bcrypt-хешированием паролей.</P>
  </div>
);

const ProfilesSection = () => (
  <div>
    <H1>Профили</H1>
    <P>Профиль — это именованный сценарий проверки с набором блоков и связями между ними.</P>
    <H2>Создание профиля</H2>
    <P>На экране «Профили» нажмите «+ Новый профиль», введите название и описание, нажмите «Создать».</P>
    <H2>Переключение активности</H2>
    <P>Каждый профиль может быть активным или неактивным. Кнопка «Активен / Неактивен» переключает состояние. Активные профили подсвечиваются зелёным индикатором.</P>
    <H2>Удаление профиля</H2>
    <P>Нажмите кнопку корзины на карточке профиля. Появится подтверждение — нажмите «Удалить» для окончательного удаления.</P>
  </div>
);

const EditorSection = () => (
  <div>
    <H1>Редактор профиля</H1>
    <H2>Интерфейс</H2>
    <P>Редактор состоит из трёх зон: палитра блоков (слева), холст React Flow (центр), панель конфигурации (справа).</P>
    <H2>Добавление блоков</H2>
    <P>Перетащите блок из палитры слева на холст. Блок появится в том месте, куда вы его бросили.</P>
    <H2>Соединение блоков</H2>
    <P>Наведите мышь на нижний круг (выход) блока, зажмите и потяните к верхнему кругу (вход) следующего блока.</P>
    <H2>Конфигурация блока</H2>
    <P>Кликните по блоку на холсте — справа откроется панель с полными настройками. Все изменения мгновенно сохраняются в профиле.</P>
    <H2>Логи</H2>
    <P>Нажмите кнопку «Логи» в верхней панели — снизу холста откроется журнал событий. Логи разделены по блокам.</P>
    <H2>Удаление блоков</H2>
    <P>Выберите блок кликом, затем нажмите клавишу <Code>Delete</Code>.</P>
  </div>
);

const BlocksSection = () => (
  <div>
    <H1>Описание блоков</H1>
    {BLOCK_DEFINITIONS.map((def) => (
      <div key={def.type} style={{ marginBottom: '20px', padding: '16px', background: 'var(--pane-background)', border: '1px solid var(--pane-border)', borderRadius: 'var(--border-radius-lg)', borderLeft: `3px solid ${CATEGORY_COLORS[def.category]}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <span style={{ fontWeight: 600, fontSize: 'var(--font-size-6)' }}>{def.label}</span>
          <span style={{ fontSize: 'var(--font-size-3)', color: CATEGORY_COLORS[def.category], background: `${CATEGORY_COLORS[def.category]}18`, border: `1px solid ${CATEGORY_COLORS[def.category]}44`, borderRadius: 'var(--border-radius-full)', padding: '1px 8px' }}>
            {CATEGORY_LABELS[def.category]}
          </span>
        </div>
        <p style={{ fontSize: 'var(--font-size-4)', color: 'var(--global-mute-text)', lineHeight: 1.5 }}>{def.description}</p>
      </div>
    ))}
  </div>
);

const ApiSection = () => (
  <div>
    <H1>API блоков</H1>
    <P>Каждый блок формирует готовую команду, которую можно отправить на сервер через HTTP API.</P>
    <H2>Структура команды</H2>
    <CodeBlock>{`interface BlockApiCommand {
  blockType: string;    // тип блока
  nodeId:    string;    // ID узла
  profileId: string;    // ID профиля
  config:    object;    // конфигурация
  builtCommand: string; // готовая shell-команда
}`}</CodeBlock>
    <H2>Пример: Nmap блок</H2>
    <CodeBlock>{`POST /api/execute
{
  "blockType": "nmap_scan",
  "nodeId": "abc-123",
  "profileId": "profile-xyz",
  "builtCommand": "nmap -sS -sV -p 1-1000 -T3 -oN result.txt 192.168.1.1"
}`}</CodeBlock>
    <P>Кнопка «Сформированная команда (API)» в панели конфигурации показывает текущую команду блока.</P>
  </div>
);

const InstallSection = () => (
  <div>
    <H1>Установка и сборка</H1>
    <H2>Требования</H2>
    <P>Node.js 18+, Rust (для Tauri), Cargo. Для полноценной работы на сервере: nmap, openvas/gvm, sqlmap, hydra, testssl.sh.</P>
    <H2>Установка зависимостей</H2>
    <CodeBlock>{`npm install`}</CodeBlock>
    <H2>Запуск в режиме разработки (браузер)</H2>
    <CodeBlock>{`npm run dev`}</CodeBlock>
    <H2>Сборка Tauri EXE</H2>
    <CodeBlock>{`# Установить Tauri CLI
npm install -g @tauri-apps/cli

# Инициализировать Tauri (один раз)
npx tauri init

# Запустить в Tauri окне
npx tauri dev

# Собрать EXE
npx tauri build`}</CodeBlock>
    <P>EXE файл появится в <Code>src-tauri/target/release/bundle/</Code></P>
    <H2>Установка инструментов на сервер</H2>
    <CodeBlock>{`# Debian / Ubuntu
sudo apt install nmap sqlmap hydra

# OpenVAS
sudo apt install openvas
sudo gvm-setup
sudo gvm-start

# testssl.sh
git clone https://github.com/drwetter/testssl.sh
cd testssl.sh && sudo ln -s $(pwd)/testssl.sh /usr/local/bin/testssl.sh

# pip-audit
pip install pip-audit`}</CodeBlock>
  </div>
);
