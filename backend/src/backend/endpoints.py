"""
Zero.ID — все REST-эндпоинты.

Маршруты:
  POST   /profiles                    — создать профиль
  GET    /profiles                    — список профилей
  GET    /profiles/{id}               — один профиль
  PATCH  /profiles/{id}               — обновить профиль
  DELETE /profiles/{id}               — удалить профиль (каскадно)
  POST   /profiles/{id}/run           — запустить профиль (Celery)
  GET    /executions/{id}             — статус выполнения
  GET    /executions/{id}/logs        — все логи выполнения
  GET    /executions/{id}/logs/{bid}  — логи конкретного блока
  POST   /execute/block               — запуск одного блока из редактора
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
from celery_app import zero_id_celery
from tasks import zero_id_run_profile_task, zero_id_run_single_block_task

router = APIRouter(dependencies=[Depends(zero_id_require_api_key)])


# ------------------------------------------------------------------ #
#  Профили
# ------------------------------------------------------------------ #

@router.post("/profiles", response_model=ProfileOut, status_code=201)
async def create_profile(body: ProfileCreate, db: AsyncSession = Depends(get_zero_id_db)):
    """Создать новый профиль сканирования."""
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
    """Вернуть все профили (без выполнений)."""
    result = await db.execute(select(Profile).order_by(Profile.created_at.desc()))
    return result.scalars().all()


@router.get("/profiles/{profile_id}", response_model=ProfileOut)
async def get_profile(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """Получить профиль по ID."""
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile


@router.patch("/profiles/{profile_id}", response_model=ProfileOut)
async def update_profile(
    profile_id: str,
    body: ProfileUpdate,
    db: AsyncSession = Depends(get_zero_id_db),
):
    """Обновить поля профиля (имя, описание, блоки, статус активности)."""
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if body.name is not None:
        profile.name = body.name
    if body.description is not None:
        profile.description = body.description
    if body.is_active is not None:
        profile.is_active = body.is_active
    if body.blocks is not None or body.edges is not None:
        current = profile.blocks or {}
        profile.blocks = {
            "blocks": [b.model_dump() for b in body.blocks] if body.blocks is not None else current.get("blocks", []),
            "edges":  [e.model_dump() for e in body.edges]  if body.edges  is not None else current.get("edges", []),
        }

    await db.commit()
    await db.refresh(profile)
    return profile


@router.delete("/profiles/{profile_id}", status_code=204)
async def delete_profile(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """
    Удалить профиль и каскадно все выполнения + логи.
    Каскад прописан на уровне FK ondelete=CASCADE и relationship.
    """
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    await db.delete(profile)
    await db.commit()


# ------------------------------------------------------------------ #
#  Запуск профиля
# ------------------------------------------------------------------ #

@router.post("/profiles/{profile_id}/run", response_model=ExecutionOut, status_code=202)
async def run_profile(profile_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """
    Запустить профиль целиком через Celery.
    Создаём запись ProfileExecution, отправляем задачу в очередь.
    Фронт должен поллить /executions/{id} для получения статуса.
    """
    profile = await db.get(Profile, profile_id)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Создаём запись о выполнении со статусом pending
    execution = ProfileExecution(profile_id=profile_id, status="pending")
    db.add(execution)
    await db.commit()
    await db.refresh(execution)

    # Отправляем задачу в Celery — передаём ID выполнения и блоки
    task = zero_id_run_profile_task.delay(
        execution_id=execution.id,
        profile_id=profile_id,
        blocks_data=profile.blocks,
    )

    # Сохраняем Celery task_id для отладки
    execution.celery_task_id = task.id
    await db.commit()
    await db.refresh(execution)
    return execution


# ------------------------------------------------------------------ #
#  Статус и логи выполнения
# ------------------------------------------------------------------ #

@router.get("/executions/{execution_id}", response_model=ExecutionOut)
async def get_execution(execution_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """Получить статус и логи одного выполнения профиля."""
    execution = await db.get(ProfileExecution, execution_id)
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    return execution


@router.get("/executions/{execution_id}/logs", response_model=list[ExecutionLogOut])
async def get_execution_logs(execution_id: str, db: AsyncSession = Depends(get_zero_id_db)):
    """Все логи выполнения — по всем блокам."""
    result = await db.execute(
        select(ExecutionLog)
        .where(ExecutionLog.execution_id == execution_id)
        .order_by(ExecutionLog.timestamp)
    )
    return result.scalars().all()


@router.get("/executions/{execution_id}/logs/{block_id}", response_model=list[ExecutionLogOut])
async def get_block_logs(
    execution_id: str,
    block_id: str,
    db: AsyncSession = Depends(get_zero_id_db),
):
    """Логи конкретного блока внутри выполнения."""
    result = await db.execute(
        select(ExecutionLog)
        .where(
            ExecutionLog.execution_id == execution_id,
            ExecutionLog.block_id == block_id,
        )
        .order_by(ExecutionLog.timestamp)
    )
    return result.scalars().all()


# ------------------------------------------------------------------ #
#  Запуск одного блока из редактора
# ------------------------------------------------------------------ #

@router.post("/execute/block", response_model=BlockRunResponse, status_code=202)
async def run_single_block(
    body: BlockRunRequest,
    db: AsyncSession = Depends(get_zero_id_db),
):
    """
    Запустить один блок прямо из редактора (кнопка Run).
    Создаём мини-выполнение для этого профиля и ставим блок в очередь.
    Фронт присылает BlockApiCommand (blockType, nodeId, profileId, config, builtCommand).
    """
    # Проверяем, что профиль существует
    profile = await db.get(Profile, body.profileId)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    # Создаём выполнение для одного блока
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


# ------------------------------------------------------------------ #
#  Список выполнений профиля
# ------------------------------------------------------------------ #

@router.get("/profiles/{profile_id}/executions", response_model=list[ExecutionOut])
async def list_profile_executions(
    profile_id: str,
    db: AsyncSession = Depends(get_zero_id_db),
):
    """Все запуски конкретного профиля — история выполнений."""
    result = await db.execute(
        select(ProfileExecution)
        .where(ProfileExecution.profile_id == profile_id)
        .order_by(ProfileExecution.started_at.desc())
    )
    return result.scalars().all()
