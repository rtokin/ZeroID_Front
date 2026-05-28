"""
Zero.ID — проверка API-ключа.
Принимает заголовок X-API-Key: zero_id_test_key.
Позже заменить на JWT.
"""

import os
from fastapi import Header, HTTPException, status

# Ключ читается из окружения — в prod поменяй на длинный секрет
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
        )
