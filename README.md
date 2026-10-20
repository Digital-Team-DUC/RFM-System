# Real Estate & Financial Management System (RFM Enterprise)

[![Full-Stack Architecture](https://img.shields.io/badge/Architecture-Three--Part%20Monorepo-059669.svg)](https://github.com/Digital-Team-DUC/RFM-System)
[![Backend: NestJS](https://img.shields.io/badge/Backend-NestJS%2010%20%7C%20TypeScript-E0234E.svg)](https://nestjs.com/)
[![Frontend: React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%20%7C%20Tailwind-61DAFB.svg)](https://react.dev/)
[![Database: PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016%20%7C%20Prisma%20ORM-336791.svg)](https://www.postgresql.org/)
[![Docker Compose](https://img.shields.io/badge/Orchestration-Docker%20Compose-2496ED.svg)](https://www.docker.com/)

An enterprise-grade ERP designed specifically for multi-project real estate developers, property investment firms, and borey communities. The system centralizes property inventory, interactive master site plans, customer relationship management (CRM), reservation bookings, binding sales contracts, 24-month installment schedules, sales agent commissions, operating expenses, and statutory double-entry accounting.

---

## 1. Mandatory Three-Part Architecture

```
                                  ┌────────────────────────┐
                                  │     Reverse Proxy      │
                                  │     (Nginx Port 80)    │
                                  └───────────┬────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
         ┌────────────────────────┐                      ┌────────────────────────┐
         │   Frontend (Part 1)    │                      │    Backend (Part 2)    │
         │   React 18 + Vite      │                      │    NestJS + TypeScript │
         │   Tailwind + shadcn    │ ─── REST / WS API ──>│    OpenAPI / Socket.IO │
         │   Bilingual (EN / KM)  │                      │    Decimal.js Engine   │
         └────────────────────────┘                      └───────────┬────────────┘
                                                                     │
                                              ┌──────────────────────┴──────────────────────┐
                                              ▼                                             ▼
                                 ┌────────────────────────┐                    ┌────────────────────────┐
                                 │   Database (Part 3)    │                    │     Cache & Queue      │
                                 │   PostgreSQL 16        │                    │     Redis 7 (BullMQ)   │
                                 │   Prisma Relational    │                    │     Transient Data     │
                                 └────────────────────────┘                    └────────────────────────┘
```

### Part 1 — Frontend (`apps/frontend`)
- **Framework**: React 18 with strict TypeScript and Vite
- **Styling**: Tailwind CSS with dark-mode enterprise tokens and glassmorphism
- **Routing**: React Router DOM (v6) with declarative route guards
- **Data Fetching**: Authenticated API client with token injection and automatic 401 handling
- **Interactive Visuals**: SVG site plan geometry renderer with zoom/pan and live status coloring
- **Analytics**: Recharts area trends, collection indicators, and inventory donuts
- **Localization**: `i18next` with seamless runtime switching between English and Khmer (ភាសាខ្មែរ)
- **Regional Defaults**: USD ($) and Cambodian Riel (៛), Asia/Phnom_Penh timezone

### Part 2 — Backend (`apps/backend`)
- **Framework**: NestJS (Node.js + TypeScript strict mode)
- **API Standard**: Versioned REST endpoints starting at `/api/v1`
- **API Documentation**: OpenAPI / Swagger live UI at `/api/docs`
- **Real-Time Layer**: Socket.IO Events Gateway broadcasting property updates and payments
- **Authentication**: JWT access tokens (8h) + refresh tokens (7d) with rotation & revocation
- **Authorization**: Granular Permission Guard (`@RequirePermissions('...')`) + Super Admin bypass
- **Financial Invariants**: Decimal-safe arithmetic (via `Decimal.js`) preventing floating-point drift
- **Concurrency Safety**: Serializable database transactions preventing double-booking of properties

### Part 3 — Database (`apps/backend/prisma`)
- **Engine**: PostgreSQL 16
- **ORM**: Prisma Client & Schema
- **Integrity**: Foreign keys with explicit referential integrity, unique constraints on identifiers, and composite indexes on project/status/tenant scopes
- **Double-Entry Ledger**: Chart of Accounts (`1010`–`6050`), Journal Entries enforcing `Total Debits == Total Credits`, and automatic posting upon payment verification

---

## 2. Directory Structure

```
RFM-System/
├── apps/
│   ├── frontend/                 # React 18 + Vite + Tailwind frontend application
│   │   ├── src/
│   │   │   ├── components/       # Layout, Navbar, Sidebar
│   │   │   ├── context/          # AuthContext, SocketContext
│   │   │   ├── i18n/             # English and Khmer translation bundles
│   │   │   ├── pages/            # 16 enterprise business modules
│   │   │   ├── services/         # Authenticated REST API wrapper
│   │   │   ├── App.tsx           # Route tree
│   │   │   └── main.tsx          # App entry
│   │   ├── Dockerfile            # Multi-stage Dockerfile
│   │   ├── nginx.conf            # SPA routing configuration
│   │   └── package.json
│   └── backend/                  # NestJS TypeScript backend application
│       ├── src/
│       │   ├── auth/             # Passport, JWT, Guards, Permissions
│       │   ├── common/           # PrismaService, Decimal utilities
│       │   ├── events/           # Socket.IO WebSocket Gateway
│       │   ├── projects/         # Multi-project portfolio management
│       │   ├── properties/       # Property inventory & status transitions
│       │   ├── master-plan/      # SVG site-plan geometry & plot links
│       │   ├── crm/              # Leads Kanban pipeline & viewings
│       │   ├── bookings/         # Concurrency-safe reservations & deposits
│       │   ├── contracts/        # Contract generation & versioning
│       │   ├── payments/         # Installment schedule & sequential allocation
│       │   ├── commissions/      # Agent commission policies & payouts
│       │   ├── finance/          # Operating expenses & bank accounts
│       │   ├── accounting/       # Double-entry COA, Journal, P&L, Balance Sheet
│       │   ├── dashboard/        # Database-backed KPI metrics & aggregations
│       │   ├── notifications/    # Notification center & read receipts
│       │   ├── users/            # RBAC staff directory
│       │   └── audit/            # Immutable audit trail
│       ├── prisma/
│       │   ├── schema.prisma     # Relational PostgreSQL schema
│       │   └── seed.ts           # Realistic development seed script
│       ├── Dockerfile            # Multi-stage Dockerfile
│       └── package.json
├── packages/
│   └── shared/                   # Shared TypeScript models, enums & financial engine
│       ├── src/
│       │   ├── enums.ts          # Roles, permissions, statuses, currencies
│       │   ├── types.ts          # Domain DTOs and API interfaces
│       │   ├── financial.ts      # Reconciled schedule generator & late penalties
│       │   └── index.ts
│       └── package.json
├── infrastructure/
│   ├── nginx/
│   │   └── nginx.conf            # Production reverse proxy configuration
├── docker-compose.yml            # Production compose: 6 services (db, redis, backend, worker, frontend, proxy)
├── docker-compose.dev.yml        # Development compose: Postgres & Redis
├── .env.example                  # Environment configuration template
├── README.md                     # Architecture & operating manual
├── SECURITY.md                   # Security guidelines & permission matrix
└── BACKUP.md                     # Database backup and disaster recovery guide
```

---

## 3. Quick Start Instructions

### Prerequisites
- Node.js >= 20
- npm >= 10
- Docker Desktop with Docker Compose

### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/Digital-Team-DUC/RFM-System.git
cd RFM-System

# Copy environment template
cp .env.example .env
cp .env.example apps/backend/.env
```

### Step 2: Start Development Database Services
```bash
# Starts PostgreSQL (port 5432) and Redis (port 6379)
docker compose -f docker-compose.dev.yml up -d
```

### Step 3: Install Dependencies, Migrate & Seed
```bash
# Install all monorepo dependencies
npm install

# Build shared types package
npm run build --workspace=@rfm/shared

# Synchronize Prisma schema into PostgreSQL
npx prisma db push --schema=apps/backend/prisma/schema.prisma

# Seed realistic development data
npx ts-node apps/backend/prisma/seed.ts
```

### Step 4: Run the Application Locally
Open two terminal windows:

**Terminal 1 — Backend:**
```bash
npm run start --workspace=backend
# NestJS boots on http://localhost:4000/api/v1
# Swagger docs: http://localhost:4000/api/docs
```

**Terminal 2 — Frontend:**
```bash
npm run dev --workspace=frontend
# React Vite boots on http://localhost:3000
```

---

## 4. Production Docker Deployment

Deploy the entire stack with a single command:

```bash
docker compose up --build -d
```

Services started:
| Service | Container Name | Internal Port | Host Port | Role |
| :--- | :--- | :--- | :--- | :--- |
| **proxy** | `rfm_proxy` | 80 | **80** | Nginx reverse proxy routing API, WS & SPA |
| **frontend** | `rfm_frontend` | 80 | — | React production bundle served by Nginx |
| **backend** | `rfm_backend` | 4000 | 4000 | NestJS REST API & WebSocket server |
| **worker** | `rfm_worker` | — | — | Background queue processor |
| **database** | `rfm_postgres` | 5432 | 5432 | Persistent PostgreSQL 16 database |
| **redis** | `rfm_redis` | 6379 | 6379 | In-memory cache & job queue |

---

## 5. Pre-Configured Test Accounts

| Role | Email | Password | Access Scope |
| :--- | :--- | :--- | :--- |
| **Super Administrator** | `admin@rfm.com` | `Admin123!` | Complete unrestricted system access |
| **Sales Manager** | `sales.manager@rfm.com` | `Sales123!` | Bookings, discount approvals, CRM, contracts |
| **Sales Agent** | `agent1@rfm.com` | `Agent123!` | Leads, viewings, customer registrations, reservations |
| **Senior Accountant** | `accountant@rfm.com` | `Account123!` | General Ledger, Chart of Accounts, Statements, Payouts |
| **Head Cashier** | `cashier@rfm.com` | `Cashier123!` | Payment receipts, bank verification, payment vouchers |

---

## 6. Financial Correctness & Ledger Invariants

1. **Reconciled Installment Schedules**: Sum of all scheduled installment rows reconciles to the exact cent with contract consideration. Rounding variances are absorbed into the final installment.
2. **Double-Entry Balancing**: All posted journal entries require `Total Debits == Total Credits`. The system rejects any voucher with a balance discrepancy.
3. **Sequential Installment Allocation**: Customer payments are automatically allocated sequentially to the oldest outstanding installment before rolling over into future installments.
4. **Late Payment Penalties**: Penalties apply contract-defined grace periods (default: 7 days), daily percentage accrual (default: 0.05%), and maximum caps (default: 10%).
5. **Traceability**: Financial transactions cannot be deleted. Corrections require authorized reversal entries or documented credit notes.

---

## 7. Automated Test Suite

Run unit and integration tests:
```bash
npm run test --workspace=backend
```

Tests verify:
- Installment schedule reconciliation with zero cent drift
- Odd division rounding variance absorption in final milestone
- Penalty grace period compliance
- Penalty calculation post-grace period
- Maximum penalty cap enforcement
- Dual currency formatting (USD & KHR)
