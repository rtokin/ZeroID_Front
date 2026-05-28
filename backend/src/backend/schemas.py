"""
Zero.ID — Pydantic-схемы для валидации запросов и формирования ответов.
Точно соответствуют типам фронтенда (zero.types.ts).
"""

from __future__ import annotations
from typing import Any, Optional
from datetime import datetime
from pydantic import BaseModel, Field


# ---------- Блок профиля (приходит с фронта) ----------

class ZeroBlock(BaseModel):
    """Один блок в DAG профиля."""
    id: str                          # UUID блока из React Flow
    type: str                        # blockType: nmap_scan, ssh_connect...
    params: dict[str, Any] = {}      # конфиг блока (поле config с фронта)
    next: list[str] = []             # id следующих блоков


class ZeroEdge(BaseModel):
    """Ребро графа (связь между блоками)."""
    id: str
    source: str
    target: str
    animated: bool = True


# ---------- Профиль ----------

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
    """Ответ с данными профиля."""
    id: str
    name: str
    description: str
    blocks: list[Any] = []
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------- Выполнение ----------

class ExecutionLogOut(BaseModel):
    """Лог одного блока."""
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
    """Ответ с данными выполнения."""
    id: str
    profile_id: str
    celery_task_id: Optional[str]
    status: str
    error_message: Optional[str]
    started_at: datetime
    finished_at: Optional[datetime]
    logs: list[ExecutionLogOut] = []

    model_config = {"from_attributes": True}


# ---------- Одиночный блок (запуск из редактора) ----------

class BlockRunRequest(BaseModel):
    """
    Запрос на выполнение одного блока напрямую.
    Используется кнопкой Run в редакторе Zero.ID.
    Соответствует интерфейсу BlockApiCommand из фронта.
    """
    blockType: str
    nodeId: str
    profileId: str
    config: dict[str, Any]
    builtCommand: str


class BlockRunResponse(BaseModel):
    """Ответ после запуска одного блока."""
    jobId: str
    executionId: str
    blockId: str
    status: str = "pending"


# ---------- SSH-конфигурация исполнителя ----------

class SshExecutorConfig(BaseModel):
    """Настройки SSH подключения к Kali Linux."""
    host: str
    port: int = 22
    username: str
    auth_method: str = "password"   # password | key
    password: Optional[str] = None
    private_key_path: Optional[str] = None
    timeout: int = 30
