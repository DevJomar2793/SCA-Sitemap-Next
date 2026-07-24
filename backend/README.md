# SCA Sitemap API

FastAPI backend for the SCA Sitemap application.

## Setup

From the `backend` directory, create and activate a virtual environment:

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Install runtime dependencies:

```bash
python -m pip install -r requirements.txt
```

For local development and tests, install the development dependencies instead:

```bash
python -m pip install -r requirements-dev.txt
```

## Run the API

```bash
uvicorn app.main:app --reload
```

The legacy `uvicorn app:main.app --reload` target is also supported for
compatibility.

The health check is available at `http://127.0.0.1:8000/api/v1/health`.
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Admin sitemap CRUD

The API stores sitemap records in `sitemap.db`, created automatically in the
backend directory when the application starts.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/admin-sitemaps` | Create a record |
| `GET` | `/api/v1/admin-sitemaps` | List records |
| `GET` | `/api/v1/admin-sitemaps/{id}` | Read a record |
| `PATCH` | `/api/v1/admin-sitemaps/{id}` | Partially update a record |
| `DELETE` | `/api/v1/admin-sitemaps/{id}` | Delete a record |

`created_at` and `updated_at` are managed automatically and must not be included
in create or update requests.

## Configuration

The service reads these optional environment variables:

| Variable | Default |
| --- | --- |
| `APP_NAME` | `SCA Sitemap API` |
| `APP_VERSION` | `0.1.0` |
| `CORS_ORIGINS` | `http://localhost:3000` |

Set `CORS_ORIGINS` to a comma-separated list when multiple browser origins are
required.

## Tests

```bash
pytest
```
