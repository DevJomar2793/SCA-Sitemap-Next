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
uvicorn main:app --reload
```

The backend loads `backend/.env` automatically at startup. Database settings
use the `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_DB`, `DATABASE_USER`, and
`DATABASE_PASSWORD` names shown in the example file. Existing deployments that
use the equivalent `POSTGRES_*` names continue to work as a fallback.

The health check is available at `http://127.0.0.1:8000/api/v1/health`.
Interactive API documentation is available at `http://127.0.0.1:8000/docs`.

## Project structure

```text
main.py                # FastAPI application setup
routes/                # HTTP endpoints
config.py              # Environment settings
database.py            # PostgreSQL connection and sessions
model.py               # SQLAlchemy database models
schema.py              # Request and response validation
services/              # Excel parsing and sitemap operations
```

## Admin page CRUD

The API stores sitemap records in PostgreSQL. Tables are created automatically
when the application starts against a new database.

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `POST` | `/api/v1/add-admin-page` | Create a page |
| `GET` | `/api/v1/get-admin-pages` | List all pages |
| `GET` | `/api/v1/get-admin-pages/{id}` | Read one page |
| `PATCH` | `/api/v1/update-admin-page/{id}` | Update selected fields |
| `DELETE` | `/api/v1/delete-admin-page/{id}` | Delete a page |
| `POST` | `/api/v1/import-sitemap-pages` | Replace pages from an Excel workbook |
| `GET` | `/api/v1/activity-logs` | Search immutable manual CRUD history |

These dashboard endpoints require an authenticated administrator. The public
`GET /api/v1/search-sitemap-pages?q={identifier}` endpoint remains available
without login.

`file_label`, `screen_label`, `created_at`, and `updated_at` are managed
automatically and must not be included in create or update requests. File labels
use `{alpha}-{screen_number}` and screen labels use
`{file_label}-{screen_description}`. Requests that include either generated
label receive a `422 Unprocessable Entity` response.

Example create request:

```json
{
  "alpha": "A",
  "screen_number": "001",
  "screen_type": "Landing",
  "screen_description": "Main landing screen",
  "notes": "Initial version",
  "page_location": "Dashboard → Users → Master List"
}
```

`page_location` contains concise navigation instructions describing how to
reach the screen. The API field name is retained for compatibility.

## Activity logs

Successful manual sitemap Add, Update, and Delete operations create immutable
activity records in the same database transaction as the underlying change.
Each entry retains the affected record ID and label, the current administrator
ID, a field-level snapshot or before/after diff, and a UTC timestamp. Workbook
imports are intentionally not audited.

`GET /api/v1/activity-logs` supports `q`, `user_id`, `action`, `module`,
`date_from`, `date_to`, `page`, and `page_size`. `date_from` is inclusive and
`date_to` is exclusive. Results are ordered newest first and include filter
options plus pagination totals. There are no public endpoints for modifying or
deleting activity history.

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

The service reads these environment variables:

| Variable | Default |
| --- | --- |
| `APP_NAME` | `SCA Sitemap API` |
| `APP_VERSION` | `0.1.0` |
| `CORS_ORIGINS` | `http://localhost:3000` |
| `DATABASE_HOST` | Required PostgreSQL host, such as `localhost` |
| `DATABASE_PORT` | Required PostgreSQL port, usually `5432` |
| `DATABASE_DB` | Required PostgreSQL database name |
| `DATABASE_USER` | Required PostgreSQL username |
| `DATABASE_PASSWORD` | Required PostgreSQL password |

For compatibility, the backend also accepts `POSTGRES_HOST`, `POSTGRES_PORT`,
`POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` when the corresponding
`DATABASE_*` variable is not set.

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

Login responses include an `expires_at` UTC timestamp. Browser clients can
validate an existing cookie and retrieve the same administrator/session data
with:

```bash
curl -b cookies.txt http://localhost:8000/api/v1/auth/session
```

Authentication failures return a machine-readable `detail.code`, including
`session_expired`, `not_authenticated`, `invalid_session`, `inactive_account`,
or `incorrect_credentials`.

Anyone with access to the application can register an administrator account:

```bash
curl -H "Content-Type: application/json" \
  -d '{
    "email":"second.admin@example.com",
    "full_name":"Second Administrator",
    "password":"another-secure-password"
  }' \
  http://localhost:8000/api/v1/auth/register
```

Registration returns an active account but does not create a session. The new
administrator signs in after registration. Emails are case-insensitive,
passwords must contain 5–128 characters, and an existing email returns
`409 Conflict`.

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
TEST_DATABASE_URL=postgresql+psycopg://sca_sitemap:password@localhost:5432/sca_sitemap_test pytest
```

`TEST_DATABASE_URL` must point to a dedicated PostgreSQL database. The test
suite clears its tables before and after each test.
