"""
Zero.ID — Celery задачи.
Две задачи:
  1. zero_id_run_profile_task    — выполнить весь профиль (DAG блоков)
  2. zero_id_run_single_block_task — выполнить один блок из редактора
"""

import os
import logging
from datetime import datetime, timezone
from celery_app import zero_id_celery
from block_executors import zero_id_dispatch_block
from ssh_client import ZeroIdSSHClient

logger = logging.getLogger("zero_id.tasks")

# SSH-параметры подключения к Kali Linux берём из окружения
ZERO_ID_KALI_HOST = os.getenv("ZERO_ID_KALI_HOST", "127.0.0.1")
ZERO_ID_KALI_PORT = int(os.getenv("ZERO_ID_KALI_PORT", "22"))
ZERO_ID_KALI_USER = os.getenv("ZERO_ID_KALI_USER", "root")
ZERO_ID_KALI_AUTH = os.getenv("ZERO_ID_KALI_AUTH", "password")   # password | key
ZERO_ID_KALI_PASS = os.getenv("ZERO_ID_KALI_PASS", "")
ZERO_ID_KALI_KEY  = os.getenv("ZERO_ID_KALI_KEY_PATH", "")


def _get_ssh() -> ZeroIdSSHClient:
    """
    Создаём и подключаем SSH-клиент к Kali.
    Параметры — из переменных окружения ZERO_ID_KALI_*.
    """
    ssh = ZeroIdSSHClient()
    ssh.connect(
        host=ZERO_ID_KALI_HOST,
        port=ZERO_ID_KALI_PORT,
        username=ZERO_ID_KALI_USER,
        auth_method=ZERO_ID_KALI_AUTH,
        password=ZERO_ID_KALI_PASS or None,
        private_key_path=ZERO_ID_KALI_KEY or None,
    )
    return ssh


def _sync_db():
    """
    Создаём синхронное подключение к БД для использования внутри Celery.
    Celery воркер — синхронный процесс, поэтому используем psycopg2 напрямую.
    """
    import psycopg2
    import os
    db_url = os.getenv(
        "ZERO_ID_DATABASE_SYNC_URL",
        "postgresql://zero_id:zero_id_pass@localhost:5432/zero_id_db",
    )
    return psycopg2.connect(db_url)


def _update_execution_status(execution_id: str, status: str, error_msg: str = None):
    """Обновить статус выполнения в БД (синхронно)."""
    conn = _sync_db()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if status in ("success", "failed"):
            cur.execute(
                "UPDATE zero_id_executions SET status=%s, error_message=%s, finished_at=%s WHERE id=%s",
                (status, error_msg, now, execution_id),
            )
        else:
            cur.execute(
                "UPDATE zero_id_executions SET status=%s WHERE id=%s",
                (status, execution_id),
            )
        conn.commit()
    finally:
        conn.close()


