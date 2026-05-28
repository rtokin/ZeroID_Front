"""
Zero.ID — исполнители блоков.
Каждый блок — независимая функция: принимает params + context + ssh_client,
возвращает dict с полями: stdout, stderr, parsed_result, status.
"""

import os
import logging
import re
from typing import Any
from ssh_client import ZeroIdSSHClient, zero_id_safe_arg
import parsers

logger = logging.getLogger("zero_id.executors")

# Таймаут SSH-команд из окружения (в секундах), по умолчанию 600
ZERO_ID_CMD_TIMEOUT = int(os.getenv("ZERO_ID_CMD_TIMEOUT", "600"))


def _run(ssh: ZeroIdSSHClient, cmd: str) -> tuple[str, str, int]:
    """Единая точка запуска команды через SSH с единым таймаутом."""
    return ssh.execute(cmd, timeout=ZERO_ID_CMD_TIMEOUT)


# ------------------------------------------------------------------ #
#  SSH Подключение
# ------------------------------------------------------------------ #

def execute_ssh_connect(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'ssh_connect' — устанавливает соединение с целевым хостом.
    Подключение уже должно быть создано в tasks.py до вызова этой функции.
    Здесь мы просто проверяем, что соединение живо.
    """
    try:
        out, err, code = _run(ssh, "echo zero_id_ok")
        alive = "zero_id_ok" in out
        return {
            "stdout": out,
            "stderr": err,
            "parsed_result": {"connected": alive, "host": ssh.host, "port": ssh.port},
            "status": "success" if alive else "failed",
        }
    except Exception as e:
        return {
            "stdout": "", "stderr": str(e),
            "parsed_result": {"connected": False, "error": str(e)},
            "status": "failed",
        }


# ------------------------------------------------------------------ #
#  Nmap сканирование
# ------------------------------------------------------------------ #

def execute_nmap_scan(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'nmap_scan'.
    Формируем команду nmap из параметров фронта, запускаем через SSH,
    парсим XML-вывод в структурированный список портов.
    """
    target = zero_id_safe_arg(params.get("target", ""))
    scan_type = params.get("scanType", "sS")
    ports = params.get("ports", "1-1000")
    timing = params.get("timing", 3)
    flags: dict = params.get("flags", {})
    extra_args = params.get("extraArgs", "")

    if not target:
        return {"stdout": "", "stderr": "target is required", "parsed_result": None, "status": "failed"}

    # Строим флаги
    flag_str = f"-{scan_type}"
    if flags.get("serviceVersion"):  flag_str += " -sV"
    if flags.get("defaultScripts"):  flag_str += " -sC"
    if flags.get("osDetection"):     flag_str += " -O"
    if flags.get("aggressiveScan"):  flag_str += " -A"
    if flags.get("noHostDiscovery"): flag_str += " -Pn"
    if flags.get("fastMode"):        flag_str += " -F"
    if flags.get("allPorts"):
        port_arg = "-p-"
    else:
        port_arg = f"-p {zero_id_safe_arg(ports)}"

    # XML-вывод в stdout (удобно для парсинга)
    cmd = f"nmap {flag_str} {port_arg} -T{timing} -oX - {target}"
    if extra_args:
        cmd += f" {extra_args}"

    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_nmap(out, use_xml=True)

    # Сохраняем результат в контекст для следующих блоков
    context["nmap_result"] = parsed

    return {
        "stdout": out,
        "stderr": err,
        "parsed_result": parsed,
        "status": "success" if code == 0 else "failed",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  Проверка портов (nc/bash)
# ------------------------------------------------------------------ #

def execute_port_check(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'port_check'.
    Проверяем каждый порт через /dev/tcp или nc — быстро, без nmap.
    """
    target = zero_id_safe_arg(params.get("target", ""))
    ports_str = params.get("ports", "22,80,443")
    timeout_s = int(params.get("timeout", 5))

    if not target:
        return {"stdout": "", "stderr": "target is required", "parsed_result": None, "status": "failed"}

    port_list = [p.strip() for p in ports_str.split(",")]

    # Bash-скрипт для проверки каждого порта через /dev/tcp
    check_lines = []
    for p in port_list:
        check_lines.append(
            f"(timeout {timeout_s} bash -c 'echo >/dev/tcp/{target}/{p}' 2>/dev/null "
            f"&& echo \"PORT {p}: OPEN\" || echo \"PORT {p}: CLOSED\")"
        )
    cmd = "; ".join(check_lines)

    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_port_check(out)
    context["port_check_result"] = parsed

    return {
        "stdout": out, "stderr": err,
        "parsed_result": parsed,
        "status": "success",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  SSL/TLS проверка
# ------------------------------------------------------------------ #

def execute_ssl_check(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'ssl_check'.
    Используем openssl s_client для проверки сертификата.
    """
    host = zero_id_safe_arg(params.get("host", ""))
    port = int(params.get("port", 443))

    if not host:
        return {"stdout": "", "stderr": "host is required", "parsed_result": None, "status": "failed"}

    cmd = f"echo | openssl s_client -connect {host}:{port} -servername {host} 2>&1"
    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_openssl(out)
    context["ssl_result"] = parsed

    return {
        "stdout": out, "stderr": err,
        "parsed_result": parsed,
        "status": "success" if not parsed.get("issues") else "warning",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  DoS/DDoS проверка (Slowloris)
# ------------------------------------------------------------------ #

def execute_dos_check(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'dos_check'.
    Запускаем slowloris (при флаге checkSlowloris).
    Остальные векторы — hping3 (SYN flood) и hey/wrk (HTTP flood).
    """
    target = zero_id_safe_arg(params.get("target", ""))
    port = int(params.get("port", 80))
    duration = int(params.get("duration", 30))
    threads = int(params.get("threads", 10))
    results = {}

    if not target:
        return {"stdout": "", "stderr": "target is required", "parsed_result": None, "status": "failed"}

    combined_out = ""
    combined_err = ""

    # Slowloris
    if params.get("checkSlowloris"):
        cmd = f"timeout {duration} slowloris {target} -p {port} -s {threads} 2>&1 || true"
        out, err, code = _run(ssh, cmd)
        combined_out += f"[slowloris]\n{out}\n"
        combined_err += err
        results["slowloris"] = {"ran": True, "output": out[:500]}

    # SYN Flood через hping3 (требует root)
    if params.get("checkSynFlood"):
        cmd = (
            f"timeout {duration} hping3 -S --flood -p {port} {target} 2>&1 || true"
        )
        out, err, code = _run(ssh, cmd)
        combined_out += f"[hping3 SYN]\n{out}\n"
        combined_err += err
        results["syn_flood"] = {"ran": True, "output": out[:500]}

    # HTTP Flood через hey (Go-утилита, быстрее ab)
    if params.get("checkHttpFlood"):
        rps = int(params.get("requestsPerSecond", 100))
        cmd = (
            f"hey -z {duration}s -q {rps} -c {threads} "
            f"http://{target}:{port}/ 2>&1 || true"
        )
        out, err, code = _run(ssh, cmd)
        combined_out += f"[http flood]\n{out}\n"
        results["http_flood"] = {"ran": True, "output": out[:500]}

    context["dos_result"] = results

    return {
        "stdout": combined_out,
        "stderr": combined_err,
        "parsed_result": {"tool": "dos_check", "vectors": results},
        "status": "success",
    }


# ------------------------------------------------------------------ #
#  SQL-инъекции (sqlmap)
# ------------------------------------------------------------------ #

def execute_sql_injection(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'sql_injection'.
    Запускаем sqlmap в batch-режиме (без интерактивных вопросов).
    """
    url = zero_id_safe_arg(params.get("url", ""))
    method = params.get("method", "GET")
    level = int(params.get("level", 1))
    risk = int(params.get("risk", 1))
    technique = params.get("technique", "BEUSTQ")
    data = params.get("data", "")
    cookies = params.get("cookies", "")
    extra = params.get("extraArgs", "")

    if not url:
        return {"stdout": "", "stderr": "url is required", "parsed_result": None, "status": "failed"}

    cmd = (
        f"sqlmap -u {url} --method {method} "
        f"--level {level} --risk {risk} --technique {zero_id_safe_arg(technique)} "
        f"--batch --output-dir /tmp/zero_id_sqlmap"
    )
    if data:
        cmd += f" --data {zero_id_safe_arg(data)}"
    if cookies:
        cmd += f" --cookie {zero_id_safe_arg(cookies)}"
    if extra:
        cmd += f" {extra}"

    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_sqlmap(out)
    context["sql_injection_result"] = parsed

    return {
        "stdout": out, "stderr": err,
        "parsed_result": parsed,
        "status": "success",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  Brute Force (Hydra)
# ------------------------------------------------------------------ #

def execute_brute_check(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'brute_check'.
    Запускаем Hydra для брутфорса указанного сервиса.
    """
    target = zero_id_safe_arg(params.get("target", ""))
    port = int(params.get("port", 22))
    service = params.get("service", "ssh")
    username = zero_id_safe_arg(params.get("username", "root"))
    wordlist = zero_id_safe_arg(params.get("wordlistPath", "/usr/share/wordlists/rockyou.txt"))
    stop_on_success = "-f" if params.get("stopOnSuccess", True) else ""
    delay_ms = int(params.get("delay", 500))

    if not target:
        return {"stdout": "", "stderr": "target is required", "parsed_result": None, "status": "failed"}

    # -W — задержка между попытками в секундах (округляем из мс)
    delay_s = max(1, delay_ms // 1000)
    cmd = (
        f"hydra -l {username} -P {wordlist} "
        f"-s {port} {stop_on_success} -W {delay_s} "
        f"{target} {service} 2>&1"
    )

    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_hydra(out)
    context["brute_result"] = parsed

    return {
        "stdout": out, "stderr": err,
        "parsed_result": parsed,
        "status": "success" if parsed["cracked"] else "warning",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  Аудит библиотек
# ------------------------------------------------------------------ #

def execute_lib_audit(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'lib_audit'.
    Запускаем аудит зависимостей в указанной директории на удалённом сервере.
    """
    path = zero_id_safe_arg(params.get("path", "/var/www/app"))
    pm = params.get("packageManager", "npm")
    auto_fix = params.get("autoFix", False)

    pm_commands = {
        "npm":      f"cd {path} && npm audit --json",
        "pip":      f"cd {path} && pip-audit --format=columns",
        "gem":      f"cd {path} && bundle-audit check --update",
        "composer": f"cd {path} && composer audit",
        "cargo":    f"cd {path} && cargo audit",
        "maven":    f"cd {path} && mvn -q dependency-check:check",
        "gradle":   f"cd {path} && ./gradlew dependencyCheckAnalyze -q",
    }

    cmd = pm_commands.get(pm, f"echo Unsupported package manager: {pm}")
    if auto_fix and pm == "npm":
        cmd += " && npm audit fix"

    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_lib_audit(out, pm)
    context["lib_audit_result"] = parsed

    return {
        "stdout": out, "stderr": err,
        "parsed_result": parsed,
        "status": "success",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  OpenVAS (через gvm-cli)
# ------------------------------------------------------------------ #

def execute_openvas_scan(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'openvas_scan'.
    Запускаем сканирование через gvm-cli (GVM XML API).
    Алгоритм: create_target -> create_task -> start_task -> poll status -> get_report.
    """
    gvm_host = zero_id_safe_arg(params.get("host", "localhost"))
    gvm_port = int(params.get("port", 9390))
    gvm_user = zero_id_safe_arg(params.get("username", "admin"))
    gvm_pass = zero_id_safe_arg(params.get("password", ""))
    target_host = zero_id_safe_arg(params.get("targetHost", ""))
    scan_config = zero_id_safe_arg(params.get("scanConfigId", "daba56c8-73ec-11df-a475-002264764cea"))

    if not target_host:
        return {"stdout": "", "stderr": "targetHost is required", "parsed_result": None, "status": "failed"}

    # Создаём target в OpenVAS
    create_target_cmd = (
        f"gvm-cli --hostname {gvm_host} --port {gvm_port} "
        f"--username {gvm_user} --password {gvm_pass} "
        f"tls --xml \"<create_target><name>zero_id_{target_host}</name>"
        f"<hosts>{target_host}</hosts></create_target>\""
    )
    out_t, err_t, _ = _run(ssh, create_target_cmd)

    # Парсим target_id из XML-ответа
    m = re.search(r'id="([0-9a-f-]+)"', out_t)
    if not m:
        return {
            "stdout": out_t, "stderr": err_t,
            "parsed_result": {"error": "Failed to create OpenVAS target"},
            "status": "failed",
        }
    target_id = m.group(1)

    # Создаём задачу сканирования
    create_task_cmd = (
        f"gvm-cli --hostname {gvm_host} --port {gvm_port} "
        f"--username {gvm_user} --password {gvm_pass} "
        f"tls --xml \"<create_task><name>zero_id_task</name>"
        f"<config id={scan_config}/><target id='{target_id}'/></create_task>\""
    )
    out_task, err_task, _ = _run(ssh, create_task_cmd)
    m2 = re.search(r'id="([0-9a-f-]+)"', out_task)
    if not m2:
        return {
            "stdout": out_task, "stderr": err_task,
            "parsed_result": {"error": "Failed to create OpenVAS task"},
            "status": "failed",
        }
    task_id = m2.group(1)

    # Запускаем задачу
    start_cmd = (
        f"gvm-cli --hostname {gvm_host} --port {gvm_port} "
        f"--username {gvm_user} --password {gvm_pass} "
        f"tls --xml \"<start_task task_id='{task_id}'/>\""
    )
    _run(ssh, start_cmd)

    # Ждём завершения — поллим статус каждые 30 секунд (максимум 20 итераций)
    import time
    for _ in range(20):
        time.sleep(30)
        status_cmd = (
            f"gvm-cli --hostname {gvm_host} --port {gvm_port} "
            f"--username {gvm_user} --password {gvm_pass} "
            f"tls --xml \"<get_tasks task_id='{task_id}'/>\""
        )
        status_out, _, _ = _run(ssh, status_cmd)
        if "<status>Done</status>" in status_out:
            break

    # Получаем отчёт
    report_cmd = (
        f"gvm-cli --hostname {gvm_host} --port {gvm_port} "
        f"--username {gvm_user} --password {gvm_pass} "
        f"tls --xml \"<get_reports filter='task_id={task_id}'/>\""
    )
    report_out, report_err, _ = _run(ssh, report_cmd)
    context["openvas_result"] = {"raw": report_out[:2000]}

    return {
        "stdout": report_out, "stderr": report_err,
        "parsed_result": {"tool": "openvas", "task_id": task_id, "raw_report": report_out[:2000]},
        "status": "success",
    }


# ------------------------------------------------------------------ #
#  Условный блок (if/else)
# ------------------------------------------------------------------ #

def execute_condition(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'condition'.
    Читает поле из контекста, применяет оператор, возвращает true/false.
    Поле задаётся как dot-path: 'nmap_result.open_ports.80'.
    """
    field = params.get("field", "")
    operator = params.get("operator", "eq")
    expected = params.get("value", "")

    # Достаём значение из контекста по точечному пути
    actual = _get_context_value(context, field)

    result = _apply_operator(actual, operator, expected)

    return {
        "stdout": f"Condition: {field} {operator} {expected} -> {result}",
        "stderr": "",
        "parsed_result": {
            "field": field,
            "actual_value": str(actual),
            "operator": operator,
            "expected": expected,
            "result": result,
        },
        "status": "success",
        "condition_result": result,  # используется в tasks.py для ветвления
    }


def _get_context_value(context: dict, path: str) -> Any:
    """Достаём значение из вложенного dict по dot-path (напр. 'nmap_result.open_ports.80')."""
    parts = path.replace("{{", "").replace("}}", "").split(".")
    current = context
    for p in parts:
        if isinstance(current, dict):
            # Пробуем строковый ключ и числовой
            current = current.get(p) or current.get(int(p) if p.isdigit() else p)
        else:
            return None
    return current


def _apply_operator(actual: Any, operator: str, expected: str) -> bool:
    """Применить один из операторов сравнения."""
    if actual is None:
        return False
    if operator == "eq":
        return str(actual) == expected
    if operator == "ne":
        return str(actual) != expected
    if operator == "gt":
        return float(actual) > float(expected)
    if operator == "lt":
        return float(actual) < float(expected)
    if operator == "contains":
        return expected in str(actual)
    if operator == "regex":
        return bool(re.search(expected, str(actual)))
    return False


# ------------------------------------------------------------------ #
#  Отчёт
# ------------------------------------------------------------------ #

def execute_report(params: dict, context: dict, ssh: ZeroIdSSHClient) -> dict:
    """
    Блок 'report'.
    Собираем итоговый отчёт из контекста выполнения.
    Сохраняем файл на удалённом сервере в указанной директории.
    """
    import json as _json
    title = params.get("title", "Zero.ID Security Report")
    fmt = params.get("format", "json")
    output_path = params.get("outputPath", "/tmp/zero_id_reports/")
    include_logs = params.get("includeLogs", True)

    report_data = {
        "title": title,
        "generated_by": "Zero.ID Backend",
        "context": context if include_logs else {},
    }

    if fmt == "json":
        content = _json.dumps(report_data, indent=2, default=str)
        filename = "report.json"
    else:
        # Простой markdown
        lines = [f"# {title}", "", "## Results", ""]
        for key, val in context.items():
            lines.append(f"### {key}")
            lines.append(f"```\n{_json.dumps(val, indent=2, default=str)}\n```")
            lines.append("")
        content = "\n".join(lines)
        filename = "report.md"

    # Сохраняем файл на Kali через SSH
    escaped = content.replace("'", "'\\''")
    cmd = f"mkdir -p {zero_id_safe_arg(output_path)} && printf '%s' '{escaped}' > {zero_id_safe_arg(output_path)}/{filename}"
    out, err, code = _run(ssh, cmd)

    return {
        "stdout": f"Report saved to {output_path}/{filename}",
        "stderr": err,
        "parsed_result": {"tool": "report", "path": f"{output_path}/{filename}", "format": fmt},
        "status": "success" if code == 0 else "failed",
        "command": cmd,
    }


# ------------------------------------------------------------------ #
#  Диспетчер — выбираем нужный исполнитель по типу блока
# ------------------------------------------------------------------ #

ZERO_ID_BLOCK_EXECUTORS: dict[str, Any] = {
    "ssh_connect":   execute_ssh_connect,
    "nmap_scan":     execute_nmap_scan,
    "openvas_scan":  execute_openvas_scan,
    "port_check":    execute_port_check,
    "ssl_check":     execute_ssl_check,
    "dos_check":     execute_dos_check,
    "sql_injection":  execute_sql_injection,
    "brute_check":   execute_brute_check,
    "lib_audit":     execute_lib_audit,
    "condition":     execute_condition,
    "report":        execute_report,
}


def zero_id_dispatch_block(
    block_type: str,
    params: dict,
    context: dict,
    ssh: ZeroIdSSHClient,
) -> dict:
    """
    Найти и запустить нужный исполнитель.
    Если тип неизвестен — возвращаем ошибку.
    """
    executor = ZERO_ID_BLOCK_EXECUTORS.get(block_type)
    if not executor:
        return {
            "stdout": "",
            "stderr": f"Unknown block type: {block_type}",
            "parsed_result": None,
            "status": "failed",
        }
    return executor(params, context, ssh)
