export interface BackendFile {
  name: string;
  path: string;
  language: string;
  description: string;
  category: 'core' | 'infra' | 'config';
  content: string;
}

export const BACKEND_FILES: BackendFile[] = [
  {
    name: 'main.py',
    path: 'backend/main.py',
    language: 'python',
    description: 'Точка входа FastAPI — CORS, роутеры, Lifespan',
    category: 'core',
    content: `"""
Zero.ID — FastAPI точка входа.
Подключаем роутеры, CORS, middleware и Lifespan.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import zero_id_engine, Base
from endpoints import router as api_router


@asynccontextmanager
async def zero_id_lifespan(app: FastAPI):
    # Создаём таблицы при старте (для dev; в prod — Alembic)
    async with zero_id_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Zero.ID Backend",
    version="1.0.0",
    description="Оркестратор сканирований безопасности для Zero.ID",
    lifespan=zero_id_lifespan,
)

# CORS — разрешаем запросы от Tauri-приложения
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # в prod сузить до конкретного origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Все эндпоинты под /api/v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def zero_id_health():
    """Быстрая проверка — жив ли сервер."""
    return {"status": "ok", "service": "zero_id_backend"}`,
  },
  {
    name: 'database.py',
    path: 'backend/database.py',
    language: 'python',
    description: 'Подключение к PostgreSQL (async SQLAlchemy)',
    category: 'core',
    content: `"""
Zero.ID — подключение к PostgreSQL через SQLAlchemy (async).
Читаем URL из переменной окружения ZERO_ID_DATABASE_URL.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# URL базы данных — задаётся в .env
ZERO_ID_DATABASE_URL = os.getenv(
    "ZERO_ID_DATABASE_URL",
    "postgresql+asyncpg://zero_id:zero_id_pass@localhost:5432/zero_id_db",
)

# Асинхронный движок SQLAlchemy
zero_id_engine = create_async_engine(
    ZERO_ID_DATABASE_URL,
    echo=False,
    pool_size=10,
    max_overflow=20,
)

# Фабрика сессий — используется в dependency injection FastAPI
ZeroIdSession = async_sessionmaker(
    bind=zero_id_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_zero_id_db() -> AsyncSession:
    """
    Dependency FastAPI — выдаёт сессию БД на время запроса.
    Гарантирует закрытие сессии после завершения обработчика.
    """
    async with ZeroIdSession() as session:
        yield session`,
  },
  {
    name: 'models.py',
    path: 'backend/models.py',
    language: 'python',
    description: 'ORM-модели: Profile, ProfileExecution, ExecutionLog',
    category: 'core',
    content: `"""
Zero.ID — ORM-модели: Profile, ProfileExecution, ExecutionLog.
Каскадное удаление: профиль -> выполнения -> логи.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Text, DateTime, ForeignKey, Enum as SAEnum, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def _now() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Profile(Base):
    """
    Профиль сканирования.
    blocks — JSON с массивом блоков и рёбер из React Flow.
    """
    __tablename__ = "zero_id_profiles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    blocks: Mapped[dict] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    executions: Mapped[list["ProfileExecution"]] = relationship(
        "ProfileExecution",
        back_populates="profile",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ProfileExecution(Base):
    """Одно запущенное выполнение профиля."""
    __tablename__ = "zero_id_executions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("zero_id_profiles.id", ondelete="CASCADE")
    )
    celery_task_id: Mapped[str] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("pending", "running", "success", "failed", name="zero_id_exec_status"),
        default="pending",
    )
    error_message: Mapped[str] = mapped_column(Text, nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    finished_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)

    profile: Mapped["Profile"] = relationship("Profile", back_populates="executions")
    logs: Mapped[list["ExecutionLog"]] = relationship(
        "ExecutionLog",
        back_populates="execution",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ExecutionLog(Base):
    """
    Лог одного блока внутри выполнения.
    command_sent — что отправили на Kali,
    parsed_result — структурированный результат парсинга.
    """
    __tablename__ = "zero_id_execution_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    execution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("zero_id_executions.id", ondelete="CASCADE")
    )
    block_id: Mapped[str] = mapped_column(String(255))
    block_type: Mapped[str] = mapped_column(String(64))
    command_sent: Mapped[str] = mapped_column(Text, nullable=True)
    stdout: Mapped[str] = mapped_column(Text, nullable=True)
    stderr: Mapped[str] = mapped_column(Text, nullable=True)
    parsed_result: Mapped[dict] = mapped_column(JSON, nullable=True)
    status: Mapped[str] = mapped_column(
        SAEnum("running", "success", "failed", "skipped", name="zero_id_log_status"),
        default="running",
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=_now)

    execution: Mapped["ProfileExecution"] = relationship(
        "ProfileExecution", back_populates="logs"
    )`,
  },
  {
    name: 'schemas.py',
    path: 'backend/schemas.py',
    language: 'python',
    description: 'Pydantic-схемы запросов и ответов API',
    category: 'core',
    content: `"""
Zero.ID — Pydantic-схемы.
Соответствуют типам фронтенда (zero.types.ts).
"""

from __future__ import annotations
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


class ZeroBlock(BaseModel):
    """Один блок в DAG профиля."""
    id: str
    type: str
    params: dict[str, Any] = {}
    next: list[str] = []


class ZeroEdge(BaseModel):
    id: str
    source: str
    target: str
    animated: bool = True


class ProfileCreate(BaseModel):
    """Тело запроса POST /profiles."""
    name: str = Field(..., min_length=1, max_length=255)
    description: str = ""
    blocks: list[ZeroBlock] = []
    edges: list[ZeroEdge] = []
    is_active: bool = False


class ProfileUpdate(BaseModel):
    """Тело запроса PATCH /profiles/{id}."""
    name: Optional[str] = None
    description: Optional[str] = None
    blocks: Optional[list[ZeroBlock]] = None
    edges: Optional[list[ZeroEdge]] = None
    is_active: Optional[bool] = None


class ProfileOut(BaseModel):
    id: str
    name: str
    description: str
    blocks: list[Any] = []
    is_active: bool
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ExecutionLogOut(BaseModel):
    id: str
    block_id: str
    block_type: str
    command_sent: Optional[str]
    stdout: Optional[str]
    stderr: Optional[str]
    parsed_result: Optional[dict[str, Any]]
    status: str
    timestamp: datetime
    model_config = {"from_attributes": True}


class ExecutionOut(BaseModel):
    id: str
    profile_id: str
    celery_task_id: Optional[str]
    status: str
    error_message: Optional[str]
    started_at: datetime
    finished_at: Optional[datetime]
    logs: list[ExecutionLogOut] = []
    model_config = {"from_attributes": True}


class BlockRunRequest(BaseModel):
    """
    Запрос запуска одного блока из редактора.
    Соответствует BlockApiCommand из zero.types.ts.
    """
    blockType: str
    nodeId: str
    profileId: str
    config: dict[str, Any]
    builtCommand: str


class BlockRunResponse(BaseModel):
    jobId: str
    executionId: str
    blockId: str
    status: str = "pending"`,
  },
  {
    name: 'auth.py',
    path: 'backend/auth.py',
    language: 'python',
    description: 'Проверка API-ключа (X-API-Key)',
    category: 'core',
    content: `"""
Zero.ID — проверка API-ключа.
Заголовок X-API-Key: zero_id_test_key.
Позже заменить на JWT.
"""

import os
from fastapi import Header, HTTPException, status

ZERO_ID_API_KEY = os.getenv("ZERO_ID_API_KEY", "zero_id_test_key")


async def zero_id_require_api_key(x_api_key: str = Header(...)):
    """
    FastAPI dependency — проверяем заголовок X-API-Key.
    Если ключ не совпал — 401 Unauthorized.
    """
    if x_api_key != ZERO_ID_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key",
        )`,
  },
  {
    name: 'endpoints.py',
    path: 'backend/endpoints.py',
    language: 'python',
    description: 'Все REST-эндпоинты API',
    category: 'core',
    content: `"""
Zero.ID — все REST-эндпоинты.

POST   /profiles                    — создать профиль
GET    /profiles                    — список профилей
GET    /profiles/{id}               — один профиль
PATCH  /profiles/{id}               — обновить профиль
DELETE /profiles/{id}               — удалить (каскадно)
POST   /profiles/{id}/run           — запустить профиль
GET    /profiles/{id}/executions    — история запусков
GET    /executions/{id}             — статус выполнения
GET    /executions/{id}/logs        — все логи
GET    /executions/{id}/logs/{bid}  — логи блока
POST   /execute/block               — запуск одного блока
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from database import get_zero_id_db
from auth import zero_id_require_api_key
from models import Profile, ProfileExecution, ExecutionLog
from schemas import (
    ProfileCreate, ProfileUpdate, ProfileOut,
    ExecutionOut, ExecutionLogOut,
    BlockRunRequest, BlockRunResponse,
)
from tasks import zero_id_run_profile_task, zero_id_run_single_block_task

router = APIRouter(dependencies=[Depends(zero_id_require_api_key)])


# --- Профили ---

@router.post("/profiles", response_model=ProfileOut, status_code=201)
async def create_profile(body: ProfileCreate, db: AsyncSession = Depends(get_zero_id_db)):
    profile = Profile(
        name=body.name,
        description=body.description,
        blocks={
            "blocks": [b.model_dump() for b in body.blocks],
            "edges":  [e.model_dump() for e in body.edges],
        },
        is_active=body.is_active,
    )
    db.add(profile)
    await db.commit()
    await db.refresh(profile)
    return profile


@router.get("/profiles", response_model=list[ProfileOut])
async def list_profiles(db: AsyncSession = Depends(get_zero_id_db)):
    result = await db.execute(select(Profile).order_by(Profile.created_at.desc()))
    return result.scalars().all()


@router.get("/profiles/{profile_id}", response_model=ProfileOut)
async def get_profile(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/profiles/{profile_id}", response_model=ProfileOut)
async def update_profile(profile_id: str, body: ProfileUpdate, db: AsyncSession = Depends(get_zero_id_db)):
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if body.name is not None:        profile.name = body.name
    if body.description is not None: profile.description = body.description
    if body.is_active is not None:   profile.is_active = body.is_active
    if body.blocks is not None or body.edges is not None:
        current = profile.blocks or {}
        profile.blocks = {
            "blocks": [b.model_dump() for b in body.blocks] if body.blocks else current.get("blocks", []),
            "edges":  [e.model_dump() for e in body.edges]  if body.edges  else current.get("edges", []),
        }
    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """Удалить профиль — каскадно удалятся все выполнения и логи."""
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()


# --- Запуск профиля ---

@router.post("/profiles/{profile_id}/run", response_model=ExecutionOut, status_code=202)
async def run_profile(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """Запустить профиль через Celery. Фронт поллит /executions/{id}."""
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    execution = ProfileExecution(profile_id=profile_id, status="pending")
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    task = zero_id_run_profile_task.delay(
        execution_id=execution.id,
        profile_id=profile_id,
        blocks_data=profile.blocks,
    )
    execution.celery_task_id = task.id
    await db.commit()
    await db.refresh(execution)
    return execution


# --- Статус и логи ---

@router.get("/executions/{execution_id}", response_model=ExecutionOut)
async def get_execution(execution_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    execution = await db.get(ProfileExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.get("/executions/{execution_id}/logs", response_model=list[ExecutionLogOut])
async def get_execution_logs(execution_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    result = await db.execute(
        select(ExecutionLog)
        .where(ExecutionLog.execution_id == execution_id)
        .order_by(ExecutionLog.timestamp)
    )
    return result.scalars().all()


@router.get("/executions/{execution_id}/logs/{block_id}", response_model=list[ExecutionLogOut])
async def get_block_logs(execution_id: str, block_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    result = await db.execute(
        select(ExecutionLog).where(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.block_id == block_id,
        ).order_by(ExecutionLog.timestamp)
    )
    return result.scalars().all()


# --- Одиночный блок ---

@router.post("/execute/block", response_model=BlockRunResponse, status_code=202)
async def run_single_block(body: BlockRunRequest, db: AsyncSession = Depends(get_zero_id_db)):
    """
    Запустить один блок из редактора.
    Фронт присылает BlockApiCommand (zero.types.ts).
    """
    profile = await db.get(Profile, body.profileId)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    execution = ProfileExecution(profile_id=body.profileId, status="pending")
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    task = zero_id_run_single_block_task.delay(
        execution_id=execution.id,
        block_id=body.nodeId,
        block_type=body.blockType,
        config=body.config,
        built_command=body.builtCommand,
    )
    execution.celery_task_id = task.id
    await db.commit()

    return BlockRunResponse(
        jobId=task.id,
        executionId=execution.id,
        blockId=body.nodeId,
        status="pending",
    )


@router.get("/profiles/{profile_id}/executions", response_model=list[ExecutionOut])
async def list_profile_executions(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    result = await db.execute(
        select(ProfileExecution)
        .where(ProfileExecution.profile_id == profile_id)
        .order_by(ProfileExecution.started_at.desc())
    )
    return result.scalars().all()`,
  },
  {
    name: 'celery_app.py',
    path: 'backend/celery_app.py',
    language: 'python',
    description: 'Настройка Celery + Redis',
    category: 'core',
    content: `"""
Zero.ID — настройка Celery с Redis в качестве брокера.
Worker читает задачи из очереди zero_id_tasks.
"""

import os
from celery import Celery

ZERO_ID_REDIS_URL = os.getenv("ZERO_ID_REDIS_URL", "redis://localhost:6379/0")

zero_id_celery = Celery(
    "zero_id",
    broker=ZERO_ID_REDIS_URL,
    backend=ZERO_ID_REDIS_URL,
)

zero_id_celery.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_acks_late=True,
    worker_prefetch_multiplier=1,   # один таск на воркер — для долгих сканов
    task_routes={
        "tasks.zero_id_run_profile_task":      {"queue": "zero_id_tasks"},
        "tasks.zero_id_run_single_block_task": {"queue": "zero_id_tasks"},
    },
)`,
  },
  {
    name: 'ssh_client.py',
    path: 'backend/ssh_client.py',
    language: 'python',
    description: 'SSH-клиент на Paramiko + безопасное экранирование',
    category: 'core',
    content: `"""
Zero.ID — SSH-клиент на базе Paramiko.
Один SSHClient на одно выполнение профиля.
"""

import logging
import shlex
from typing import Optional
import paramiko

logger = logging.getLogger("zero_id.ssh")


class ZeroIdSSHClient:
    def __init__(self):
        self._client: Optional[paramiko.SSHClient] = None
        self.host: str = ""
        self.port: int = 22

    def connect(self, host, port=22, username="root",
                auth_method="password", password=None,
                private_key_path=None, timeout=30) -> None:
        """Устанавливаем SSH-соединение по паролю или ключу."""
        self.host = host
        self.port = port

        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

        kwargs = {"hostname": host, "port": port, "username": username, "timeout": timeout}
        if auth_method == "key" and private_key_path:
            kwargs["key_filename"] = private_key_path
        else:
            kwargs["password"] = password

        client.connect(**kwargs)
        self._client = client
        logger.info("SSH connected to %s:%s as %s", host, port, username)

    def execute(self, command: str, timeout: int = 300) -> tuple[str, str, int]:
        """
        Выполнить команду на удалённом хосте.
        Возвращает (stdout, stderr, exit_code).
        Блокируется до завершения команды.
        """
        if not self._client:
            raise RuntimeError("SSH client is not connected")

        logger.info("[%s] Executing: %s", self.host, command)
        stdin, stdout, stderr = self._client.exec_command(command, timeout=timeout)

        out = stdout.read().decode("utf-8", errors="replace")
        err = stderr.read().decode("utf-8", errors="replace")
        code = stdout.channel.recv_exit_status()

        logger.info("[%s] Exit code: %d", self.host, code)
        return out, err, code

    def close(self) -> None:
        if self._client:
            self._client.close()
            self._client = None

    def __enter__(self): return self
    def __exit__(self, *_): self.close()


def zero_id_safe_arg(value: str) -> str:
    """
    Безопасное экранирование аргумента через shlex.quote.
    Защищает от shell-инъекций при формировании команд.
    """
    return shlex.quote(str(value))`,
  },
  {
    name: 'parsers.py',
    path: 'backend/parsers.py',
    language: 'python',
    description: 'Парсеры stdout инструментов в структурированный dict',
    category: 'core',
    content: `"""
Zero.ID — парсеры вывода инструментов.
Каждый парсер: raw stdout -> dict для поля parsed_result.
"""

import re
import xml.etree.ElementTree as ET
import logging

logger = logging.getLogger("zero_id.parsers")


def zero_id_parse_nmap(stdout: str, use_xml: bool = True) -> dict:
    """
    Парсинг XML-вывода nmap (-oX -).
    Возвращает хосты с открытыми портами и сервисами.
    """
    if use_xml:
        try:
            root = ET.fromstring(stdout)
        except ET.ParseError as e:
            logger.warning("nmap XML parse error: %s, fallback to text", e)
            return zero_id_parse_nmap_text(stdout)

        hosts = []
        for host_elem in root.findall("host"):
            status_elem = host_elem.find("status")
            if status_elem is not None and status_elem.get("state") != "up":
                continue

            addr_elem = host_elem.find("address[@addrtype='ipv4']")
            ip = addr_elem.get("addr", "unknown") if addr_elem is not None else "unknown"

            ports = []
            ports_elem = host_elem.find("ports")
            if ports_elem is not None:
                for port_elem in ports_elem.findall("port"):
                    state_elem = port_elem.find("state")
                    if state_elem is None or state_elem.get("state") != "open":
                        continue
                    svc = port_elem.find("service")
                    ports.append({
                        "port":     int(port_elem.get("portid", 0)),
                        "protocol": port_elem.get("protocol", "tcp"),
                        "state":    "open",
                        "service":  svc.get("name", "")    if svc is not None else "",
                        "product":  svc.get("product", "") if svc is not None else "",
                        "version":  svc.get("version", "") if svc is not None else "",
                    })

            hosts.append({"ip": ip, "ports": ports})

        return {
            "tool": "nmap",
            "hosts": hosts,
            # Плоский словарь {80: True} — для условного блока
            "open_ports": {p["port"]: True for h in hosts for p in h["ports"]},
        }

    return zero_id_parse_nmap_text(stdout)


def zero_id_parse_nmap_text(stdout: str) -> dict:
    """Fallback текстовый парсер nmap."""
    open_ports = {}
    for line in stdout.splitlines():
        m = re.match(r"(\\d+)/(tcp|udp)\\s+open\\s+(\\S+)", line.strip())
        if m:
            open_ports[int(m.group(1))] = True
    return {"tool": "nmap", "hosts": [], "open_ports": open_ports}


def zero_id_parse_sqlmap(stdout: str) -> dict:
    vulnerable = "sqlmap identified" in stdout or "is vulnerable" in stdout
    injections = [l.strip() for l in stdout.splitlines()
                  if any(k in l for k in ["Parameter:", "Type:", "Title:"])]
    return {"tool": "sqlmap", "vulnerable": vulnerable, "injection_details": injections}


def zero_id_parse_hydra(stdout: str) -> dict:
    pattern = re.compile(
        r"\\[(\\d+)\\]\\[(\\w+)\\]\\s+host:\\s+(\\S+)\\s+login:\\s+(\\S+)\\s+password:\\s+(\\S+)"
    )
    creds = []
    for line in stdout.splitlines():
        m = pattern.search(line)
        if m:
            creds.append({"port": m.group(1), "service": m.group(2),
                          "host": m.group(3), "login": m.group(4), "password": m.group(5)})
    return {"tool": "hydra", "cracked": len(creds) > 0, "credentials": creds}


def zero_id_parse_openssl(stdout: str) -> dict:
    result = {"tool": "ssl_check", "issues": [], "chain_valid": "Verify return code: 0" in stdout}
    m = re.search(r"notAfter=(.+)", stdout)
    if m:
        result["expires"] = m.group(1).strip()
    for proto in ["SSLv2", "SSLv3", "TLSv1.0", "TLSv1.1"]:
        if f"{proto} enabled" in stdout:
            result["issues"].append(f"Weak protocol: {proto}")
    return result


def zero_id_parse_lib_audit(stdout: str, pm: str) -> dict:
    result = {"tool": "lib_audit", "package_manager": pm, "vulnerabilities": []}
    if pm == "npm":
        import json
        try:
            data = json.loads(stdout)
            result["vulnerabilities"] = list(data.get("vulnerabilities", {}).keys())
        except Exception:
            result["raw"] = stdout[:500]
    elif pm == "pip":
        for line in stdout.splitlines():
            parts = line.split()
            if len(parts) >= 3 and parts[0] != "Name":
                result["vulnerabilities"].append({"package": parts[0], "version": parts[1], "id": parts[2]})
    else:
        result["raw"] = stdout[:2000]
    return result


def zero_id_parse_generic(stdout: str, tool: str) -> dict:
    return {"tool": tool, "raw_output": stdout[:4000], "lines": len(stdout.splitlines())}`,
  },
  {
    name: 'block_executors.py',
    path: 'backend/block_executors.py',
    language: 'python',
    description: 'Исполнители блоков — каждый блок независимая функция',
    category: 'core',
    content: `"""
Zero.ID — исполнители блоков.
Каждый блок: params + context + ssh -> dict результата.
Результат: stdout, stderr, parsed_result, status, command.
"""

import os, logging, re, time
from typing import Any
from ssh_client import ZeroIdSSHClient, zero_id_safe_arg
import parsers

logger = logging.getLogger("zero_id.executors")
ZERO_ID_CMD_TIMEOUT = int(os.getenv("ZERO_ID_CMD_TIMEOUT", "600"))


def _run(ssh, cmd): return ssh.execute(cmd, timeout=ZERO_ID_CMD_TIMEOUT)


def execute_ssh_connect(params, context, ssh):
    """Проверить, что SSH-соединение живо."""
    try:
        out, err, code = _run(ssh, "echo zero_id_ok")
        alive = "zero_id_ok" in out
        return {"stdout": out, "stderr": err,
                "parsed_result": {"connected": alive, "host": ssh.host},
                "status": "success" if alive else "failed"}
    except Exception as e:
        return {"stdout": "", "stderr": str(e),
                "parsed_result": {"connected": False}, "status": "failed"}


def execute_nmap_scan(params, context, ssh):
    """
    Блок nmap_scan.
    Формируем команду из параметров фронта,
    запускаем через SSH, парсим XML-вывод.
    """
    target = zero_id_safe_arg(params.get("target", ""))
    if not target:
        return {"stdout": "", "stderr": "target required", "parsed_result": None, "status": "failed"}

    scan_type = params.get("scanType", "sS")
    ports = params.get("ports", "1-1000")
    timing = params.get("timing", 3)
    flags = params.get("flags", {})

    flag_str = f"-{scan_type}"
    if flags.get("serviceVersion"):  flag_str += " -sV"
    if flags.get("defaultScripts"):  flag_str += " -sC"
    if flags.get("osDetection"):     flag_str += " -O"
    if flags.get("aggressiveScan"):  flag_str += " -A"
    if flags.get("noHostDiscovery"): flag_str += " -Pn"
    port_arg = "-p-" if flags.get("allPorts") else f"-p {zero_id_safe_arg(ports)}"

    cmd = f"nmap {flag_str} {port_arg} -T{timing} -oX - {target}"
    if params.get("extraArgs"): cmd += f" {params['extraArgs']}"

    out, err, code = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_nmap(out)
    context["nmap_result"] = parsed

    return {"stdout": out, "stderr": err, "parsed_result": parsed,
            "status": "success" if code == 0 else "failed", "command": cmd}


def execute_port_check(params, context, ssh):
    """Проверить порты через /dev/tcp."""
    target = zero_id_safe_arg(params.get("target", ""))
    if not target:
        return {"stdout": "", "stderr": "target required", "parsed_result": None, "status": "failed"}

    timeout_s = int(params.get("timeout", 5))
    checks = []
    for p in params.get("ports", "22,80,443").split(","):
        p = p.strip()
        checks.append(f"(timeout {timeout_s} bash -c 'echo >/dev/tcp/{target}/{p}' 2>/dev/null "
                      f"&& echo 'PORT {p}: OPEN' || echo 'PORT {p}: CLOSED')")
    cmd = "; ".join(checks)
    out, err, _ = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_port_check(out)
    context["port_check_result"] = parsed
    return {"stdout": out, "stderr": err, "parsed_result": parsed, "status": "success", "command": cmd}


def execute_ssl_check(params, context, ssh):
    """Проверить SSL-сертификат через openssl s_client."""
    host = zero_id_safe_arg(params.get("host", ""))
    port = int(params.get("port", 443))
    if not host:
        return {"stdout": "", "stderr": "host required", "parsed_result": None, "status": "failed"}
    cmd = f"echo | openssl s_client -connect {host}:{port} -servername {host} 2>&1"
    out, err, _ = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_openssl(out)
    context["ssl_result"] = parsed
    return {"stdout": out, "stderr": err, "parsed_result": parsed,
            "status": "warning" if parsed.get("issues") else "success", "command": cmd}


def execute_dos_check(params, context, ssh):
    """Slowloris + hping3 + hey — DoS-тестирование."""
    target = zero_id_safe_arg(params.get("target", ""))
    port = int(params.get("port", 80))
    duration = int(params.get("duration", 30))
    threads = int(params.get("threads", 10))
    if not target:
        return {"stdout": "", "stderr": "target required", "parsed_result": None, "status": "failed"}

    results = {}
    combined_out = ""

    if params.get("checkSlowloris"):
        out, _, _ = _run(ssh, f"timeout {duration} slowloris {target} -p {port} -s {threads} 2>&1 || true")
        combined_out += f"[slowloris]\\n{out}\\n"
        results["slowloris"] = {"ran": True, "output": out[:500]}

    if params.get("checkSynFlood"):
        out, _, _ = _run(ssh, f"timeout {duration} hping3 -S --flood -p {port} {target} 2>&1 || true")
        combined_out += f"[hping3 SYN]\\n{out}\\n"
        results["syn_flood"] = {"ran": True, "output": out[:500]}

    if params.get("checkHttpFlood"):
        rps = int(params.get("requestsPerSecond", 100))
        out, _, _ = _run(ssh, f"hey -z {duration}s -q {rps} -c {threads} http://{target}:{port}/ 2>&1 || true")
        combined_out += f"[http flood]\\n{out}\\n"
        results["http_flood"] = {"ran": True, "output": out[:500]}

    context["dos_result"] = results
    return {"stdout": combined_out, "stderr": "",
            "parsed_result": {"tool": "dos_check", "vectors": results}, "status": "success"}


def execute_sql_injection(params, context, ssh):
    """sqlmap в batch-режиме."""
    url = zero_id_safe_arg(params.get("url", ""))
    if not url:
        return {"stdout": "", "stderr": "url required", "parsed_result": None, "status": "failed"}
    cmd = (f"sqlmap -u {url} --method {params.get('method','GET')} "
           f"--level {params.get('level',1)} --risk {params.get('risk',1)} "
           f"--technique {zero_id_safe_arg(params.get('technique','BEUSTQ'))} "
           f"--batch --output-dir /tmp/zero_id_sqlmap")
    if params.get("data"):    cmd += f" --data {zero_id_safe_arg(params['data'])}"
    if params.get("cookies"): cmd += f" --cookie {zero_id_safe_arg(params['cookies'])}"
    out, err, _ = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_sqlmap(out)
    context["sql_injection_result"] = parsed
    return {"stdout": out, "stderr": err, "parsed_result": parsed, "status": "success", "command": cmd}


def execute_brute_check(params, context, ssh):
    """Hydra — перебор паролей."""
    target = zero_id_safe_arg(params.get("target", ""))
    if not target:
        return {"stdout": "", "stderr": "target required", "parsed_result": None, "status": "failed"}
    stop = "-f" if params.get("stopOnSuccess", True) else ""
    delay_s = max(1, int(params.get("delay", 500)) // 1000)
    cmd = (f"hydra -l {zero_id_safe_arg(params.get('username','root'))} "
           f"-P {zero_id_safe_arg(params.get('wordlistPath','/usr/share/wordlists/rockyou.txt'))} "
           f"-s {params.get('port',22)} {stop} -W {delay_s} "
           f"{target} {params.get('service','ssh')} 2>&1")
    out, err, _ = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_hydra(out)
    context["brute_result"] = parsed
    return {"stdout": out, "stderr": err, "parsed_result": parsed,
            "status": "success" if parsed["cracked"] else "warning", "command": cmd}


def execute_lib_audit(params, context, ssh):
    """Аудит зависимостей на удалённом сервере."""
    path = zero_id_safe_arg(params.get("path", "/var/www/app"))
    pm = params.get("packageManager", "npm")
    cmds = {
        "npm": f"cd {path} && npm audit --json",
        "pip": f"cd {path} && pip-audit --format=columns",
        "gem": f"cd {path} && bundle-audit check --update",
        "composer": f"cd {path} && composer audit",
        "cargo": f"cd {path} && cargo audit",
    }
    cmd = cmds.get(pm, f"echo Unknown package manager: {pm}")
    out, err, _ = _run(ssh, cmd)
    parsed = parsers.zero_id_parse_lib_audit(out, pm)
    context["lib_audit_result"] = parsed
    return {"stdout": out, "stderr": err, "parsed_result": parsed, "status": "success", "command": cmd}


def execute_condition(params, context, ssh):
    """
    Блок ветвления: читаем поле из контекста по dot-path,
    применяем оператор (eq, ne, gt, lt, contains, regex).
    """
    field = params.get("field", "")
    operator = params.get("operator", "eq")
    expected = str(params.get("value", ""))

    # Достаём значение по точечному пути
    parts = field.replace("{{", "").replace("}}", "").split(".")
    actual = context
    for p in parts:
        if isinstance(actual, dict):
            actual = actual.get(p) or actual.get(int(p) if p.isdigit() else p)
        else:
            actual = None; break

    # Применяем оператор
    ops = {
        "eq": lambda a, e: str(a) == e,
        "ne": lambda a, e: str(a) != e,
        "gt": lambda a, e: float(a) > float(e),
        "lt": lambda a, e: float(a) < float(e),
        "contains": lambda a, e: e in str(a),
        "regex": lambda a, e: bool(re.search(e, str(a))),
    }
    result = ops.get(operator, lambda a, e: False)(actual, expected) if actual is not None else False

    return {
        "stdout": f"Condition: {field} {operator} {expected} -> {result}",
        "stderr": "", "status": "success", "condition_result": result,
        "parsed_result": {"field": field, "actual": str(actual), "operator": operator,
                          "expected": expected, "result": result},
    }


def execute_report(params, context, ssh):
    """Сохранить итоговый отчёт на удалённом сервере."""
    import json as _json
    title = params.get("title", "Zero.ID Security Report")
    fmt = params.get("format", "json")
    out_path = params.get("outputPath", "/tmp/zero_id_reports/")
    content = _json.dumps({"title": title, "context": context}, indent=2, default=str)
    filename = "report.json" if fmt == "json" else "report.md"
    escaped = content.replace("'", "'\\''" )
    cmd = f"mkdir -p {zero_id_safe_arg(out_path)} && printf '%s' '{escaped}' > {zero_id_safe_arg(out_path)}/{filename}"
    out, err, code = _run(ssh, cmd)
    return {"stdout": f"Saved to {out_path}/{filename}", "stderr": err,
            "parsed_result": {"tool": "report", "path": f"{out_path}/{filename}"}, "status": "success" if code == 0 else "failed"}


# --- Диспетчер ---
ZERO_ID_BLOCK_EXECUTORS = {
    "ssh_connect":  execute_ssh_connect,
    "nmap_scan":    execute_nmap_scan,
    "port_check":   execute_port_check,
    "ssl_check":    execute_ssl_check,
    "dos_check":    execute_dos_check,
    "sql_injection": execute_sql_injection,
    "brute_check":  execute_brute_check,
    "lib_audit":    execute_lib_audit,
    "condition":    execute_condition,
    "report":       execute_report,
}

def zero_id_dispatch_block(block_type, params, context, ssh):
    """Найти и запустить нужный исполнитель по типу блока."""
    executor = ZERO_ID_BLOCK_EXECUTORS.get(block_type)
    if not executor:
        return {"stdout": "", "stderr": f"Unknown block type: {block_type}",
                "parsed_result": None, "status": "failed"}
    return executor(params, context, ssh)`,
  },
  {
    name: 'tasks.py',
    path: 'backend/tasks.py',
    language: 'python',
    description: 'Celery задачи — профиль целиком и одиночный блок',
    category: 'core',
    content: `"""
Zero.ID — Celery задачи.
zero_id_run_profile_task    — весь профиль (DAG)
zero_id_run_single_block_task — один блок из редактора
"""

import os, logging, uuid, json
from datetime import datetime, timezone
from celery_app import zero_id_celery
from block_executors import zero_id_dispatch_block
from ssh_client import ZeroIdSSHClient

logger = logging.getLogger("zero_id.tasks")

ZERO_ID_KALI_HOST = os.getenv("ZERO_ID_KALI_HOST", "127.0.0.1")
ZERO_ID_KALI_PORT = int(os.getenv("ZERO_ID_KALI_PORT", "22"))
ZERO_ID_KALI_USER = os.getenv("ZERO_ID_KALI_USER", "root")
ZERO_ID_KALI_AUTH = os.getenv("ZERO_ID_KALI_AUTH", "password")
ZERO_ID_KALI_PASS = os.getenv("ZERO_ID_KALI_PASS", "")
ZERO_ID_KALI_KEY  = os.getenv("ZERO_ID_KALI_KEY_PATH", "")


def _get_ssh():
    """Создать SSH-подключение к Kali из переменных окружения."""
    ssh = ZeroIdSSHClient()
    ssh.connect(
        host=ZERO_ID_KALI_HOST, port=ZERO_ID_KALI_PORT,
        username=ZERO_ID_KALI_USER, auth_method=ZERO_ID_KALI_AUTH,
        password=ZERO_ID_KALI_PASS or None,
        private_key_path=ZERO_ID_KALI_KEY or None,
    )
    return ssh


def _sync_db():
    """Синхронное подключение к PostgreSQL для Celery-воркера."""
    import psycopg2
    url = os.getenv("ZERO_ID_DATABASE_SYNC_URL",
                    "postgresql://zero_id:zero_id_pass@localhost:5432/zero_id_db")
    return psycopg2.connect(url)


def _update_status(execution_id, status, error=None):
    """Обновить статус выполнения в БД."""
    conn = _sync_db()
    try:
        cur = conn.cursor()
        now = datetime.now(timezone.utc).replace(tzinfo=None)
        if status in ("success", "failed"):
            cur.execute(
                "UPDATE zero_id_executions SET status=%s,error_message=%s,finished_at=%s WHERE id=%s",
                (status, error, now, execution_id))
        else:
            cur.execute("UPDATE zero_id_executions SET status=%s WHERE id=%s", (status, execution_id))
        conn.commit()
    finally:
        conn.close()


def _save_log(execution_id, block_id, block_type, command, stdout, stderr, parsed_result, status):
    """Сохранить лог одного блока."""
    conn = _sync_db()
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO zero_id_execution_logs
              (id,execution_id,block_id,block_type,command_sent,stdout,stderr,parsed_result,status,timestamp)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (str(uuid.uuid4()), execution_id, block_id, block_type,
             command, stdout[:20000], stderr[:5000],
             json.dumps(parsed_result) if parsed_result else None,
             status, datetime.now(timezone.utc).replace(tzinfo=None)))
        conn.commit()
    finally:
        conn.close()


def _topological_sort(blocks: list) -> list:
    """
    Топологическая сортировка DAG блоков.
    Блоки без входящих рёбер — корни, выполняются первыми.
    """
    block_map = {b["id"]: b for b in blocks}
    in_degree = {b["id"]: 0 for b in blocks}
    for b in blocks:
        for nxt in b.get("next", []):
            if nxt in in_degree:
                in_degree[nxt] += 1
    queue = [bid for bid, deg in in_degree.items() if deg == 0]
    result = []
    while queue:
        current_id = queue.pop(0)
        current = block_map.get(current_id)
        if not current: continue
        result.append(current)
        for nxt in current.get("next", []):
            in_degree[nxt] -= 1
            if in_degree[nxt] == 0:
                queue.append(nxt)
    return result


@zero_id_celery.task(name="tasks.zero_id_run_profile_task", bind=True)
def zero_id_run_profile_task(self, execution_id, profile_id, blocks_data):
    """
    Выполнить весь профиль.
    Блоки выполняются по топологическому порядку DAG.
    Контекст передаётся между блоками — результат каждого
    доступен следующему через общий словарь context.
    """
    logger.info("Profile run start: %s (exec=%s)", profile_id, execution_id)
    _update_status(execution_id, "running")

    blocks = _topological_sort(blocks_data.get("blocks", []))
    if not blocks:
        _update_status(execution_id, "failed", "No blocks")
        return

    context = {}
    ssh = _get_ssh()
    error = None

    try:
        for block in blocks:
            bid = block.get("id", "?")
            btype = block.get("type", "")
            logger.info("Block: %s (%s)", bid, btype)
            try:
                result = zero_id_dispatch_block(btype, block.get("params", {}), context, ssh)
            except Exception as exc:
                logger.error("Block %s crashed: %s", bid, exc)
                result = {"stdout": "", "stderr": str(exc),
                          "parsed_result": {"error": str(exc)}, "status": "failed", "command": ""}

            _save_log(execution_id, bid, btype,
                      result.get("command",""), result.get("stdout",""),
                      result.get("stderr",""), result.get("parsed_result"), result.get("status","failed"))

            if result.get("status") == "failed":
                error = f"Block {btype} ({bid}) failed"
                logger.warning("Stopping: %s", error)
                break
    except Exception as exc:
        error = str(exc)
        logger.error("Profile crashed: %s", exc)
    finally:
        ssh.close()

    _update_status(execution_id, "failed" if error else "success", error)
    logger.info("Profile done: %s -> %s", execution_id, "failed" if error else "success")


@zero_id_celery.task(name="tasks.zero_id_run_single_block_task", bind=True)
def zero_id_run_single_block_task(self, execution_id, block_id, block_type, config, built_command):
    """Выполнить один блок из редактора Zero.ID."""
    logger.info("Single block: %s (%s)", block_type, block_id)
    _update_status(execution_id, "running")
    ssh = _get_ssh()
    try:
        result = zero_id_dispatch_block(block_type, config, {}, ssh)
    except Exception as exc:
        result = {"stdout": "", "stderr": str(exc),
                  "parsed_result": {"error": str(exc)}, "status": "failed", "command": built_command}
    finally:
        ssh.close()
    _save_log(execution_id, block_id, block_type,
              result.get("command", built_command), result.get("stdout",""),
              result.get("stderr",""), result.get("parsed_result"), result.get("status","failed"))
    _update_status(execution_id, result.get("status","failed"))
    logger.info("Single block done: %s -> %s", block_id, result.get("status"))`,
  },
  {
    name: 'requirements.txt',
    path: 'backend/requirements.txt',
    language: 'text',
    description: 'Python зависимости проекта',
    category: 'config',
    content: `# Zero.ID Backend — зависимости Python

fastapi==0.111.0
uvicorn[standard]==0.29.0
python-multipart==0.0.9
pydantic==2.7.1

# БД — async для FastAPI, sync для Celery
sqlalchemy[asyncio]==2.0.30
asyncpg==0.29.0
psycopg2-binary==2.9.9

# Celery + Redis
celery==5.4.0
redis==5.0.4

# SSH
paramiko==3.4.0

# Переменные окружения
python-dotenv==1.0.1`,
  },
  {
    name: 'docker-compose.yml',
    path: 'backend/docker-compose.yml',
    language: 'yaml',
    description: 'Docker Compose — PostgreSQL + Redis',
    category: 'infra',
    content: `version: "3.9"

# Zero.ID — инфраструктура: PostgreSQL + Redis
# FastAPI и Celery запускаются отдельно

services:
  zero_id_postgres:
    image: postgres:16-alpine
    container_name: zero_id_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: zero_id
      POSTGRES_PASSWORD: zero_id_pass
      POSTGRES_DB: zero_id_db
    volumes:
      - zero_id_pg_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U zero_id -d zero_id_db"]
      interval: 10s
      timeout: 5s
      retries: 5

  zero_id_redis:
    image: redis:7-alpine
    container_name: zero_id_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

volumes:
  zero_id_pg_data:`,
  },
  {
    name: '.env.example',
    path: 'backend/.env.example',
    language: 'bash',
    description: 'Шаблон переменных окружения',
    category: 'config',
    content: `# Zero.ID Backend — переменные окружения
# Скопируй в .env и заполни свои значения

# PostgreSQL
ZERO_ID_DATABASE_URL=postgresql+asyncpg://zero_id:zero_id_pass@localhost:5432/zero_id_db
ZERO_ID_DATABASE_SYNC_URL=postgresql://zero_id:zero_id_pass@localhost:5432/zero_id_db

# Redis
ZERO_ID_REDIS_URL=redis://localhost:6379/0

# API-ключ (заголовок X-API-Key)
ZERO_ID_API_KEY=zero_id_test_key

# SSH подключение к Kali Linux
ZERO_ID_KALI_HOST=192.168.1.100
ZERO_ID_KALI_PORT=22
ZERO_ID_KALI_USER=root
ZERO_ID_KALI_AUTH=password
ZERO_ID_KALI_PASS=your_kali_password
ZERO_ID_KALI_KEY_PATH=

# Таймаут SSH-команд (секунды)
ZERO_ID_CMD_TIMEOUT=600`,
  },
];

