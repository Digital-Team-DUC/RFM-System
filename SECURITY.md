# Security Policy & Access Control Architecture

## 1. Authentication & Session Management

- **Password Hashing**: Passwords are hashed using bcrypt with salt rounds configured to ensure high resistance against brute-force attacks.
- **JWT Access Tokens**: Stateless Bearer access tokens with short-lived expiration (15 minutes in production, 8 hours in development).
- **Refresh Token Rotation**: Refresh tokens are single-use, cryptographically hashed before database persistence, and rotated on every refresh. Revocation cascades immediately across all active user sessions.
- **Login Attempt Throttling**: All login attempts (successes and failures) are tracked in `login_events` with IP address, user agent, and failure reasons.

---

## 2. Role-Based Access Control (RBAC) & Granular Permissions

The backend enforces authorization at the controller and route level using `@RequirePermissions('...')` combined with `PermissionsGuard`.

### Permission Registry

| Domain | Permission Code | Description |
| :--- | :--- | :--- |
| **Properties** | `properties.read` | View properties, master plan geometry, and prices |
| | `properties.create` | Add property units, villas, and land plots |
| | `properties.update` | Update specifications and perform status transitions |
| | `properties.delete` | Delete property units |
| **Projects** | `projects.manage` | Create projects, assign managers, configure budgets |
| **CRM** | `crm.read` | View customer directory and leads pipeline |
| | `crm.manage` | Create customers, log activities, advance lead stages |
| **Sales** | `sales.create` | Initiate reservations and booking proposals |
| | `bookings.approve` | Authorize customer reservation holds |
| | `bookings.cancel` | Cancel reservations and release property units |
| **Contracts** | `contracts.manage` | Draft sales contracts and configure payment plans |
| | `contracts.approve` | Authorize binding contractual transfers |
| **Payments** | `payments.receive` | Record customer payments and generate receipts |
| | `payments.verify` | Confirm bank transaction slips and KHQR settlements |
| | `payments.refund` | Authorize customer refunds and payment reversals |
| **Commissions** | `commissions.manage` | Configure policies and calculate agent accruals |
| | `commissions.approve` | Authorize commission payouts |
| **Finance** | `expenses.create` | Submit expense vouchers and contractor invoices |
| | `expenses.approve` | Authorize expense disbursements |
| **Accounting** | `accounting.read` | Inspect Chart of Accounts and General Ledger |
| | `accounting.post` | Post balanced double-entry journal entries |
| | `accounting.close` | Close monthly and fiscal accounting periods |
| **Administration**| `users.manage` | Create, invite, and deactivate staff users |
| | `settings.manage` | Configure company settings and tax rates |
| | `audit.read` | Inspect immutable audit logs |

---

## 3. Financial Transaction Safety & Invariants

1. **Decimal-Safe Monetary Arithmetic**: Binary floating-point calculations (`0.1 + 0.2 != 0.3`) are strictly prohibited in the financial engine. All monetary logic uses decimal-safe precision.
2. **Double-Booking Concurrency Protection**: Property reservations use serializable database transactions (`prisma.$transaction`) with property status checks, ensuring that race conditions cannot reserve the same unit twice.
3. **Idempotency Safeguards**: Payment recording endpoints verify incoming transaction references (`transactionRef`) to prevent duplicate charge submissions on network retries.
4. **General Ledger Balancing**: Every posted journal entry requires `Total Debits == Total Credits`. The system rejects unbalanced adjustments.

---

## 4. Reporting Security Vulnerabilities

Please report any identified security vulnerabilities to the security engineering team:
- **Email**: `security@rfm-system.com`
- **PGP Key**: Fingerprint available upon request
