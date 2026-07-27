from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.model import AdminSitemap
from app.schema import AdminSitemapCreate, AdminSitemapRead, AdminSitemapUpdate

router = APIRouter(tags=["admin pages"])


def get_sitemap_or_404(id: int, db: Session) -> AdminSitemap:
    sitemap = db.get(AdminSitemap, id)
    if sitemap is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Admin page not found",
        )
    return sitemap


@router.post(
    "/add-admin-page",
    response_model=AdminSitemapRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create an admin page",
)
def create_admin_page(
    payload: AdminSitemapCreate,
    db: Session = Depends(get_db),
) -> AdminSitemap:
    sitemap = AdminSitemap(**payload.model_dump())
    db.add(sitemap)
    db.commit()
    db.refresh(sitemap)
    return sitemap


@router.get(
    "/get-admin-pages",
    response_model=list[AdminSitemapRead],
    summary="Get all admin pages",
)
def get_admin_pages(db: Session = Depends(get_db)) -> list[AdminSitemap]:
    statement = select(AdminSitemap).order_by(AdminSitemap.id)
    return list(db.scalars(statement))


@router.get(
    "/get-admin-pages/{id}",
    response_model=AdminSitemapRead,
    summary="Get one admin page",
)
def get_admin_page(
    id: int,
    db: Session = Depends(get_db),
) -> AdminSitemap:
    return get_sitemap_or_404(id, db)


@router.patch(
    "/update-admin-page/{id}",
    response_model=AdminSitemapRead,
    summary="Update an admin page",
)
def update_admin_page(
    id: int,
    payload: AdminSitemapUpdate,
    db: Session = Depends(get_db),
) -> AdminSitemap:
    sitemap = get_sitemap_or_404(id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(sitemap, field, value)

    db.commit()
    db.refresh(sitemap)
    return sitemap


@router.delete(
    "/delete-admin-page/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete an admin page",
)
def delete_admin_page(
    id: int,
    db: Session = Depends(get_db),
) -> Response:
    sitemap = get_sitemap_or_404(id, db)
    db.delete(sitemap)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