def _save_block_log(execution_id: str, block_id: str, block_type: str,
                    command: str, stdout: str, stderr: str,
                    parsed_result: dict, status: str):
    """Сохранить лог одного блока в таблицу zero_id_execution_logs."""
    import json, uuid
    conn = _sync_db()
    try:
        cur = conn.cursor()
        cur.execute(
            """
            INSERT INTO zero_id_execution_logs
              (id, execution_id, block_id, block_type,
               command_sent, stdout, stderr, parsed_result, status, timestamp)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                str(uuid.uuid4()), execution_id, block_id, block_type,
                command, stdout[:20000], stderr[:5000],
                json.dumps(parsed_result) if parsed_result else None,
                status,
                datetime.now(timezone.utc).replace(tzinfo=None),
            ),
        )
        conn.commit()
    finally:
        conn.close()


def _topological_sort(blocks: list[dict]) -> list[dict]:
    """
    Топологическая сортировка DAG блоков для правильного порядка выполнения.
    Для MVP — достаточно простого линейного порядка по полю next.
    Возвращает список блоков в порядке выполнения.
    """
    if not blocks:
        return []

    # Строим граф: block_id -> block
    block_map = {b["id"]: b for b in blocks}

    # Считаем входящие рёбра для каждого узла
    in_degree = {b["id"]: 0 for b in blocks}
    for b in blocks:
        for nxt in b.get("next", []):
            if nxt in in_degree:
                in_degree[nxt] += 1

    # Начинаем с узлов без входящих рёбер (корни DAG)
    queue = [b["id"] for b, deg in zip(blocks, in_degree.values()) if deg == 0]
    # Исправленный вариант без zip
    queue = [bid for bid, deg in in_degree.items() if deg == 0]
    result = []

    while queue:
        current_id = queue.pop(0)
        current = block_map.get(current_id)
        if not current:
            continue
        result.append(current)
        for nxt in current.get("next", []):
            in_degree[nxt] = in_degree.get(nxt, 1) - 1
            if in_degree[nxt] == 0:
                queue.append(nxt)

    return result


# ------------------------------------------------------------------ #
#  Задача: выполнить весь профиль
# ------------------------------------------------------------------ #

@zero_id_celery.task(name="tasks.zero_id_run_profile_task", bind=True)
def zero_id_run_profile_task(self, execution_id: str, profile_id: str, blocks_data: dict):
    """
    Главная Celery-задача — выполняет все блоки профиля по порядку.
    Контекст передаётся между блоками: результат каждого блока
    добавляется в общий словарь context и доступен следующему блоку.
    """
    logger.info("Starting profile execution: %s (execution_id=%s)", profile_id, execution_id)
    _update_execution_status(execution_id, "running")

    blocks = blocks_data.get("blocks", [])
    sorted_blocks = _topological_sort(blocks)

    if not sorted_blocks:
        _update_execution_status(execution_id, "failed", "No blocks to execute")
        return

    # Общий контекст выполнения — блоки читают и пишут сюда
    context: dict = {}

    # Подключаемся к Kali один раз для всего профиля
    ssh = _get_ssh()
    global_error = None

    try:
        for block in sorted_blocks:
            block_id = block.get("id", "unknown")
            block_type = block.get("type", "")
            params = block.get("params", {})

            logger.info("Executing block: %s (type=%s)", block_id, block_type)

            try:
                result = zero_id_dispatch_block(block_type, params, context, ssh)
            except Exception as exc:
                logger.error("Block %s failed with exception: %s", block_id, exc)
                result = {
                    "stdout": "",
                    "stderr": str(exc),
                    "parsed_result": {"error": str(exc)},
                    "status": "failed",
                    "command": "",
                }

            # Сохраняем лог блока
            _save_block_log(
                execution_id=execution_id,
                block_id=block_id,
                block_type=block_type,
                command=result.get("command", ""),
                stdout=result.get("stdout", ""),
                stderr=result.get("stderr", ""),
                parsed_result=result.get("parsed_result"),
                status=result.get("status", "failed"),
            )

            # Если блок упал — прерываем выполнение профиля
            if result.get("status") == "failed":
                global_error = f"Block {block_type} ({block_id}) failed"
                logger.warning("Stopping profile: %s", global_error)
                break

    except Exception as exc:
        global_error = str(exc)
        logger.error("Profile execution crashed: %s", exc)
    finally:
        ssh.close()

    final_status = "failed" if global_error else "success"
    _update_execution_status(execution_id, final_status, global_error)
    logger.info("Profile execution finished: %s -> %s", execution_id, final_status)


# ------------------------------------------------------------------ #
#  Задача: выполнить один блок
# ------------------------------------------------------------------ #

@zero_id_celery.task(name="tasks.zero_id_run_single_block_task", bind=True)
def zero_id_run_single_block_task(
    self,
    execution_id: str,
    block_id: str,
    block_type: str,
    config: dict,
    built_command: str,
):
    """
    Celery-задача для запуска одного блока прямо из редактора.
    Используется кнопкой Run на ноде в React Flow.
    """
    logger.info("Single block run: type=%s, block_id=%s", block_type, block_id)
    _update_execution_status(execution_id, "running")

    context: dict = {}
    ssh = _get_ssh()

    try:
        result = zero_id_dispatch_block(block_type, config, context, ssh)
    except Exception as exc:
        logger.error("Single block %s failed: %s", block_type, exc)
        result = {
            "stdout": "",
            "stderr": str(exc),
            "parsed_result": {"error": str(exc)},
            "status": "failed",
            "command": built_command,
        }
    finally:
        ssh.close()

    _save_block_log(
        execution_id=execution_id,
        block_id=block_id,
        block_type=block_type,
        command=result.get("command", built_command),
        stdout=result.get("stdout", ""),
        stderr=result.get("stderr", ""),
        parsed_result=result.get("parsed_result"),
        status=result.get("status", "failed"),
    )

    final_status = result.get("status", "failed")
    _update_execution_status(execution_id, final_status)
    logger.info("Single block execution done: %s -> %s", block_id, final_status)
