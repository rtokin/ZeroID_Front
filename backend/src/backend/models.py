"""
Zero.ID — ORM-модели: Profile, ProfileExecution, ExecutionLog.
Каскадное удаление: удаляем профиль -> удаляются все выполнения и логи.
"""

import uuid
from datetime import datetime, timezone
from sqlalchemy import (
    String, Text, DateTime, ForeignKey, Enum as SAEnum, JSON
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from database import Base


def _now() -> datetime:
    """Текущее время UTC без tzinfo — для единообразия в БД."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class Profile(Base):
    """
    Профиль сканирования.
    Хранит список блоков (DAG) в JSON-поле blocks.
    blocks — массив объектов {id, type, params, next}.
    """
    __tablename__ = "zero_id_profiles"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, default="")
    blocks: Mapped[dict] = mapped_column(JSON, default=list)  # список блоков + рёбра
    is_active: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_now, onupdate=_now)

    # Связь с выполнениями — каскад: удаляем профиль -> все выполнения удаляются
    executions: Mapped[list["ProfileExecution"]] = relationship(
        "ProfileExecution",
        back_populates="profile",
        cascade="all, delete-orphan",
        lazy="selectin",
    )


class ProfileExecution(Base):
    """
    Одно запущенное выполнение профиля.
    status: pending -> running -> success | failed
    """
    __tablename__ = "zero_id_executions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    profile_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("zero_id_profiles.id", ondelete="CASCADE"), nullable=False
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
    Хранит: что отправили, что получили, разобранный результат.
    """
    __tablename__ = "zero_id_execution_logs"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    execution_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("zero_id_executions.id", ondelete="CASCADE"), nullable=False
    )
    block_id: Mapped[str] = mapped_column(String(255), nullable=False)  # UUID блока из фронта
    block_type: Mapped[str] = mapped_column(String(64), nullable=False)  # nmap_scan, dos_check...
    command_sent: Mapped[str] = mapped_column(Text, nullable=True)       # shell-команда
    stdout: Mapped[str] = mapped_column(Text, nullable=True)
    stderr: Mapped[str] = mapped_column(Text, nullable=True)
    parsed_result: Mapped[dict] = mapped_column(JSON, nullable=True)     # структурированный результат
    status: Mapped[str] = mapped_column(
        SAEnum("running", "success", "failed", "skipped", name="zero_id_log_status"),
        default="running",
    )
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=_now)

    execution: Mapped["ProfileExecution"] = relationship(
        "ProfileExecution", back_populates="logs"
    )
