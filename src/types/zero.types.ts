// Типы всего приложения Zero.ID
import type { Node, Edge } from 'reactflow';

// Возможные экраны приложения
export type AppView = 'profiles' | 'editor' | 'logs' | 'docs';

// Типы блоков, доступных в редакторе
export type BlockType =
  | 'ssh_connect'
  | 'nmap_scan'
  | 'openvas_scan'
  | 'sql_injection'
  | 'dos_check'
  | 'lib_audit'
  | 'ssl_check'
  | 'port_check'
  | 'brute_check'
  | 'report'
  | 'condition';

// Статус выполнения блока
export type BlockStatus = 'idle' | 'running' | 'success' | 'error' | 'warning';

// Конфигурация SSH подключения
export interface SshConnectConfig {
  host: string;
  port: number;
  username: string;
  authMethod: 'password' | 'key';
  password?: string;
  privateKeyPath?: string;
  timeout: number;
}

// Конфигурация Nmap сканирования
export interface NmapConfig {
  target: string;
  // Типы сканирования
  scanType: 'sS' | 'sT' | 'sU' | 'sV' | 'sC' | 'sA' | 'sW' | 'sM';
  // Дополнительные флаги
  flags: {
    serviceVersion: boolean;    // -sV
    defaultScripts:  boolean;   // -sC
    osDetection:     boolean;   // -O
    aggressiveScan:  boolean;   // -A
    verboseMode:     boolean;   // -v
    noHostDiscovery: boolean;   // -Pn
    fastMode:        boolean;   // -F
    allPorts:        boolean;   // -p-
  };
  ports: string;               // напр. "80,443,22" или "1-1000"
  timing: 0 | 1 | 2 | 3 | 4 | 5; // -T0 ... -T5
  outputFormat: 'normal' | 'xml' | 'grepable' | 'all';
  outputFile: string;
  extraArgs: string;           // произвольные доп. аргументы
}

// Конфигурация OpenVAS
export interface OpenVasConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  scanConfigId: string;        // ID конфигурации сканирования GVM
  targetHost: string;
  portList: string;
  maxHosts: number;
  maxChecks: number;
  reportFormat: 'pdf' | 'xml' | 'html' | 'csv';
}

// Конфигурация SQL инъекций (sqlmap)
export interface SqlInjectionConfig {
  url: string;
  method: 'GET' | 'POST';
  data: string;                // POST данные
  cookies: string;
  level: 1 | 2 | 3 | 4 | 5;  // уровень тестирования
  risk: 1 | 2 | 3;
  dbms: string;                // mysql, postgresql, mssql...
  technique: string;           // BEUSTQ
  dumpAll: boolean;
  tablesOnly: boolean;
  extraArgs: string;
}

// Конфигурация DoS/DDoS проверки
export interface DosCheckConfig {
  target: string;
  port: number;
  protocol: 'tcp' | 'udp' | 'http' | 'https';
  threads: number;
  duration: number;            // секунды
  requestsPerSecond: number;
  checkSynFlood: boolean;
  checkUdpFlood: boolean;
  checkHttpFlood: boolean;
  checkSlowloris: boolean;
}

// Конфигурация аудита библиотек
export interface LibAuditConfig {
  path: string;                // путь к проекту на сервере
  packageManager: 'npm' | 'pip' | 'gem' | 'composer' | 'cargo' | 'maven' | 'gradle';
  checkOutdated: boolean;
  checkVulnerable: boolean;
  severityThreshold: 'low' | 'moderate' | 'high' | 'critical';
  autoFix: boolean;
  ignoreDevDeps: boolean;
}

// Конфигурация SSL проверки
export interface SslCheckConfig {
  host: string;
  port: number;
  checkExpiry: boolean;
  checkChain: boolean;
  checkProtocols: boolean;     // TLS версии
  checkCiphers: boolean;
  checkHsts: boolean;
  expiryWarningDays: number;
  protocols: {
    sslv2: boolean;
    sslv3: boolean;
    tls10: boolean;
    tls11: boolean;
    tls12: boolean;
    tls13: boolean;
  };
}

// Конфигурация проверки портов
export interface PortCheckConfig {
  target: string;
  ports: string;               // диапазон или список
  protocol: 'tcp' | 'udp' | 'both';
  timeout: number;
  checkBanner: boolean;        // получить баннер сервиса
  checkFirewall: boolean;
}

// Конфигурация brute force проверки
export interface BruteCheckConfig {
  target: string;
  port: number;
  service: 'ssh' | 'ftp' | 'http' | 'https' | 'smb' | 'rdp' | 'telnet';
  username: string;
  wordlistPath: string;
  maxAttempts: number;
  delay: number;               // миллисекунды между попытками
  stopOnSuccess: boolean;
}

// Конфигурация условного блока (ветвление)
export interface ConditionConfig {
  field: string;               // поле из предыдущего результата
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains' | 'regex';
  value: string;
  trueLabel: string;
  falseLabel: string;
}

// Конфигурация отчёта
export interface ReportConfig {
  title: string;
  format: 'json' | 'html' | 'pdf' | 'markdown';
  outputPath: string;
  includeLogs: boolean;
  includeSummary: boolean;
  sendEmail: boolean;
  emailTo: string;
  severity: 'all' | 'high' | 'critical';
}

// Объединённый тип конфигурации блока
export type BlockConfig =
  | SshConnectConfig
  | NmapConfig
  | OpenVasConfig
  | SqlInjectionConfig
  | DosCheckConfig
  | LibAuditConfig
  | SslCheckConfig
  | PortCheckConfig
  | BruteCheckConfig
  | ConditionConfig
  | ReportConfig;

// Данные узла React Flow
export interface ZeroNodeData {
  blockType: BlockType;
  label: string;
  status: BlockStatus;
  config: Record<string, unknown>;
  lastResult?: string;
}

// Профиль пользователя
export interface ZeroProfile {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  nodes: Node<ZeroNodeData>[];
  edges: Edge[];
}

// Запись лога
export type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: unknown;
}

// Toast уведомление
export interface ToastMessage {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

// Определение блока для палитры (sidebar)
export interface BlockDefinition {
  type: BlockType;
  label: string;
  description: string;
  category: 'connection' | 'scan' | 'attack_sim' | 'audit' | 'logic' | 'output';
  defaultConfig: Record<string, unknown>;
}

// API-команда, отправляемая на бэкенд
export interface BlockApiCommand {
  blockType: BlockType;
  nodeId: string;
  profileId: string;
  config: Record<string, unknown>;
  builtCommand: string;
}
