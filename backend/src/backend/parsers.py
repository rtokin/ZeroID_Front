"""
Zero.ID — парсеры вывода инструментов в структурированный Python-объект.
Каждый парсер принимает raw stdout и возвращает dict для поля parsed_result.
"""

import re
import xml.etree.ElementTree as ET
import logging

logger = logging.getLogger("zero_id.parsers")


def zero_id_parse_nmap(stdout: str, use_xml: bool = True) -> dict:
    """
    Парсинг XML-вывода nmap (-oX -).
    Возвращает список хостов с открытыми портами и версиями сервисов.
    Если XML сломан — пробуем простой grep по тексту.
    """
    if use_xml:
        try:
            root = ET.fromstring(stdout)
        except ET.ParseError as e:
            logger.warning("nmap XML parse error: %s, falling back to text parser", e)
            return zero_id_parse_nmap_text(stdout)

        hosts = []
        for host_elem in root.findall("host"):
            # Статус хоста
            status_elem = host_elem.find("status")
            if status_elem is not None and status_elem.get("state") != "up":
                continue

            # IP-адрес хоста
            addr_elem = host_elem.find("address[@addrtype='ipv4']")
            ip = addr_elem.get("addr", "unknown") if addr_elem is not None else "unknown"

            # Открытые порты
            ports = []
            ports_elem = host_elem.find("ports")
            if ports_elem is not None:
                for port_elem in ports_elem.findall("port"):
                    state_elem = port_elem.find("state")
                    if state_elem is None or state_elem.get("state") != "open":
                        continue

                    service_elem = port_elem.find("service")
                    port_info = {
                        "port":     int(port_elem.get("portid", 0)),
                        "protocol": port_elem.get("protocol", "tcp"),
                        "state":    "open",
                        "service":  service_elem.get("name", "") if service_elem is not None else "",
                        "product":  service_elem.get("product", "") if service_elem is not None else "",
                        "version":  service_elem.get("version", "") if service_elem is not None else "",
                    }
                    ports.append(port_info)

            hosts.append({"ip": ip, "ports": ports})

        return {
            "tool": "nmap",
            "hosts": hosts,
            # Удобный флат-словарь для условного блока: {80: True, 443: True}
            "open_ports": {
                p["port"]: True
                for h in hosts
                for p in h["ports"]
            },
        }

    return zero_id_parse_nmap_text(stdout)


def zero_id_parse_nmap_text(stdout: str) -> dict:
    """Простой текстовый парсер nmap (fallback)."""
    open_ports = {}
    for line in stdout.splitlines():
        m = re.match(r"(\d+)/(tcp|udp)\s+open\s+(\S+)", line.strip())
        if m:
            port = int(m.group(1))
            open_ports[port] = True
    return {"tool": "nmap", "hosts": [], "open_ports": open_ports}


def zero_id_parse_sqlmap(stdout: str) -> dict:
    """
    Базовый парсер sqlmap.
    Ищем строки об уязвимостях и найденных таблицах/столбцах.
    """
    vulnerable = "sqlmap identified" in stdout or "is vulnerable" in stdout
    injections = []
    for line in stdout.splitlines():
        if "Parameter:" in line or "Type:" in line or "Title:" in line:
            injections.append(line.strip())

    return {
        "tool": "sqlmap",
        "vulnerable": vulnerable,
        "injection_details": injections,
    }


def zero_id_parse_hydra(stdout: str) -> dict:
    """
    Парсер вывода Hydra.
    Ищем строки '[port][service] host: X login: Y password: Z'.
    """
    found_credentials = []
    pattern = re.compile(
        r"\[(\d+)\]\[(\w+)\]\s+host:\s+(\S+)\s+login:\s+(\S+)\s+password:\s+(\S+)"
    )
    for line in stdout.splitlines():
        m = pattern.search(line)
        if m:
            found_credentials.append({
                "port":     m.group(1),
                "service":  m.group(2),
                "host":     m.group(3),
                "login":    m.group(4),
                "password": m.group(5),
            })

    return {
        "tool": "hydra",
        "cracked": len(found_credentials) > 0,
        "credentials": found_credentials,
    }


def zero_id_parse_openssl(stdout: str) -> dict:
    """
    Парсер вывода openssl s_client / testssl.sh.
    Проверяем срок действия сертификата и протоколы.
    """
    result: dict = {"tool": "ssl_check", "issues": []}

    if "Verify return code: 0" in stdout:
        result["chain_valid"] = True
    else:
        result["chain_valid"] = False
        result["issues"].append("Certificate chain verification failed")

    # Дата истечения
    m = re.search(r"notAfter=(.+)", stdout)
    if m:
        result["expires"] = m.group(1).strip()

    # Слабые протоколы
    for proto in ["SSLv2", "SSLv3", "TLSv1.0", "TLSv1.1"]:
        if f"{proto} enabled" in stdout or f"is enabled" in stdout:
            result["issues"].append(f"Weak protocol enabled: {proto}")

    return result


def zero_id_parse_port_check(stdout: str) -> dict:
    """
    Парсер nc/bash-проверки портов.
    Ожидаем строки вида 'PORT 80: OPEN' или 'PORT 22: CLOSED'.
    """
    open_ports = {}
    for line in stdout.splitlines():
        m = re.match(r"PORT (\d+): (OPEN|CLOSED|FILTERED)", line.strip(), re.IGNORECASE)
        if m:
            open_ports[int(m.group(1))] = m.group(2).upper()

    return {"tool": "port_check", "ports": open_ports}


def zero_id_parse_lib_audit(stdout: str, package_manager: str) -> dict:
    """
    Парсер аудита библиотек.
    npm audit возвращает JSON; pip-audit — таблицу; остальные — текст.
    """
    result: dict = {"tool": "lib_audit", "package_manager": package_manager, "vulnerabilities": []}

    if package_manager == "npm":
        import json
        try:
            data = json.loads(stdout)
            vulns = data.get("vulnerabilities", {})
            result["total"] = sum(1 for _ in vulns)
            result["vulnerabilities"] = list(vulns.keys())
        except json.JSONDecodeError:
            result["raw"] = stdout[:500]
    elif package_manager == "pip":
        # pip-audit выдаёт строки: "package  version  vuln_id  description"
        for line in stdout.splitlines():
            parts = line.split()
            if len(parts) >= 3 and parts[0] != "Name":
                result["vulnerabilities"].append({
                    "package": parts[0],
                    "version": parts[1],
                    "vuln_id": parts[2],
                })
    else:
        result["raw"] = stdout[:2000]

    return result


def zero_id_parse_generic(stdout: str, tool_name: str) -> dict:
    """Заглушка-парсер для инструментов без специального разбора."""
    return {
        "tool": tool_name,
        "raw_output": stdout[:4000],  # обрезаем чтобы не хранить мегабайты
        "lines": len(stdout.splitlines()),
    }
