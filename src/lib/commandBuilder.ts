// Построитель команд для каждого блока — итоговая команда для сервера
import type { BlockType, BlockApiCommand } from '../types/zero.types';

// Строит готовую shell-команду на основе типа блока и конфига
export function buildCommand(
  blockType: BlockType,
  nodeId: string,
  profileId: string,
  config: Record<string, unknown>
): BlockApiCommand {
  let cmd = '';

  switch (blockType) {
    case 'ssh_connect': {
      const c = config as Record<string, unknown>;
      const auth = c.authMethod === 'key'
        ? `-i "${c.privateKeyPath}" `
        : '';
      cmd = `ssh ${auth}-p ${c.port} -o ConnectTimeout=${c.timeout} ${c.username}@${c.host}`;
      break;
    }

    case 'nmap_scan': {
      const c = config as Record<string, unknown>;
      const flags = c.flags as Record<string, boolean>;
      let f = `-${c.scanType}`;
      if (flags.serviceVersion)  f += ' -sV';
      if (flags.defaultScripts)  f += ' -sC';
      if (flags.osDetection)     f += ' -O';
      if (flags.aggressiveScan)  f += ' -A';
      if (flags.verboseMode)     f += ' -v';
      if (flags.noHostDiscovery) f += ' -Pn';
      if (flags.fastMode)        f += ' -F';
      if (flags.allPorts)        f += ' -p-';
      else if (c.ports)          f += ` -p ${c.ports}`;
      f += ` -T${c.timing}`;
      // Формат вывода
      const outFmt = {
        normal:   '-oN',
        xml:      '-oX',
        grepable: '-oG',
        all:      '-oA',
      }[c.outputFormat as string] ?? '-oN';
      if (c.outputFile) f += ` ${outFmt} ${c.outputFile}`;
      if (c.extraArgs)  f += ` ${c.extraArgs}`;
      cmd = `nmap ${f} ${c.target}`;
      break;
    }

    case 'openvas_scan': {
      const c = config as Record<string, unknown>;
      cmd = `gvm-cli --gmp-username "${c.username}" --gmp-password "${c.password}" ` +
            `socket --xml "<create_task><name>ZeroID Scan</name>` +
            `<config id=\\"${c.scanConfigId}\\"/><target id=\\"${c.targetHost}\\"/></create_task>"`;
      break;
    }

    case 'sql_injection': {
      const c = config as Record<string, unknown>;
      let f = `--url "${c.url}" --method ${c.method}`;
      if (c.data)     f += ` --data "${c.data}"`;
      if (c.cookies)  f += ` --cookie "${c.cookies}"`;
      f += ` --level ${c.level} --risk ${c.risk}`;
      if (c.dbms)     f += ` --dbms ${c.dbms}`;
      f += ` --technique=${c.technique}`;
      if (c.dumpAll)  f += ' --dump-all';
      if (c.tablesOnly) f += ' --tables';
      if (c.extraArgs)  f += ` ${c.extraArgs}`;
      f += ' --batch';
      cmd = `sqlmap ${f}`;
      break;
    }

    case 'dos_check': {
      const c = config as Record<string, unknown>;
      const checks: string[] = [];
      if (c.checkSynFlood)  checks.push('--syn-flood');
      if (c.checkUdpFlood)  checks.push('--udp-flood');
      if (c.checkHttpFlood) checks.push('--http-flood');
      if (c.checkSlowloris) checks.push('--slowloris');
      cmd = `zeroids-dos --target ${c.target} --port ${c.port} --proto ${c.protocol} ` +
            `--threads ${c.threads} --duration ${c.duration} --rps ${c.requestsPerSecond} ` +
            checks.join(' ');
      break;
    }

    case 'lib_audit': {
      const c = config as Record<string, unknown>;
      const cmds: Record<string, string> = {
        npm:      'npm audit',
        pip:      'pip-audit',
        gem:      'bundler-audit check --update',
        composer: 'composer audit',
        cargo:    'cargo audit',
        maven:    'mvn dependency-check:check',
        gradle:   './gradlew dependencyCheckAnalyze',
      };
      const base = cmds[c.packageManager as string] ?? 'npm audit';
      const extras: string[] = [];
      if (c.packageManager === 'npm') {
        if (c.checkOutdated) extras.push('&& npm outdated');
        if (c.autoFix)       extras.push('&& npm audit fix');
      }
      cmd = `cd "${c.path}" && ${base} ${extras.join(' ')}`;
      break;
    }

    case 'ssl_check': {
      const c = config as Record<string, unknown>;
      const opts: string[] = [];
      if ((c.protocols as Record<string, boolean>)?.sslv2) opts.push('--ssl2');
      if ((c.protocols as Record<string, boolean>)?.sslv3) opts.push('--ssl3');
      opts.push(`--connect ${c.host}:${c.port}`);
      if (c.checkExpiry)    opts.push(`--days ${c.expiryWarningDays}`);
      if (c.checkProtocols) opts.push('--protocols');
      if (c.checkCiphers)   opts.push('--ciphers');
      cmd = `testssl.sh ${opts.join(' ')}`;
      break;
    }

    case 'port_check': {
      const c = config as Record<string, unknown>;
      const proto = c.protocol === 'udp' ? '-sU' : (c.protocol === 'both' ? '-sS -sU' : '-sT');
      cmd = `nmap ${proto} -p ${c.ports} --open ${c.checkBanner ? '-sV' : ''} ` +
            `--host-timeout ${c.timeout}s ${c.target}`;
      break;
    }

    case 'brute_check': {
      const c = config as Record<string, unknown>;
      cmd = `hydra -l ${c.username} -P "${c.wordlistPath}" ` +
            `-s ${c.port} -t 4 -W ${Math.round((c.delay as number) / 1000)} ` +
            `${c.target} ${c.service}`;
      if (c.stopOnSuccess) cmd += ' -f';
      break;
    }

    case 'condition': {
      const c = config as Record<string, unknown>;
      cmd = `# Условие: если [${c.field}] ${c.operator} "${c.value}" ` +
            `=> "${c.trueLabel}" иначе "${c.falseLabel}"`;
      break;
    }

    case 'report': {
      const c = config as Record<string, unknown>;
      cmd = `zeroids-report --title "${c.title}" --format ${c.format} ` +
            `--output "${c.outputPath}" ` +
            `${c.includeLogs ? '--include-logs' : ''} ` +
            `${c.includeSummary ? '--summary' : ''} ` +
            `--severity ${c.severity}` +
            (c.sendEmail ? ` --email "${c.emailTo}"` : '');
      break;
    }

    default:
      cmd = `# Неизвестный тип блока: ${blockType}`;
  }

  return { blockType, nodeId, profileId, config, builtCommand: cmd.trim() };
}
