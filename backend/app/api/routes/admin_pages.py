from pathlib import Path

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
from app.services.sitemap_pages import (
    SitemapPageNotFoundError,
    create_sitemap_page,
    delete_sitemap_page,
    get_sitemap_page,
    list_sitemap_pages,
    replace_sitemap_pages,
    search_sitemap_pages as find_sitemap_pages,
    update_sitemap_page,
)

router = APIRouter(tags=["admin pages"])
MAX_UPLOAD_BYTES = 10 * 1024 * 1024


def sitemap_page_not_found_error() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Admin page not found",
    )


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
    return create_sitemap_page(db, payload)


@router.get(
    "/get-admin-pages",
    response_model=list[AdminSitemapRead],
    dependencies=[Depends(get_current_admin)],
    summary="Get all admin pages",
)
def get_admin_pages(db: Session = Depends(get_db)) -> list[AdminSitemap]:
    return list_sitemap_pages(db)


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

    return find_sitemap_pages(db, identifier)


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

    replace_sitemap_pages(db, result.records)

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
    try:
        return get_sitemap_page(db, id)
    except SitemapPageNotFoundError:
        raise sitemap_page_not_found_error() from None


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
    try:
        return update_sitemap_page(db, id, payload)
    except SitemapPageNotFoundError:
        raise sitemap_page_not_found_error() from None


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
    try:
        delete_sitemap_page(db, id)
    except SitemapPageNotFoundError:
        raise sitemap_page_not_found_error() from None
    return Response(status_code=status.HTTP_204_NO_CONTENT)
