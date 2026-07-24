from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import AdminSitemap
from app.schema import AdminSitemapCreate, AdminSitemapRead, AdminSitemapUpdate

router = APIRouter(prefix="/admin-sitemaps", tags=["admin sitemaps"])
DatabaseSession = Annotated[Session, Depends(get_db)]


def get_admin_sitemap_or_404(admin_sitemap_id: int, database: Session) -> AdminSitemap:
    admin_sitemap = database.get(AdminSitemap, admin_sitemap_id)
    if admin_sitemap is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin sitemap not found",
        )
    return admin_sitemap


@router.post(
    "",
    response_model=AdminSitemapRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an admin sitemap",
)
def create_admin_sitemap(
    payload: AdminSitemapCreate,
    database: DatabaseSession,
) -> AdminSitemap:
    admin_sitemap = AdminSitemap(**payload.model_dump())
    database.add(admin_sitemap)
    database.commit()
    database.refresh(admin_sitemap)
    return admin_sitemap


@router.get(
    "",
    response_model=list[AdminSitemapRead],
    summary="List admin sitemaps",
)
def list_admin_sitemaps(database: DatabaseSession) -> list[AdminSitemap]:
    statement = select(AdminSitemap).order_by(AdminSitemap.id)
    return list(database.scalars(statement))


@router.get(
    "/{admin_sitemap_id}",
    response_model=AdminSitemapRead,
    summary="Get an admin sitemap",
)
def read_admin_sitemap(
    admin_sitemap_id: int,
    database: DatabaseSession,
) -> AdminSitemap:
    return get_admin_sitemap_or_404(admin_sitemap_id, database)


@router.patch(
    "/{admin_sitemap_id}",
    response_model=AdminSitemapRead,
    summary="Update an admin sitemap",
)
def update_admin_sitemap(
    admin_sitemap_id: int,
    payload: AdminSitemapUpdate,
    database: DatabaseSession,
) -> AdminSitemap:
    admin_sitemap = get_admin_sitemap_or_404(admin_sitemap_id, database)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(admin_sitemap, field, value)

    database.commit()
    database.refresh(admin_sitemap)
    return admin_sitemap


@router.delete(
    "/{admin_sitemap_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an admin sitemap",
)
def delete_admin_sitemap(
    admin_sitemap_id: int,
    database: DatabaseSession,
) -> Response:
    admin_sitemap = get_admin_sitemap_or_404(admin_sitemap_id, database)
    database.delete(admin_sitemap)
    database.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
