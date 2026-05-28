"""
Zero.ID — настройка Celery с Redis в качестве брокера.
Worker читает задачи из очереди zero_id_tasks.
"""

import os
from celery import Celery

# URL Redis — задаётся в .env, по умолчанию локальный
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
    task_track_started=True,       # статус STARTED появляется сразу при взятии задачи
    task_acks_late=True,           # подтверждение только после успешного завершения
    worker_prefetch_multiplier=1,  # каждый воркер берёт по одной задаче — для долгих сканов
    task_routes={
        # Все задачи Zero.ID — в одну очередь
        "tasks.zero_id_run_profile_task":      {"queue": "zero_id_tasks"},
        "tasks.zero_id_run_single_block_task": {"queue": "zero_id_tasks"},
    },
)
