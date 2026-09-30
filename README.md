# SCA Sitemap

SCA Sitemap is a two-project application for finding application screens and
maintaining the sitemap catalogue.

- `frontend/` is the Next.js screen finder and administration dashboard.
- `backend/` is the FastAPI service, PostgreSQL storage, authentication, and Excel
  workbook importer.

For local development, run the backend at `http://localhost:8000` and the
frontend at `http://localhost:3000`. Each project has its own setup, testing,
and configuration instructions in its README.

## Docker

Create separate environment files from the provided examples. Set the frontend
API URL to the exposed backend port:

```dotenv
# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

Set the `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, and
`POSTGRES_PASSWORD` values plus real authentication/bootstrap values in
`backend/.env`.

From the repository root, build and start both services:

```bash
docker compose --env-file backend/.env --env-file frontend/.env up --build
```

The frontend is available at `http://localhost:3000` and the API at
`http://localhost:8000`. PostgreSQL data is stored in the named
`postgres_data` Docker volume and is retained when containers restart.
