from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy import delete, select
from sqlalchemy.orm import Session
from starlette.concurrency import run_in_threadpool

from app.database import get_db
from app.model import AdminSitemap
from app.schema import (
    AdminSitemapCreate,
    AdminSitemapRead,
    AdminSitemapUpdate,
    SitemapImportRead,
)
from app.services.excel_import import WorkbookImportError, parse_sitemap_workbook

router = APIRouter(tags=["admin pages"])
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


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


@router.post(
    "/import-sitemap-pages",
    response_model=SitemapImportRead,
    summary="Replace sitemap pages from an Excel workbook",
)
async def import_sitemap_pages(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
) -> SitemapImportRead:
    filename = file.filename or ""
    if Path(filename).suffix.lower() != ".xlsx":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only .xlsx Excel files are supported",
        )

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    await file.close()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_CONTENT_TOO_LARGE,
            detail="The Excel file must be 10 MB or smaller",
        )

    try:
        result = await run_in_threadpool(parse_sitemap_workbook, contents)
    except WorkbookImportError as error:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail=str(error),
        ) from error

    try:
        db.execute(delete(AdminSitemap))
        db.add_all(AdminSitemap(**record) for record in result.records)
        db.commit()
    except Exception:
        db.rollback()
        raise

    return SitemapImportRead(
        imported_count=len(result.records),
        skipped_count=result.skipped_count,
        worksheet_count=result.worksheet_count,
        ignored_worksheets=result.ignored_worksheets,
    )


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