export const API_ENDPOINTS = [
  { method: 'POST',   path: '/api/v1/profiles',                    desc: 'Создать профиль' },
  { method: 'GET',    path: '/api/v1/profiles',                    desc: 'Список всех профилей' },
  { method: 'GET',    path: '/api/v1/profiles/{id}',               desc: 'Получить профиль по ID' },
  { method: 'PATCH',  path: '/api/v1/profiles/{id}',               desc: 'Обновить профиль' },
  { method: 'DELETE', path: '/api/v1/profiles/{id}',               desc: 'Удалить профиль (каскадно)' },
  { method: 'POST',   path: '/api/v1/profiles/{id}/run',           desc: 'Запустить профиль через Celery' },
  { method: 'GET',    path: '/api/v1/profiles/{id}/executions',    desc: 'История запусков профиля' },
  { method: 'GET',    path: '/api/v1/executions/{id}',             desc: 'Статус выполнения + логи' },
  { method: 'GET',    path: '/api/v1/executions/{id}/logs',        desc: 'Все логи выполнения' },
  { method: 'GET',    path: '/api/v1/executions/{id}/logs/{bid}',  desc: 'Логи конкретного блока' },
  { method: 'POST',   path: '/api/v1/execute/block',               desc: 'Запустить один блок из редактора' },
  { method: 'GET',    path: '/health',                             desc: 'Проверка состояния сервера' },
];
