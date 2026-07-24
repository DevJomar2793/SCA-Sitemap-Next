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

The health check is available at `http://127.0.0.1:8000/api/v1/health`.
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Project structure

```text
app/
├── api/routes/       # HTTP endpoints
├── config.py         # Environment settings
├── database.py       # SQLite connection and sessions
├── model.py          # SQLAlchemy database model
├── schema.py         # Request and response validation
└── main.py           # FastAPI application setup
```

## Admin page CRUD

The API stores sitemap records in `sitemap.db`, created automatically in the
backend directory when the application starts.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/add-admin-page` | Create a page |
| `GET` | `/api/v1/get-admin-pages` | List all pages |
| `GET` | `/api/v1/get-admin-pages/{id}` | Read one page |
| `PATCH` | `/api/v1/update-admin-page/{id}` | Update selected fields |
| `DELETE` | `/api/v1/delete-admin-page/{id}` | Delete a page |

`created_at` and `updated_at` are managed automatically and must not be included
in create or update requests.

Example create request:

```json
{
  "alpha": "A",
  "screen_number": "001",
  "screen_type": "Landing",
  "screen_description": "Main landing screen",
  "file_label": "landing.tsx",
  "screen_label": "Landing page",
  "notes": "Initial version",
  "page_location": "/"
}
```

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
