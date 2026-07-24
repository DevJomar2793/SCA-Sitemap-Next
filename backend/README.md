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
