# RFM System

Real estate and financial management platform for Cambodian property businesses.

## Implemented foundation

- Laravel 13 API with SQLite local development and PostgreSQL/Redis Docker services.
- React 19 + TypeScript + Vite 8 responsive dashboard shell.
- Project and property-unit migrations, relationships, factories, seeded demo data, validation, filtering, pagination, and duplicate unit protection.
- English/Khmer dashboard toggle and live inventory fetching from the Laravel API.
- Metrics distinguish portfolio inventory states and do not fabricate financial cash totals.

## Run locally

Backend:

```powershell
cd backend
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate:fresh --seed
php artisan serve
```

Frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend uses `http://localhost:8000/api` by default. Override with `frontend/.env.local` and `VITE_API_URL`.

## API

- `GET /api/projects`
- `POST /api/projects`
- `GET /api/property-units?status=available&search=A-01&per_page=20`
- `POST /api/property-units`

## Verification

```powershell
cd backend
php artisan test
cd ..\frontend
npm run lint
npm run build
```

## Scope and limitations

This is the first functional vertical slice, not the complete master specification. Authentication/Sanctum, policies, CRM, bookings, contracts, installment schedules, payment-provider callbacks, accounting posting, notifications, reports, audit logging, and end-to-end workflows remain subsequent increments. No payment success, QR confirmation, revenue, or commission is simulated.

Use `docker compose up -d` for the PostgreSQL and Redis foundation services. Do not use the sample local credentials in production.

