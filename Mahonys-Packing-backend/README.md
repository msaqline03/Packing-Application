# Mahonys Packing System – Backend

Laravel **PHP** API with **PostgreSQL**, designed to work with the **Mahonys-Packing-frontend** (Next.js) app. Optional **Blade** views are available for a simple welcome page.

## Stack

- **PHP** 8.2+
- **Laravel** 11
- **PostgreSQL**
- **Laravel Sanctum** (optional, for API auth)

## Setup

### 1. Install dependencies

```bash
cd Mahonys-Packing-backend
composer install
```

### 2. Environment

```bash
cp .env.example .env
php artisan key:generate
```

Edit `.env` and set your PostgreSQL credentials:

```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=mahonys_packing
DB_USERNAME=postgres
DB_PASSWORD=your_password
```

Set the frontend URL for CORS (if using the Next.js app):

```env
FRONTEND_URL=http://localhost:3000
```

### 3. Create database

Create a PostgreSQL database named `mahonys_packing` (or the name you set in `DB_DATABASE`).

### 4. Run migrations

```bash
php artisan migrate
```

### 5. Run the server

```bash
php artisan serve
```

API base: **http://localhost:8000/api**

## API overview

All responses are JSON. The API mirrors the frontend’s data model.

| Area | Endpoints |
|------|-----------|
| **Bootstrap** | `GET /api/app-state?tickets=1&packs=1&transactions=1&cmos=1` – all reference data (+ optional tickets, packs, transactions, cmos) |
| **Reference** | `GET/POST/GET/:id/PUT/:id/DELETE/:id` for: `countries`, `customers`, `commodity-types`, `commodities`, `tests`, `shipping-lines`, `fees-and-charges`, `container-parks`, `terminals`, `transporters`, `container-codes`, `packers`, `stock-locations`, `internal-accounts`, `cmo-statuses`, `trucks`, `vessel-departures`, `users` |
| **CMOs** | `GET/POST/GET/:id/PUT/:id/DELETE/:id` on `cmos`, plus `POST cmos/:id/bookings`, `PUT cmos/:id/bookings/:bookingId`, `DELETE cmos/:id/bookings/:bookingId` |
| **Tickets** | `GET/POST/GET/:id/PUT/:id/DELETE/:id` on `tickets` (query: `type`, `site`, `status`) |
| **Packs** | `GET/POST/GET/:id/PUT/:id/DELETE/:id` on `packs`; nested: `POST/PUT/DELETE packs/:id/containers`, `POST/PUT/DELETE packs/:id/bulk-tickets` |
| **Transactions** | `GET /api/transactions` (query: account_id, ticket_id, ticket_type, from_date, to_date), `GET /api/transactions/by-ticket/:id`, `GET /api/transactions/by-account/:id` |
| **Settings** | `GET/PUT /api/settings/shrink`, `GET/PUT /api/settings/packing-prices`, `GET/PUT /api/settings/transport-prices` |
| **Users** | `GET /api/users/:id/permissions`, `PUT /api/users/:id/permissions` |

## Connecting the frontend

Point the Next.js app at this API:

- Set `NEXT_PUBLIC_API_URL=http://localhost:8000/api` (or your backend URL).
- Replace the in-memory `AppContext` data with `fetch`/`axios` calls to the endpoints above (e.g. load `app-state` on startup, then use REST for CRUD).

Database column names are **snake_case** (e.g. `commodity_type_id`, `cmo_reference`). If the frontend expects **camelCase**, add a small client-side or server-side transform.

## Blade

The root route `/` serves `resources/views/welcome.blade.php`. You can add more Blade views (e.g. admin or reports) under `resources/views/` and register routes in `routes/web.php`.

## Project structure

- `app/Models/` – Eloquent models
- `app/Http/Controllers/Api/` – API controllers
- `config/database.php` – PostgreSQL config
- `config/cors.php` – CORS (e.g. for `FRONTEND_URL`)
- `database/migrations/` – Tables for countries, customers, commodities, tickets, packs, transactions, settings, users, etc.
