// Определения всех блоков: палитра, дефолтные конфиги
import type { BlockDefinition, BlockType } from '../types/zero.types';

export const BLOCK_DEFINITIONS: BlockDefinition[] = [
  // --- Подключение ---
  {
    type: 'ssh_connect',
    label: 'SSH Подключение',
    description: 'Устанавливает SSH-соединение с целевым сервером',
    category: 'connection',
    defaultConfig: {
      host: '',
      port: 22,
      username: 'root',
      authMethod: 'password',
      password: '',
      privateKeyPath: '',
      timeout: 30,
    },
  },

  // --- Сканирование ---
  {
    type: 'nmap_scan',
    label: 'Nmap Сканирование',
    description: 'Сетевое сканирование с полным набором флагов nmap',
    category: 'scan',
    defaultConfig: {
      target: '',
      scanType: 'sS',
      flags: {
        serviceVersion: true,
        defaultScripts: false,
        osDetection: false,
        aggressiveScan: false,
        verboseMode: false,
        noHostDiscovery: false,
        fastMode: false,
        allPorts: false,
      },
      ports: '1-1000',
      timing: 3,
      outputFormat: 'normal',
      outputFile: 'nmap_result.txt',
      extraArgs: '',
    },
  },
  {
    type: 'openvas_scan',
    label: 'OpenVAS Сканирование',
    description: 'Глубокий анализ уязвимостей через OpenVAS / GVM',
    category: 'scan',
    defaultConfig: {
      host: '',
      port: 9390,
      username: 'admin',
      password: '',
      scanConfigId: 'daba56c8-73ec-11df-a475-002264764cea',
      targetHost: '',
      portList: 'All IANA assigned TCP',
      maxHosts: 1,
      maxChecks: 10,
      reportFormat: 'pdf',
    },
  },
  {
    type: 'port_check',
    label: 'Проверка портов',
    description: 'Быстрая проверка открытых портов и баннеров',
    category: 'scan',
    defaultConfig: {
      target: '',
      ports: '22,80,443,3306,5432,6379,8080',
      protocol: 'tcp',
      timeout: 5,
      checkBanner: true,
      checkFirewall: false,
    },
  },
  {
    type: 'ssl_check',
    label: 'SSL/TLS Проверка',
    description: 'Анализ сертификатов, протоколов и шифров',
    category: 'scan',
    defaultConfig: {
      host: '',
      port: 443,
      checkExpiry: true,
      checkChain: true,
      checkProtocols: true,
      checkCiphers: true,
      checkHsts: true,
      expiryWarningDays: 30,
      protocols: {
        sslv2: false,
        sslv3: false,
        tls10: false,
        tls11: false,
        tls12: true,
        tls13: true,
      },
    },
  },

  // --- Симуляция атак ---
  {
    type: 'sql_injection',
    label: 'SQL Инъекции',
    description: 'Тестирование на SQL инъекции (sqlmap-совместимо)',
    category: 'attack_sim',
    defaultConfig: {
      url: '',
      method: 'GET',
      data: '',
      cookies: '',
      level: 1,
      risk: 1,
      dbms: '',
      technique: 'BEUSTQ',
      dumpAll: false,
      tablesOnly: false,
      extraArgs: '',
    },
  },
  {
    type: 'dos_check',
    label: 'DoS/DDoS Проверка',
    description: 'Тест устойчивости к отказу в обслуживании',
    category: 'attack_sim',
    defaultConfig: {
      target: '',
      port: 80,
      protocol: 'http',
      threads: 10,
      duration: 30,
      requestsPerSecond: 100,
      checkSynFlood: true,
      checkUdpFlood: false,
      checkHttpFlood: true,
      checkSlowloris: true,
    },
  },
  {
    type: 'brute_check',
    label: 'Brute Force Проверка',
    description: 'Тест устойчивости к перебору паролей',
    category: 'attack_sim',
    defaultConfig: {
      target: '',
      port: 22,
      service: 'ssh',
      username: 'root',
      wordlistPath: '/usr/share/wordlists/rockyou.txt',
      maxAttempts: 100,
      delay: 500,
      stopOnSuccess: true,
    },
  },

  // --- Аудит ---
  {
    type: 'lib_audit',
    label: 'Аудит библиотек',
    description: 'Поиск устаревших и уязвимых зависимостей',
    category: 'audit',
    defaultConfig: {
      path: '/var/www/app',
      packageManager: 'npm',
      checkOutdated: true,
      checkVulnerable: true,
      severityThreshold: 'moderate',
      autoFix: false,
      ignoreDevDeps: true,
    },
  },

  // --- Логика ---
  {
    type: 'condition',
    label: 'Условие',
    description: 'Ветвление выполнения по результату предыдущего блока',
    category: 'logic',
    defaultConfig: {
      field: 'status',
      operator: 'eq',
      value: 'vulnerable',
      trueLabel: 'Уязвимость найдена',
      falseLabel: 'Чисто',
    },
  },

  // --- Вывод ---
  {
    type: 'report',
    label: 'Отчёт',
    description: 'Формирование итогового отчёта по всем блокам',
    category: 'output',
    defaultConfig: {
      title: 'Zero.ID Security Report',
      format: 'html',
      outputPath: './reports/',
      includeLogs: true,
      includeSummary: true,
      sendEmail: false,
      emailTo: '',
      severity: 'all',
    },
  },
];

// Цвета категорий блоков
export const CATEGORY_COLORS: Record<string, string> = {
  connection:  '#1ded83',
  scan:        '#14bcff',
  attack_sim:  '#f75049',
  audit:       '#ffd748',
  logic:       '#bebfc1',
  output:      '#a78bfa',
};

// Лейблы категорий на русском
export const CATEGORY_LABELS: Record<string, string> = {
  connection:  'Подключение',
  scan:        'Сканирование',
  attack_sim:  'Симуляция атак',
  audit:       'Аудит',
  logic:       'Логика',
  output:      'Вывод',
};

// Получить определение блока по типу
export function getBlockDef(type: BlockType): BlockDefinition | undefined {
  return BLOCK_DEFINITIONS.find((b) => b.type === type);
}
