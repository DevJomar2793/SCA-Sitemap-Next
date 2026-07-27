from fastapi import APIRouter

from app.api.routes.admin_pages import router as admin_pages_router
from app.api.routes.health import router as health_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(health_router)
api_router.include_router(admin_pages_router)
