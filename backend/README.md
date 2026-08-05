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

Create the local environment configuration:

```bash
cp .env.example .env
```

Replace `AUTH_SECRET_KEY`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`
with real values. Generate a secret with:

```bash
openssl rand -hex 32
```

The first startup creates the administrator if the `admin_users` table is
empty. Later changes to the bootstrap variables do not overwrite that account.

For local development and tests, install the development dependencies instead:

```bash
python -m pip install -r requirements-dev.txt
```

## Run the API

```bash
uvicorn app.main:app --reload
```

The backend loads `backend/.env` automatically at startup.

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
├── services/         # Excel parsing and other business logic
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
| `POST` | `/api/v1/import-sitemap-pages` | Replace pages from an Excel workbook |

These dashboard endpoints require an authenticated administrator. The public
`GET /api/v1/search-sitemap-pages?q={identifier}` endpoint remains available
without login.

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
  "page_location": "Dashboard → Users → Master List"
}
```

`page_location` contains concise navigation instructions describing how to
reach the screen. The API field name is retained for compatibility.

## Excel import

Send a multipart form request to `/api/v1/import-sitemap-pages` with the
workbook in a field named `file`. The importer accepts `.xlsx` files up to
10 MB and imports at most 10,000 detail rows.

Recognized detail worksheets must place `Alpha` and `Screen Number` in the
first two columns. Other supported headers include `Screen Type`,
`Screen Description`, `File Label`, `Screen Label`, `Notes`, and
`Navigation Instruction` (stored as `page_location`). Summary worksheets are
ignored, and blank fields in accepted rows are stored as `Not provided`.

After the complete workbook passes validation, the import replaces all
existing sitemap records in one transaction. A failed import leaves the
existing records unchanged.

## Configuration

The service reads these optional environment variables:

| Variable | Default |
| --- | --- |
| `APP_NAME` | `SCA Sitemap API` |
| `APP_VERSION` | `0.1.0` |
| `CORS_ORIGINS` | `http://localhost:3000` |

Set `CORS_ORIGINS` to a comma-separated list when multiple browser origins are
required.

## Administrator authentication

Log in with the bootstrapped administrator:

```bash
curl -c cookies.txt \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"your-password"}' \
  http://localhost:8000/api/v1/auth/login
```

The login response sets a 30-minute `sca_session` HTTP-only cookie. Use the
cookie for authenticated requests:

```bash
curl -b cookies.txt http://localhost:8000/api/v1/get-admin-pages
```

Anyone can register a full administrator account:

```bash
curl -H "Content-Type: application/json" \
  -d '{
    "email":"second.admin@example.com",
    "full_name":"Second Administrator",
    "password":"another-secure-password"
  }' \
  http://localhost:8000/api/v1/auth/register
```

Registration returns an active account but does not create a session. Browser
clients register and then log in to receive the session cookie. Emails are
case-insensitive, passwords must contain 5–128 characters, and an existing
email returns `409 Conflict`.

> Registration is public by design. Every successful registration receives full
> administrator access to dashboard endpoints.

Log out when finished:

```bash
curl -b cookies.txt -X POST http://localhost:8000/api/v1/auth/logout
```

Browser clients must send credentials with API requests. Use the same hostname
for both services during local development, such as `localhost:3000` and
`localhost:8000`, so the `SameSite=Lax` cookie is sent correctly.

Authentication configuration:

| Variable | Default |
| --- | --- |
| `AUTH_SECRET_KEY` | Required; at least 32 characters |
| `AUTH_COOKIE_SECURE` | `false`; set to `true` behind HTTPS |
| `AUTH_SESSION_MINUTES` | `30` |
| `ADMIN_EMAIL` | Required when creating the first administrator |
| `ADMIN_PASSWORD` | Required when creating the first administrator; 5–128 characters |
| `ADMIN_NAME` | Required when creating the first administrator |

## Tests

```bash
pytest
```
