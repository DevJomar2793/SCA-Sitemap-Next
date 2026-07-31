from pathlib import Path
import re

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Response,
    UploadFile,
    status,
)
from sqlalchemy import delete, func, or_, select
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
from app.security import get_current_admin, require_trusted_origin
from app.services.excel_import import WorkbookImportError, parse_sitemap_workbook

router = APIRouter(tags=["admin pages"])
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
PREFIXED_SCREEN_PATTERN = re.compile(
    r"^(?P<alpha>[A-Za-z][A-Za-z-]*)[\s_-]+(?P<screen_number>.+)$"
)


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
    dependencies=[
        Depends(get_current_admin),
        Depends(require_trusted_origin),
    ],
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
    dependencies=[Depends(get_current_admin)],
    summary="Get all admin pages",
)
def get_admin_pages(db: Session = Depends(get_db)) -> list[AdminSitemap]:
    statement = select(AdminSitemap).order_by(AdminSitemap.id)
    return list(db.scalars(statement))


@router.get(
    "/search-sitemap-pages",
    response_model=list[AdminSitemapRead],
    summary="Search sitemap pages by screen identifier",
)
def search_sitemap_pages(
    q: str = Query(min_length=1),
    db: Session = Depends(get_db),
) -> list[AdminSitemap]:
    identifier = q.strip()
    if not identifier:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="Enter a screen number to search",
        )

    alpha: str | None = None
    screen_number = identifier
    prefixed_identifier = PREFIXED_SCREEN_PATTERN.fullmatch(identifier)
    if prefixed_identifier:
        alpha = prefixed_identifier.group("alpha")
        screen_number = prefixed_identifier.group("screen_number").strip()

    screen_number_condition = (
        func.lower(AdminSitemap.screen_number) == screen_number.lower()
    )
    if screen_number.isdigit():
        normalized_number = screen_number.lstrip("0") or "0"
        screen_number_condition = or_(
            screen_number_condition,
            func.ltrim(AdminSitemap.screen_number, "0") == normalized_number,
        )

    conditions = [screen_number_condition]
    if alpha:
        conditions.append(func.lower(AdminSitemap.alpha) == alpha.lower())

    statement = select(AdminSitemap).where(*conditions).order_by(AdminSitemap.id)
    return list(db.scalars(statement))


@router.post(
    "/import-sitemap-pages",
    response_model=SitemapImportRead,
    dependencies=[
        Depends(get_current_admin),
        Depends(require_trusted_origin),
    ],
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
    dependencies=[Depends(get_current_admin)],
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
    dependencies=[
        Depends(get_current_admin),
        Depends(require_trusted_origin),
    ],
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
    dependencies=[
        Depends(get_current_admin),
        Depends(require_trusted_origin),
    ],
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
