import { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { BACKEND_FILES, API_ENDPOINTS, type BackendFile } from './data/backendFiles';

// Цвета HTTP методов
const METHOD_COLORS: Record<string, string> = {
  GET:    '#14bcff',
  POST:   '#1ded83',
  PATCH:  '#ffd748',
  DELETE: '#f75049',
};

// Цвета категорий файлов
const CAT_COLORS: Record<string, string> = {
  core:   '#1ded83',
  infra:  '#14bcff',
  config: '#ffd748',
};

const CAT_LABELS: Record<string, string> = {
  core:   'Ядро',
  infra:  'Инфраструктура',
  config: 'Конфигурация',
};

type Tab = 'files' | 'api' | 'setup' | 'architecture';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('files');
  const [selectedFile, setSelectedFile] = useState<BackendFile>(BACKEND_FILES[0]);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#141616',
      color: '#e8eaea',
      fontFamily: "'Inter', 'Segoe UI', sans-serif",
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Шапка */}
      <header style={{
        borderBottom: '1px solid #2a2d2d',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        height: '56px',
        background: '#1a1d1d',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: '#1ded83',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
                fill="#141616" />
            </svg>
          </div>
          <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px' }}>Zero.ID</span>
          <span style={{
            fontSize: 12, color: '#5a5e5e', fontWeight: 500,
            borderLeft: '1px solid #2a2d2d', paddingLeft: 12, marginLeft: 4,
          }}>Backend Documentation</span>
        </div>

        <nav style={{ display: 'flex', gap: '4px', marginLeft: 'auto' }}>
          {(['files', 'api', 'setup', 'architecture'] as Tab[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{
              padding: '6px 14px',
              borderRadius: 6,
              border: 'none',
              background: activeTab === tab ? '#1ded83' : 'transparent',
              color: activeTab === tab ? '#141616' : '#8a8e8e',
              fontWeight: activeTab === tab ? 600 : 400,
              fontSize: 13,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              {tab === 'files' ? 'Файлы' : tab === 'api' ? 'API' : tab === 'setup' ? 'Запуск' : 'Архитектура'}
            </button>
          ))}
        </nav>
      </header>

      {/* Содержимое */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Вкладка: Файлы */}
        {activeTab === 'files' && (
          <div style={{ display: 'flex', width: '100%', overflow: 'hidden' }}>
            {/* Сайдбар с файлами */}
            <div style={{
              width: 240, minWidth: 240, borderRight: '1px solid #2a2d2d',
              background: '#1a1d1d', display: 'flex', flexDirection: 'column',
              overflow: 'auto',
            }}>
              <div style={{ padding: '12px 16px 8px', fontSize: 11, fontWeight: 600,
                color: '#5a5e5e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Исходные файлы
              </div>
              {Object.entries(CAT_LABELS).map(([cat, label]) => (
                <div key={cat}>
                  <div style={{ padding: '8px 16px 4px', fontSize: 10, fontWeight: 700,
                    color: CAT_COLORS[cat], textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                    {label}
                  </div>
                  {BACKEND_FILES.filter(f => f.category === cat).map(file => (
                    <button key={file.name} onClick={() => setSelectedFile(file)} style={{
                      width: '100%', textAlign: 'left', padding: '7px 16px 7px 20px',
                      background: selectedFile.name === file.name ? '#252929' : 'transparent',
                      border: 'none', borderLeft: selectedFile.name === file.name
                        ? `2px solid ${CAT_COLORS[cat]}` : '2px solid transparent',
                      color: selectedFile.name === file.name ? '#e8eaea' : '#8a8e8e',
                      fontSize: 13, cursor: 'pointer', transition: 'all 0.12s',
                      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                    }}
                      onMouseEnter={e => { if (selectedFile.name !== file.name) (e.currentTarget as HTMLElement).style.color = '#c8caca'; }}
                      onMouseLeave={e => { if (selectedFile.name !== file.name) (e.currentTarget as HTMLElement).style.color = '#8a8e8e'; }}
                    >
                      {file.name}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            {/* Просмотрщик кода */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Заголовок файла */}
              <div style={{
                padding: '12px 20px', borderBottom: '1px solid #2a2d2d',
                background: '#1a1d1d', display: 'flex', alignItems: 'center', gap: '12px',
                flexShrink: 0,
              }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: CAT_COLORS[selectedFile.category],
                }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 14,
                  fontWeight: 600, color: '#e8eaea',
                }}>
                  {selectedFile.path}
                </span>
                <span style={{
                  fontSize: 12, color: '#5a5e5e', borderLeft: '1px solid #2a2d2d',
                  paddingLeft: 12, marginLeft: 4,
                }}>
                  {selectedFile.description}
                </span>
                <button
                  onClick={() => handleCopy(selectedFile.content, selectedFile.name)}
                  style={{
                    marginLeft: 'auto', padding: '5px 12px', borderRadius: 6,
                    border: '1px solid #2a2d2d', background: 'transparent',
                    color: copied === selectedFile.name ? '#1ded83' : '#8a8e8e',
                    fontSize: 12, cursor: 'pointer', transition: 'all 0.15s',
                    fontFamily: 'inherit',
                  }}
                >
                  {copied === selectedFile.name ? 'Скопировано' : 'Копировать'}
                </button>
              </div>

              {/* Код */}
              <div style={{ flex: 1, overflow: 'auto' }}>
                <SyntaxHighlighter
                  language={selectedFile.language}
                  style={vscDarkPlus}
                  showLineNumbers
                  lineNumberStyle={{ color: '#3a3e3e', fontSize: 12, userSelect: 'none' }}
                  customStyle={{
                    margin: 0, padding: '20px', background: '#141616',
                    fontSize: 13, lineHeight: '1.6', minHeight: '100%',
                  }}
                >
                  {selectedFile.content}
                </SyntaxHighlighter>
              </div>
            </div>
          </div>
        )}

        {/* Вкладка: API эндпоинты */}
        {activeTab === 'api' && (
          <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#e8eaea' }}>
              REST API
            </h2>
            <p style={{ fontSize: 14, color: '#5a5e5e', marginBottom: 28 }}>
              Все эндпоинты требуют заголовок{' '}
              <code style={{ background: '#252929', padding: '2px 6px', borderRadius: 4, color: '#1ded83' }}>
                X-API-Key: zero_id_test_key
              </code>
            </p>

            {/* Таблица эндпоинтов */}
            <div style={{
              background: '#1a1d1d', border: '1px solid #2a2d2d', borderRadius: 10, overflow: 'hidden',
            }}>
              {API_ENDPOINTS.map((ep, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '16px',
                  padding: '12px 20px',
                  borderBottom: i < API_ENDPOINTS.length - 1 ? '1px solid #2a2d2d' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                }}>
                  <span style={{
                    fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em',
                    color: METHOD_COLORS[ep.method] || '#e8eaea',
                    minWidth: 52, textAlign: 'center',
                    background: (METHOD_COLORS[ep.method] || '#e8eaea') + '18',
                    border: `1px solid ${METHOD_COLORS[ep.method] || '#e8eaea'}40`,
                    borderRadius: 4, padding: '2px 6px',
                  }}>
                    {ep.method}
                  </span>
                  <code style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: '#c8caca',
                    flex: 1,
                  }}>
                    {ep.path}
                  </code>
                  <span style={{ fontSize: 13, color: '#5a5e5e', flexShrink: 0 }}>{ep.desc}</span>
                </div>
              ))}
            </div>

            {/* Пример запроса */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e8eaea' }}>
                Пример: запустить один блок из редактора
              </h3>
              <div style={{ position: 'relative' }}>
                <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{
                  borderRadius: 10, padding: 20, fontSize: 13, background: '#1a1d1d',
                  border: '1px solid #2a2d2d',
                }}>
                  {`POST /api/v1/execute/block
X-API-Key: zero_id_test_key
Content-Type: application/json

{
  "blockType": "nmap_scan",
  "nodeId":    "550e8400-e29b-41d4-a716-446655440000",
  "profileId": "7d793037-a077-4386-9cf4-b3a1ce61e5a4",
  "config": {
    "target": "192.168.1.1",
    "scanType": "sS",
    "ports": "1-1000",
    "timing": 3,
    "flags": { "serviceVersion": true, "noHostDiscovery": false }
  },
  "builtCommand": "nmap -sS -sV -p 1-1000 -T3 -oX - 192.168.1.1"
}`}
                </SyntaxHighlighter>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 24, color: '#e8eaea' }}>
                Ответ
              </h3>
              <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{
                borderRadius: 10, padding: 20, fontSize: 13, background: '#1a1d1d',
                border: '1px solid #2a2d2d',
              }}>
                {`{
  "jobId":       "celery-task-uuid",
  "executionId": "execution-uuid",
  "blockId":     "550e8400-e29b-41d4-a716-446655440000",
  "status":      "pending"
}

// Поллинг статуса:
// GET /api/v1/executions/{executionId}
// -> status: pending -> running -> success | failed
// -> logs: [{block_id, stdout, stderr, parsed_result, ...}]`}
              </SyntaxHighlighter>
            </div>

            {/* Структура блока */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e8eaea' }}>
                Структура блока профиля (DAG)
              </h3>
              <SyntaxHighlighter language="json" style={vscDarkPlus} customStyle={{
                borderRadius: 10, padding: 20, fontSize: 13, background: '#1a1d1d',
                border: '1px solid #2a2d2d',
              }}>
                {`{
  "blocks": [
    {
      "id":     "uuid-1",
      "type":   "nmap_scan",
      "params": { "target": "192.168.1.1", "flags": { "serviceVersion": true } },
      "next":   ["uuid-2"]
    },
    {
      "id":     "uuid-2",
      "type":   "condition",
      "params": { "field": "nmap_result.open_ports.80", "operator": "eq", "value": "True" },
      "next":   ["uuid-3"]
    },
    {
      "id":     "uuid-3",
      "type":   "dos_check",
      "params": { "target": "192.168.1.1", "port": 80, "checkSlowloris": true },
      "next":   []
    }
  ],
  "edges": [
    { "id": "e1", "source": "uuid-1", "target": "uuid-2", "animated": true },
    { "id": "e2", "source": "uuid-2", "target": "uuid-3", "animated": true }
  ]
}`}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Вкладка: Запуск */}
        {activeTab === 'setup' && (
          <div style={{ flex: 1, padding: '32px', overflow: 'auto', maxWidth: 860 }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#e8eaea' }}>
              Инструкция по запуску
            </h2>
            <p style={{ fontSize: 14, color: '#5a5e5e', marginBottom: 32 }}>
              Пошаговое руководство для запуска Zero.ID Backend на Windows (WSL), macOS или Linux.
            </p>

            {[
              {
                step: 1,
                title: 'Установить зависимости Python',
                desc: 'Python 3.11+ обязателен. Рекомендуется виртуальное окружение.',
                code: `# Создать виртуальное окружение
python -m venv venv

# Активировать (Linux/macOS)
source venv/bin/activate

# Активировать (Windows CMD)
venv\\Scripts\\activate.bat

# Установить все зависимости
pip install -r requirements.txt`,
                lang: 'bash',
              },
              {
                step: 2,
                title: 'Поднять PostgreSQL + Redis через Docker',
                desc: 'Docker Desktop должен быть установлен и запущен.',
                code: `# Из директории backend/
docker-compose up -d

# Проверить что контейнеры живы
docker ps
# zero_id_postgres   Up
# zero_id_redis      Up`,
                lang: 'bash',
              },
              {
                step: 3,
                title: 'Настроить переменные окружения',
                desc: 'Скопируй .env.example в .env и заполни SSH-параметры Kali Linux.',
                code: `cp .env.example .env

# Обязательно заполнить:
ZERO_ID_KALI_HOST=192.168.1.100   # IP Kali
ZERO_ID_KALI_USER=root
ZERO_ID_KALI_PASS=your_password

# Опционально (если используешь ключ):
ZERO_ID_KALI_AUTH=key
ZERO_ID_KALI_KEY_PATH=/path/to/id_rsa`,
                lang: 'bash',
              },
              {
                step: 4,
                title: 'Запустить Celery worker',
                desc: 'Worker должен быть запущен до FastAPI, так как принимает задачи из Redis.',
                code: `# В отдельном терминале (venv активирован)
celery -A celery_app.zero_id_celery worker \\
  --loglevel=info \\
  --queues=zero_id_tasks \\
  --concurrency=4`,
                lang: 'bash',
              },
              {
                step: 5,
                title: 'Запустить FastAPI через Uvicorn',
                desc: 'После этого бэкенд доступен на http://localhost:8000',
                code: `# В отдельном терминале (venv активирован)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

# Swagger UI доступен по адресу:
# http://localhost:8000/docs

# Health check:
# http://localhost:8000/health`,
                lang: 'bash',
              },
              {
                step: 6,
                title: 'Проверить подключение к бэкенду',
                desc: 'Тестовый запрос к API с API-ключом.',
                code: `# Список профилей
curl http://localhost:8000/api/v1/profiles \\
  -H "X-API-Key: zero_id_test_key"

# Ожидаемый ответ: []

# Создать тестовый профиль
curl -X POST http://localhost:8000/api/v1/profiles \\
  -H "X-API-Key: zero_id_test_key" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Test Profile", "description": "Тест", "blocks": [], "edges": []}'`,
                lang: 'bash',
              },
            ].map(({ step, title, desc, code, lang }) => (
              <div key={step} style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 10 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%',
                    background: '#1ded83', color: '#141616',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, flexShrink: 0, marginTop: 1,
                  }}>
                    {step}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: '#e8eaea' }}>{title}</div>
                    <div style={{ fontSize: 13, color: '#5a5e5e', marginTop: 2 }}>{desc}</div>
                  </div>
                </div>
                <div style={{ position: 'relative', marginLeft: 44 }}>
                  <button onClick={() => handleCopy(code, `step-${step}`)} style={{
                    position: 'absolute', top: 10, right: 10, zIndex: 10,
                    padding: '4px 10px', borderRadius: 5,
                    border: '1px solid #3a3e3e', background: '#1a1d1d',
                    color: copied === `step-${step}` ? '#1ded83' : '#5a5e5e',
                    fontSize: 11, cursor: 'pointer',
                  }}>
                    {copied === `step-${step}` ? 'OK' : 'Copy'}
                  </button>
                  <SyntaxHighlighter language={lang} style={vscDarkPlus} customStyle={{
                    borderRadius: 8, padding: '16px 20px', fontSize: 13, background: '#1a1d1d',
                    border: '1px solid #2a2d2d',
                  }}>
                    {code}
                  </SyntaxHighlighter>
                </div>
              </div>
            ))}

            {/* Production заметка */}
            <div style={{
              background: '#1a1d1d', border: '1px solid #2a2d2d', borderRadius: 10,
              padding: 20, marginTop: 8,
            }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#ffd748', marginBottom: 8 }}>
                Production (Linux systemd)
              </div>
              <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{
                borderRadius: 6, padding: 16, fontSize: 12, background: '#141616',
              }}>
                {`# Пример юнита для FastAPI: /etc/systemd/system/zero_id_api.service
[Unit]
Description=Zero.ID FastAPI Backend
After=network.target

[Service]
User=zero_id
WorkingDirectory=/opt/zero_id/backend
EnvironmentFile=/opt/zero_id/backend/.env
ExecStart=/opt/zero_id/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target

# Аналогично создай zero_id_celery.service для воркера
# После создания файлов:
systemctl daemon-reload
systemctl enable zero_id_api zero_id_celery
systemctl start  zero_id_api zero_id_celery`}
              </SyntaxHighlighter>
            </div>
          </div>
        )}

        {/* Вкладка: Архитектура */}
        {activeTab === 'architecture' && (
          <div style={{ flex: 1, padding: '32px', overflow: 'auto' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#e8eaea' }}>
              Архитектура Zero.ID
            </h2>
            <p style={{ fontSize: 14, color: '#5a5e5e', marginBottom: 32 }}>
              Схема взаимодействия компонентов: фронт, бэкенд, Celery, PostgreSQL, Redis, Kali Linux.
            </p>

            {/* Диаграмма потока */}
            <div style={{
              background: '#1a1d1d', border: '1px solid #2a2d2d', borderRadius: 10,
              padding: '28px 24px', marginBottom: 32,
            }}>
              <div style={{ fontSize: 13, color: '#5a5e5e', marginBottom: 20 }}>Поток выполнения профиля</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap', rowGap: 12 }}>
                {[
                  { label: 'Tauri App\n(React UI)', color: '#a78bfa' },
                  null,
                  { label: 'FastAPI\n:8000', color: '#1ded83' },
                  null,
                  { label: 'Redis\n:6379', color: '#f75049' },
                  null,
                  { label: 'Celery\nWorker', color: '#14bcff' },
                  null,
                  { label: 'Kali Linux\n(SSH)', color: '#ffd748' },
                ].map((item, i) => item === null ? (
                  <svg key={i} width="32" height="20" viewBox="0 0 32 20" style={{ flexShrink: 0 }}>
                    <path d="M0 10 L24 10 M18 4 L24 10 L18 16" stroke="#3a3e3e" strokeWidth="1.5" fill="none" />
                  </svg>
                ) : (
                  <div key={i} style={{
                    padding: '10px 16px', borderRadius: 8, textAlign: 'center',
                    border: `1px solid ${item.color}40`, background: `${item.color}12`,
                    fontSize: 12, color: item.color, fontWeight: 600, lineHeight: 1.4,
                    whiteSpace: 'pre-line', minWidth: 88,
                  }}>
                    {item.label}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '12px 16px', background: '#141616', borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: '#5a5e5e', lineHeight: 1.8 }}>
                  <div><span style={{ color: '#1ded83' }}>1.</span> Фронт POST /api/v1/profiles/<span style={{ color: '#c8caca' }}>{'{id}'}</span>/run с X-API-Key</div>
                  <div><span style={{ color: '#1ded83' }}>2.</span> FastAPI создаёт ProfileExecution (status=pending) в PostgreSQL</div>
                  <div><span style={{ color: '#1ded83' }}>3.</span> FastAPI отправляет задачу в Celery через Redis</div>
                  <div><span style={{ color: '#1ded83' }}>4.</span> Celery Worker получает задачу, меняет status=running</div>
                  <div><span style={{ color: '#1ded83' }}>5.</span> Worker выполняет блоки последовательно через SSH на Kali</div>
                  <div><span style={{ color: '#1ded83' }}>6.</span> Каждый блок: команда -&gt; stdout -&gt; парсинг -&gt; ExecutionLog в БД</div>
                  <div><span style={{ color: '#1ded83' }}>7.</span> Фронт поллит GET /api/v1/executions/<span style={{ color: '#c8caca' }}>{'{id}'}</span> каждые 2 сек</div>
                  <div><span style={{ color: '#1ded83' }}>8.</span> status меняется на success/failed, логи доступны сразу</div>
                </div>
              </div>
            </div>

            {/* Таблица блоков */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e8eaea' }}>
              Реализованные блоки
            </h3>
            <div style={{
              background: '#1a1d1d', border: '1px solid #2a2d2d', borderRadius: 10, overflow: 'hidden',
              marginBottom: 32,
            }}>
              {[
                { type: 'ssh_connect',   tool: 'echo / paramiko', parse: 'connected: bool', cat: 'connection', color: '#1ded83' },
                { type: 'nmap_scan',     tool: 'nmap -oX -',       parse: 'hosts[], open_ports{}', cat: 'scan', color: '#14bcff' },
                { type: 'port_check',    tool: '/dev/tcp bash',    parse: 'ports{}: OPEN|CLOSED', cat: 'scan', color: '#14bcff' },
                { type: 'ssl_check',     tool: 'openssl s_client', parse: 'expires, issues[], chain_valid', cat: 'scan', color: '#14bcff' },
                { type: 'openvas_scan',  tool: 'gvm-cli',          parse: 'task_id, raw_report', cat: 'scan', color: '#14bcff' },
                { type: 'dos_check',     tool: 'slowloris+hping3', parse: 'vectors{}: ran, output', cat: 'attack', color: '#f75049' },
                { type: 'sql_injection', tool: 'sqlmap --batch',   parse: 'vulnerable, injection_details[]', cat: 'attack', color: '#f75049' },
                { type: 'brute_check',   tool: 'hydra',            parse: 'cracked, credentials[]', cat: 'attack', color: '#f75049' },
                { type: 'lib_audit',     tool: 'npm/pip audit',    parse: 'vulnerabilities[]', cat: 'audit', color: '#ffd748' },
                { type: 'condition',     tool: 'Python eval',      parse: 'result: bool', cat: 'logic', color: '#bebfc1' },
                { type: 'report',        tool: 'JSON/MD file',     parse: 'path, format', cat: 'output', color: '#a78bfa' },
              ].map((block, i) => (
                <div key={block.type} style={{
                  display: 'grid', gridTemplateColumns: '180px 160px 1fr',
                  gap: 16, padding: '10px 20px',
                  borderBottom: i < 10 ? '1px solid #2a2d2d' : 'none',
                  background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                  alignItems: 'center',
                }}>
                  <code style={{
                    fontFamily: 'monospace', fontSize: 12, color: block.color,
                    background: block.color + '18', padding: '2px 7px', borderRadius: 4,
                    display: 'inline-block',
                  }}>
                    {block.type}
                  </code>
                  <span style={{ fontSize: 12, color: '#8a8e8e', fontFamily: 'monospace' }}>
                    {block.tool}
                  </span>
                  <span style={{ fontSize: 12, color: '#5a5e5e' }}>
                    {block.parse}
                  </span>
                </div>
              ))}
            </div>

            {/* Структура БД */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#e8eaea' }}>
              Структура БД
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {[
                {
                  table: 'zero_id_profiles',
                  fields: ['id (PK, UUID)', 'name', 'description', 'blocks (JSON)', 'is_active', 'created_at', 'updated_at'],
                },
                {
                  table: 'zero_id_executions',
                  fields: ['id (PK, UUID)', 'profile_id (FK)', 'celery_task_id', 'status (enum)', 'error_message', 'started_at', 'finished_at'],
                },
                {
                  table: 'zero_id_execution_logs',
                  fields: ['id (PK, UUID)', 'execution_id (FK)', 'block_id', 'block_type', 'command_sent', 'stdout', 'stderr', 'parsed_result (JSON)', 'status', 'timestamp'],
                },
              ].map(({ table, fields }) => (
                <div key={table} style={{
                  background: '#1a1d1d', border: '1px solid #2a2d2d', borderRadius: 10, padding: '16px',
                }}>
                  <div style={{
                    fontSize: 12, fontWeight: 700, color: '#1ded83', fontFamily: 'monospace',
                    marginBottom: 10, paddingBottom: 8, borderBottom: '1px solid #2a2d2d',
                  }}>
                    {table}
                  </div>
                  {fields.map(f => (
                    <div key={f} style={{
                      fontSize: 12, color: '#5a5e5e', fontFamily: 'monospace',
                      padding: '2px 0', lineHeight: 1.7,
                    }}>
                      {f}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Зависимости */}
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 32, color: '#e8eaea' }}>
              Установка зависимостей (быстро)
            </h3>
            <div style={{ position: 'relative' }}>
              <button onClick={() => handleCopy(
                'pip install fastapi uvicorn[standard] pydantic sqlalchemy[asyncio] asyncpg psycopg2-binary celery redis paramiko python-dotenv python-multipart',
                'pip-all'
              )} style={{
                position: 'absolute', top: 10, right: 10, zIndex: 10,
                padding: '4px 10px', borderRadius: 5, border: '1px solid #3a3e3e',
                background: '#1a1d1d', color: copied === 'pip-all' ? '#1ded83' : '#5a5e5e',
                fontSize: 11, cursor: 'pointer',
              }}>
                {copied === 'pip-all' ? 'OK' : 'Copy'}
              </button>
              <SyntaxHighlighter language="bash" style={vscDarkPlus} customStyle={{
                borderRadius: 8, padding: '16px 20px', fontSize: 13, background: '#1a1d1d',
                border: '1px solid #2a2d2d',
              }}>
                {`pip install fastapi uvicorn[standard] pydantic \\
  sqlalchemy[asyncio] asyncpg psycopg2-binary \\
  celery redis paramiko python-dotenv python-multipart`}
              </SyntaxHighlighter>
            </div>
          </div>
        )}
      </div>

      {/* Подвал */}
      <footer style={{
        borderTop: '1px solid #2a2d2d', padding: '10px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: '#1a1d1d', flexShrink: 0,
      }}>
        <span style={{ fontSize: 12, color: '#3a3e3e' }}>
          Zero.ID Backend v1.0.0 — FastAPI + Celery + PostgreSQL + Redis + Paramiko
        </span>
        <div style={{ display: 'flex', gap: '16px' }}>
          {[
            { label: '11 файлов', color: '#1ded83' },
            { label: '12 эндпоинтов', color: '#14bcff' },
            { label: '11 типов блоков', color: '#ffd748' },
          ].map(({ label, color }) => (
            <span key={label} style={{ fontSize: 12, color }}>
              {label}
            </span>
          ))}
        </div>
      </footer>
    </div>
  );
}
