"""
Zero.ID — SSH-клиент на базе Paramiko.
Один SSHClient на весь блок; переиспользуем соединение внутри одного выполнения.
"""

import logging
import shlex
from typing import Optional
import paramiko

logger = logging.getLogger("zero_id.ssh")


class ZeroIdSSHClient:
    """
    Обёртка над paramiko.SSHClient.
    Умеет: подключаться по паролю или приватному ключу,
    выполнять команды, возвращать (stdout, stderr, exit_code).
    """

    def __init__(self):
        self._client: Optional[paramiko.SSHClient] = None
        self.host: str = ""
        self.port: int = 22

    def connect(
        self,
        host: str,
        port: int = 22,
        username: str = "root",
        auth_method: str = "password",
        password: Optional[str] = None,
        private_key_path: Optional[str] = None,
        timeout: int = 30,
    ) -> None:
        """
        Устанавливаем SSH-соединение.
        auth_method: 'password' или 'key'.
        """
        self.host = host
        self.port = port

        client = paramiko.SSHClient()
        # Автоматически принимаем ключ хоста (для тестовых сред)
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        connect_kwargs: dict = {
            "hostname": host,
            "port": port,
            "username": username,
            "timeout": timeout,
        }

        if auth_method == "key" and private_key_path:
            # Авторизация по приватному ключу
            connect_kwargs["key_filename"] = private_key_path
        else:
            # Авторизация по паролю
            connect_kwargs["password"] = password

        client.connect(**connect_kwargs)
        self._client = client
        logger.info("SSH connected to %s:%s as %s", host, port, username)

    def execute(self, command: str, timeout: int = 300) -> tuple[str, str, int]:
        """
        Выполнить команду на удалённом хосте.
        Возвращает (stdout, stderr, exit_code).
        timeout — максимальное время ожидания в секундах (для долгих сканов).
        """
        if not self._client:
            raise RuntimeError("SSH client is not connected")

        logger.info("[%s] Executing: %s", self.host, command)

        stdin, stdout, stderr = self._client.exec_command(command, timeout=timeout)

        # Читаем весь вывод — блокирующий вызов, ждём завершения команды
        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        exit_code = stdout.channel.recv_exit_status()

        logger.info("[%s] Exit code: %d, stdout len: %d", self.host, exit_code, len(out))
        return out, err, exit_code

    def close(self) -> None:
        """Закрыть соединение."""
        if self._client:
            self._client.close()
            self._client = None
            logger.info("SSH connection to %s closed", self.host)

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()


def zero_id_safe_arg(value: str) -> str:
    """
    Безопасное экранирование аргумента команды через shlex.quote.
    Используем для всех пользовательских параметров (target, path и т.д.).
    Предотвращает shell-инъекции при формировании команд.
    """
    return shlex.quote(str(value))
