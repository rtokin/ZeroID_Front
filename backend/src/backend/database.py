"""
Zero.ID — подключение к PostgreSQL через SQLAlchemy (async).
Читаем URL из переменной окружения ZERO_ID_DATABASE_URL.
"""

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase

# URL базы данных — задаётся в .env или переменной окружения
ZERO_ID_DATABASE_URL = os.getenv(
    "ZERO_ID_DATABASE_URL",
    "postgresql+asyncpg://zero_id:zero_id_pass@localhost:5432/zero_id_db",
)

# Асинхронный движок SQLAlchemy
zero_id_engine = create_async_engine(
    ZERO_ID_DATABASE_URL,
    echo=False,         # включить echo=True для дебага SQL-запросов
    pool_size=10,
    max_overflow=20,
)

# Фабрика сессий — используется в dependency injection FastAPI
ZeroIdSession = async_sessionmaker(
    bind=zero_id_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# Базовый класс для всех ORM-моделей
class Base(DeclarativeBase):
    pass


async def get_zero_id_db() -> AsyncSession:
    """
    Dependency FastAPI — выдаёт сессию БД на время запроса.
    Гарантирует закрытие сессии после завершения обработчика.
    """
    async with ZeroIdSession() as session:
        yield session
