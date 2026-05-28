"""
Zero.ID — FastAPI точка входа.
Подключаем роутеры, CORS, middleware и Lifespan.
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import zero_id_engine, Base
from endpoints import router as api_router


# Создаём таблицы при старте (не миграции, только для dev)
@asynccontextmanager
async def zero_id_lifespan(app: FastAPI):
    async with zero_id_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="Zero.ID Backend",
    version="1.0.0",
    description="Оркестратор сканирований безопасности для Zero.ID",
    lifespan=zero_id_lifespan,
)

# CORS — разрешаем запросы от Tauri-приложения и локального фронта
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # в prod сузить до конкретного origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Все API-эндпоинты под префиксом /api/v1
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def zero_id_health():
    """Быстрая проверка — жив ли сервер."""
    return {"status": "ok", "service": "zero_id_backend"}
