# SCA Sitemap Frontend

Next.js screen finder and administration dashboard for SCA sitemap records.

## Setup

Install dependencies:

```bash
npm install
```

Copy the example environment file if the API uses a different host:

```bash
cp .env.example .env.local
```

The default API URL is `http://localhost:8000/api/v1`.

## Run locally

Start the FastAPI backend first, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- Responsive sitemap table and mobile record cards
- Public screen-number finder with detailed navigation results
- Search and filters
- Client-side pagination and CSV export
- Excel workbook import with drag-and-drop validation
- Create, view, edit, and delete dialogs
- Loading, empty, success, and error states
- Administrator login, public registration, protected dashboard access, and sign out

## Project map

```text
app/
├── layout.tsx                 # Root metadata, fonts, and global styles
├── page.tsx                   # Public screen finder at /
├── login/page.tsx             # Administrator sign-in at /login
├── register/page.tsx          # Public administrator registration at /register
└── dashboard/page.tsx         # Protected sitemap administration at /dashboard
components/
└── layout/
    └── sidebar.tsx            # Shared desktop and mobile navigation
features/
├── auth/                      # Authentication API, types, hooks, and forms
├── search/                    # Screen finder UI and read-only results modal
└── sitemap/
    ├── api.ts                 # Sitemap-only requests to backend endpoints
    ├── types.ts               # Sitemap data types and form field definitions
    ├── utils.ts               # Pagination and CSV helpers
    ├── hooks/                 # Data, table, toast, and dialog state
    └── components/            # Focused sitemap UI sections
```

The feature follows a simple data flow:

1. `use-sitemap-pages.ts` loads and updates records through `api.ts`.
2. `use-sitemap-table-state.ts` derives search, filter, and pagination results.
3. `sitemap-dashboard.tsx` connects state to the focused UI components.
4. Form, delete, and import dialogs call dashboard handlers, which update the
   data hook.

Authentication follows the same feature ownership: `features/auth/api.ts`
contains session requests, `features/auth/types.ts` owns account data, and the
dashboard gate checks the current session before rendering protected content.

### Where to make common changes

- Change shared request behavior in `lib/api-client.ts`.
- Change account/session calls in `features/auth/api.ts`.
- Change sitemap calls in `features/sitemap/api.ts`.
- Change fields or TypeScript models in `features/sitemap/types.ts`.
- Change table columns in `features/sitemap/components/sitemap-table.tsx`.
- Change search, filtering, or pagination in
  `features/sitemap/hooks/use-sitemap-table-state.ts`.
- Change create/edit form presentation in
  `features/sitemap/components/sitemap-page-modal.tsx`.
- Change Excel import presentation in
  `features/sitemap/components/import-sitemap-dialog.tsx`.

The frontend uses sitemap-oriented names even though the existing backend URLs
still contain `admin-page`. Do not rename those URLs without coordinating a
backend API migration.

## Quality checks

```bash
npm run lint
npm run build
```
