# Church Financier — Backend API Documentation

> Internal ledger / accounting system. The API does **not** process member payments via external gateways — member contributions (tithes, offerings, donations) are recorded manually or imported.

---

## 1. Server & Runtime Configuration

| Property | Value |
|---|---|
| **Base URL** | `http://localhost:3001/api` |
| **Port** | `3001` (configurable via `PORT` env var) |
| **Runtime** | Node.js with Express 5, TypeScript 7, TSX 4 |
| **CORS** | Enabled globally, `origin: true, credentials: true` |
| **Body Parsing** | `express.json()` middleware |
| **Compression** | gzip level 6, threshold 1024 bytes |
| **Cookie parser** | `cookie-parser` mounted (used for `cf_refresh` admin refresh cookie + `cf_portal` / `cf_portal_refresh` portal cookies) |
| **Trust Proxy** | Enabled (`app.set("trust proxy", true)`) |
| **Real-time** | Socket.IO server on the same HTTP instance, with JWT auth handshake and per-organization rooms |
| **BigInt serialisation** | JSON responses pass through `utils/serialize.ts`, which recursively converts `bigint` → `string` and `Date` → ISO string (Express 5 cannot natively serialise `bigint`) |
| **Schema freshness check** | On boot, the server probes `User.emailVerified`; if missing, a warning is printed telling the operator to run `npx prisma migrate deploy` |

### 1.1 Top-level mount tree

```
app
├── /api/health             → liveness probe (SELECT 1)
├── /api/ready              → readiness probe (database + Socket.IO)
├── /api                  → authRoutes (login, signup, register, forgot-password, reset-password, refresh, logout, me, mfa/*, change-password, verify-email)
├── /api/auth             → authRoutes (same router, mounted twice for compatibility)
├── /api/portal           → portalRoutes (separate, non-tenant-scoped member portal)
└── /api                  → apiRouter
                            ├── tenantScoped + requireOrganization   (every request past here is org-scoped)
                            ├── auditAction (auto on POST/PATCH/PUT/DELETE)
                            ├── /users, /funds, /ledger, /journals
                            ├── /disbursements, /reports, /pledges
                            ├── /contributions, /vendors, /departments
                            ├── /chart-of-accounts, /budgets
                            ├── /audit-logs, /members, /periods
                            ├── /import/members, /import/ledger, /import/chart-of-accounts
                            └── /portal/members/:id/portal-access    (admin-side portal enable/disable, auth + RBAC only)
```

---

## 2. Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `PORT` | No | `3001` | Server listening port |
| `NODE_ENV` | No | `development` | Environment mode |
| `JWT_SECRET` | Yes (production) | `fallback-secret` (dev only) | Secret used for both admin and portal JWTs. In `production`, the process exits if this is unset. |
| `JWT_EXPIRY` | No | `24h` | Admin access-token TTL |
| `DOTENV_PATH` | No | `.env` in cwd | Custom `.env` file path (loaded by `src/index.ts` via `dotenv`) |
| `SMTP_HOST` | For email delivery | — | SMTP host |
| `SMTP_PORT` | No | `587` | SMTP port (`465` is treated as implicit TLS) |
| `SMTP_USER` | For email delivery | — | SMTP username |
| `SMTP_PASS` | For email delivery | — | SMTP password |
| `SMTP_FROM` | For email delivery | — | Default `From:` address |
| `FRONTEND_URL` | No | `http://localhost:3000` | Base URL used to build password-reset and email-verification links |
| `S3_REGION` | For S3 storage | — | AWS region for S3 uploads |
| `S3_BUCKET` | For S3 storage | — | S3 bucket name |
| `S3_ACCESS_KEY_ID` | For S3 storage | — | AWS access key |
| `S3_SECRET_ACCESS_KEY` | For S3 storage | — | AWS secret key |
| `S3_ENDPOINT` | No | — | Optional custom endpoint (S3-compatible services) |
| `STORAGE_LOCAL_DIR` | No | `./storage` | Local fallback directory when S3 is not configured |
| `IDEMPOTENCY_WINDOW_HOURS` | No | `24` | How long a processed `X-Idempotency-Key` stays replayable (see §7.1) |

If `SMTP_*` is not set, `mailerService.send()` falls back to console logging (the email payload is printed with an `[email:console]` marker) — useful for local dev and tests.

### 2.1 Runtime environment validation

On startup, `src/config/env.ts` validates required variables with Zod. The process exits immediately if:

- `DATABASE_URL` is missing
- `JWT_SECRET` is shorter than 32 characters (hard requirement in production)

Optional SMTP and storage variables are not fatal if absent.

### 2.2 Database seeding

When a new organization is created via `register` or `registerChurch`, the backend automatically seeds:

- A standard **Chart of Accounts** with six baseline accounts:
  - `1000` Cash/Bank (ASSET)
  - `1100` Accounts Receivable (ASSET)
  - `2000` Accounts Payable (LIABILITY)
  - `3000` Equity (EQUITY)
  - `4000` Income (INCOME)
  - `5000` Expenses (EXPENSE)
- Three **default funds**: General Fund, Building Fund, Welfare Fund

Seeding is idempotent — it skips organizations that already have accounts.

For manual seeding, use:
```
npx tsx prisma/seed.ts <organizationId>
```

---

## 3. Dependencies

| Package | Version | Purpose |
|---|---|---|
| `@prisma/client` | ^6.19.3 | ORM / database client |
| `bcryptjs` | ^3.0.3 | Password hashing (cost factor **12**) |
| `compression` | ^1.8.1 | Gzip response compression |
| `cookie-parser` | ^1.4.7 | Parse `cf_refresh`, `cf_portal*` cookies |
| `cors` | ^2.8.6 | Cross-origin resource sharing |
| `dotenv` | ^17.4.2 | `.env` loader (also picked up by `prisma.config.ts`) |
| `exceljs` | ^4.4.0 | XLSX report generation |
| `express` | ^5.2.1 | HTTP server framework |
| `express-rate-limit` | ^7.5.1 | Rate limiting (`authLimiter` on `/api/auth/*`, `apiLimiter` on `/api/*`) |
| `helmet` | ^8.3.0 | Security headers |
| `jsonwebtoken` | ^9.0.3 | JWT signing / verification (admin + portal tokens) |
| `multer` | ^1.4.5 | Multipart file upload for bulk import endpoints |
| `nodemailer` | ^9.1.1 | SMTP transport (with console fallback) |
| `pdfkit` | ^0.15.0 | PDF generation (donor receipts + report export) |
| `@aws-sdk/client-s3` | ^3.1126.0 | S3 file storage for receipts and exports |
| `socket.io` | ^4.8.3 | Real-time events |
| `zod` | ^4.4.3 | Request body / query schema validation + env validation |
| `prisma` | ^6.19.3 (dev) | Prisma CLI |
| `tsx` | ^4.23.9 (dev) | TypeScript execution for `dev` script |
| `@types/multer` | ^1.4.11 (dev) | TypeScript types for multer |
| `typescript` | ^7.0.2 (dev) | TS compiler |
| `vitest` | ^2.1.0 (dev) | Test runner |

`express-mongo-sanitize` and `xss-clean` are **not** currently used.

---

## 4. Database Schema (Prisma)

PostgreSQL via `@prisma/client` 6.19.3. `prisma.config.ts` is the new-style Prisma config (uses `defineConfig` + `env("DATABASE_URL")`); migrations live in `prisma/migrations/`.

### 4.1 Migration history

| Migration | Purpose |
|---|---|
| `20260816221519_init` | Initial schema (Organization, User, Fund, LedgerEntry, DisbursementRequest, AuditLog, ChartOfAccounts, JournalEntry, JournalLine, Pledge, Department, Budget, Vendor, Period, PaymentGateway) |
| `20260817001347_use_bigint_for_monetary_fields` | Switches monetary columns from `INTEGER` to `BIGINT` |
| `20260901_complete_feature_set` | Adds `DisbursementLineItem`, `Member`, `PledgeContribution`, `PasswordResetToken`, `EmailVerificationToken`, `MfaChallenge`; adds `emailVerified` to `User`; adds `reversedById` to `LedgerEntry`; extends `DisbursementStatus` to include `FIRST_APPROVED` and `PAID`; converts org-scoped uniques on `ChartOfAccounts.code`, `Department.name`, `Vendor.name` to compound indexes; adds `organizationId` to `AuditLog` and `Period` (backfilled from the acting user) |
| `20260903_remove_payment_gateway` | Drops the `PaymentGateway` table and the `PaymentProvider` enum (Paystack/Flutterwave/Stripe removed — app is an internal ledger only) |
| `20261002000000_add_idempotency_keys` | Adds the `IdempotencyKey` table used to replay `X-Idempotency-Key` responses instead of re-executing a financial write (see §7.2) |

### 4.2 Enums

- **`Role`** — `SUPER_ADMIN`, `TREASURER`, `FINANCIAL_SECRETARY`, `AUDITOR`, `DEPARTMENT_HEAD`
- **`TransactionType`** — `DONATION`, `EXPENSE`, `TRANSFER`, `REVERSAL`
- **`AccountType`** — `ASSET`, `LIABILITY`, `EQUITY`, `INCOME`, `EXPENSE`
- **`PledgeStatus`** — `ACTIVE`, `COMPLETED`, `CANCELLED`
- **`DisbursementStatus`** — `PENDING`, `FIRST_APPROVED`, `APPROVED`, `REJECTED`, `PAID`
- **`JournalStatus`** — `DRAFT`, `POSTED`, `REVERSED`

`PaymentProvider` is **gone** (removed in migration `20260903_remove_payment_gateway`).

### 4.3 Models

The current schema has 22 models. Each model below lists every persisted column (camelCase) plus its key relations. All `organizationId` columns are `String` and `Cascade` on delete from `Organization`.

| Model | Key columns | Notes |
|---|---|---|
| `Organization` | `id`, `name`, `createdAt` | Tenant root; cascades delete to all children |
| `User` | `id`, `organizationId`, `email` (unique), `password` (bcrypt), `name`, `role`, `mfaEnabled`, `mfaSecret`, `emailVerified`, `createdAt`, `updatedAt` | Email is globally unique. `password` is `bcrypt` hashed at cost 12. |
| `Fund` | `id`, `organizationId`, `name`, `description?`, `isRestricted`, `createdAt` | Unique on `(name, organizationId)` |
| `LedgerEntry` | `id`, `organizationId`, `fundId`, `type`, `amountInKobo` (BigInt), `description`, `recordedById`, `createdAt`, `journalId?`, `reversedById?` (unique) | Self-relation `reversalOf ↔ reversals` for reversal pairs |
| `DisbursementRequest` | `id`, `organizationId`, `amountInKobo`, `purpose`, `requestedById`, `approvedById?`, `firstApprovedById?`, `secondApprovedById?`, `vendorId?`, `departmentId?`, `status`, `paymentMethod?`, `paidAt?`, `paymentReference?`, `paymentNotes?`, `createdAt`, `updatedAt` | Dual-approval workflow |
| `DisbursementLineItem` | `id`, `organizationId`, `disbursementId`, `description`, `amountInKobo`, `receiptUrl?`, `createdAt` | Per-line breakdown; total must match header |
| `AuditLog` | `id`, `organizationId`, `userId`, `action`, `details` (Json), `ipAddress?`, `createdAt` | `details` includes auto-generated `description` |
| `ChartOfAccounts` | `id`, `organizationId`, `code`, `name`, `type`, `parentId?`, `isActive`, `createdAt` | Unique on `(code, organizationId)`; self-relation for hierarchy |
| `JournalEntry` | `id`, `organizationId`, `date`, `description`, `reference?`, `createdById`, `createdAt`, `status` | Posted by default; can be reversed |
| `JournalLine` | `id`, `journalEntryId`, `accountId`, `description?`, `debitInKobo` (default 0), `creditInKobo` (default 0), `createdAt` | Linked to `ChartOfAccounts` |
| `Pledge` | `id`, `organizationId`, `memberId?` (nullable), `memberName`, `fundId`, `amountInKobo`, `startDate?`, `endDate?`, `recurring`, `status`, `createdAt` | `memberId` made nullable in `20260901_complete_feature_set`; free-text `memberName` retained |
| `PledgeContribution` | `id`, `organizationId`, `pledgeId`, `ledgerEntryId`, `amountInKobo`, `recordedById`, `createdAt` | Links a `LedgerEntry` to a `Pledge` |
| `Member` | `id`, `organizationId`, `fullName`, `email?`, `phone?`, `address?`, `memberNumber?`, `joinedAt`, `isActive`, `portalAccess`, `portalPasswordHash?`, `createdAt` | Unique on `(email, organizationId)`; portal access is gated by `portalAccess` + `portalPasswordHash` |
| `Department` | `id`, `organizationId`, `name`, `description?`, `headId`, `createdAt` | Unique on `(name, organizationId)`; `headId` → `User` |
| `Budget` | `id`, `organizationId`, `departmentId`, `fundId`, `fiscalYear`, `month`, `amountInKobo`, `createdAt` | Unique on `(departmentId, fundId, fiscalYear, month)` |
| `Vendor` | `id`, `organizationId`, `name`, `email?`, `phone?`, `address?`, `createdAt` | Unique on `(name, organizationId)` |
| `Period` | `id`, `organizationId`, `fiscalYear`, `month`, `isLocked`, `lockedById?`, `lockedAt?`, `createdAt` | Unique on `(organizationId, fiscalYear, month)`; `lockPeriod` is upsert-based |
| `PasswordResetToken` | `id`, `userId`, `tokenHash` (unique), `expiresAt`, `usedAt?`, `createdAt` | Plain-text token never stored; only SHA-256 hash |
| `EmailVerificationToken` | `id`, `userId`, `tokenHash` (unique), `expiresAt`, `usedAt?`, `createdAt` | Same scheme as reset tokens |
| `MfaChallenge` | `id`, `userId`, `code`, `expiresAt`, `usedAt?`, `createdAt` | 6-digit code, 10-minute TTL |
| `RefreshToken` | `id`, `userId`, `tokenHash` (unique), `expiresAt`, `revokedAt?`, `replacedBy?`, `userAgent?`, `ipAddress?`, `createdAt` | Opaque 48-byte tokens; rotated on every refresh |
| `IdempotencyKey` | `id`, `organizationId`, `key`, `userId`, `endpoint`, `requestHash`, `responseStatus?`, `responseBody?` (Json), `expiresAt`, `createdAt`, `updatedAt` | Replay cache for `X-Idempotency-Key`; unique on `(organizationId, key)`. `responseStatus` NULL means "in flight". See §7.1. |

### 4.4 Models intentionally **not** present

- `PaymentGateway` — removed in `20260903_remove_payment_gateway`.
- `PaymentProvider` enum — removed in the same migration.
- `Plan`, `OrganizationSubscription`, `Subscription` — no SaaS billing models exist yet; multi-tenant isolation is achieved by `organizationId` on every model.

---

## 5. Authentication & Authorization

The API exposes **two independent auth systems**: the admin app (treasurers, super admins, etc.) and the member portal (church members viewing their own data). Both use JWTs signed with `JWT_SECRET`.

### 5.1 Admin app auth

- **Bearer JWT** in the `Authorization` header. Signed with `HS256`, default expiry `24h` (`JWT_EXPIRY`). Payload: `{ id, email, role, organizationId, organizationName }`.
- **Refresh tokens** are **opaque**, server-generated 48-byte base64url strings stored as SHA-256 hashes in `RefreshToken`. The plain-text token is sent to the client via the `cf_refresh` httpOnly cookie (and additionally returned in the JSON body for clients that prefer to manage it themselves). On every refresh the token is **rotated** (old token marked `revokedAt`; new token issued). 30-day TTL.
- **MFA** is per-user and email-delivered. On sign-in, if `User.mfaEnabled` is true the server creates an `MfaChallenge` (6-digit code, 10-minute TTL) and emails it. The client then calls `POST /api/auth/login/mfa` with `{ userId, code }` to obtain the session. MFA is **not** TOTP — it is a one-time emailed code.
- **Email verification** tokens (24-hour TTL) and **password-reset** tokens (1-hour TTL) follow the same pattern: opaque token, SHA-256 hash stored, plain token delivered via email link.
- **Password hashing**: `bcrypt` at cost **12** for both admin and portal passwords.

#### 5.1.1 Admin auth endpoints (`/api/auth/*`)

| Method | Path | Auth | Body / Query | Notes |
|---|---|---|---|---|
| `POST` | `/api/auth/login` | public | `{ email, password }` | Returns `{ token, refreshToken, refreshExpiresAt, user }` on success, or `{ mfaRequired: true, userId }` if MFA is enabled. |
| `POST` | `/api/auth/login/mfa` | public | `{ userId, code }` | Intended to consume an MFA challenge and issue the normal token pair. Current `mfaVerifySchema` only preserves `code`, so `userId` is stripped before the controller and this flow can fail. |
| `POST` | `/api/auth/signup` | public | `{ email, password, name, role? }` | Creates a new user (legacy path). Auto-creates a default `Organization` if no `organizationId` is supplied. Sends a verification email. |
| `POST` | `/api/auth/register` | public | `{ churchName, adminName, email, password }` | Multi-tenant onboarding: creates the `Organization` + `SUPER_ADMIN` user + 3 default funds (General, Building, Welfare). |
| `POST` | `/api/auth/logout` | bearer | — | Revokes the presented refresh token (if any), revokes all refresh tokens for the user, and clears the cookie. |
| `POST` | `/api/auth/refresh` | public (cookie) | — | Rotates the refresh token from the `cf_refresh` cookie; returns a fresh token pair. |
| `GET` | `/api/auth/me` | bearer | — | Returns the full `User` (includes `mfaEnabled`, `emailVerified`). |
| `PATCH` | `/api/auth/me` | bearer | `{ name?, email? }` | Updates profile. Changing the email marks it as unverified. |
| `POST` | `/api/auth/change-password` | bearer | `{ currentPassword, newPassword }` | Verifies the current password, hashes the new one, logs the change. |
| `POST` | `/api/auth/forgot-password` | public | `{ email }` | Always responds 200 (no account-enumeration leak). Emails a reset link if the address exists. |
| `POST` | `/api/auth/reset-password` | public | `{ token, newPassword }` | Consumes the reset token and updates the password. |
| `POST` | `/api/auth/verify-email` | public | `{ token }` | Consumes the email verification token and sets `emailVerified = true`. The frontend exposes `/verify-email?token=…` which calls this endpoint. |
| `POST` | `/api/auth/mfa/enable` | bearer | — | Sets `mfaEnabled = true` + a random `mfaSecret`. |
| `POST` | `/api/auth/mfa/disable` | bearer | — | Disables MFA and clears the secret. |

### 5.2 Member portal auth

- **Two JWTs** are issued at login: a 7-day access token (`type: "member-portal"`) and a 30-day refresh token (`type: "member-portal-refresh"`). Both are signed with the same `JWT_SECRET`. The refresh endpoint rotates the cookies but does not return the new tokens in its JSON response.
- The access token is delivered **both** as a JSON body and as the `cf_portal` httpOnly cookie. The refresh token is delivered as the `cf_portal_refresh` httpOnly cookie.
- `portalAuthenticate` middleware accepts the token from either `Authorization: Bearer …` or the `cf_portal` cookie. It validates the token, the member's `portalAccess` flag, and that the token's `email` still matches `Member.email` (so an admin disabling portal access invalidates outstanding tokens).
- **Portal access** is gated by `Member.portalAccess = true` AND `Member.portalPasswordHash != null`. Admins enable it via `POST /api/portal/members/:id/portal-access`; an initial password is either supplied or auto-generated, hashed, and emailed.

#### 5.2.1 Member portal endpoints (`/api/portal/*`)

| Method | Path | Auth | Body | Notes |
|---|---|---|---|---|
| `POST` | `/api/portal/login` | public | `{ email, password }` | Returns `{ token, member }`; sets `cf_portal` + `cf_portal_refresh` cookies |
| `POST` | `/api/portal/refresh` | public (cookie) | — | Reads `cf_portal_refresh`, rotates the portal cookies, and returns `{ ok: true }` rather than the tokens in JSON |
| `POST` | `/api/portal/logout` | public | — | Clears both cookies |
| `POST` | `/api/portal/forgot-password` | public | `{ email }` | Generates a temporary password, hashes + saves it, emails it. Always 200. |
| `GET` | `/api/portal/me` | portal | — | Returns the current `PortalMember` (id, fullName, email, memberNumber, organizationId, organizationName) |
| `GET` | `/api/portal/summary` | portal | — | Returns `{ summary, pledges, donations }` (see below) |
| `POST` | `/api/portal/change-password` | portal | `{ currentPassword, newPassword }` | Updates `Member.portalPasswordHash` |
| `POST` | `/api/portal/members/:id/portal-access` | admin (bearer) + `member:update` RBAC | `{ enabled, password? }` | Admin-side endpoint to enable / disable portal access. If enabling, generates + emails an initial password (uses supplied one if ≥ 6 chars). |

`/api/portal/summary` returns:
```json
{
  "summary": {
    "totalDonated": "<kobo>",
    "totalPledged": "<kobo>",
    "totalFulfilled": "<kobo>",
    "activePledges": 0,
    "donationCount": 0
  },
  "pledges":  [{ "id", "fundName", "amountInKobo", "fulfilledInKobo", "remainingInKobo", "status", "progress", "startDate", "endDate" }],
  "donations": [{ "id", "fundName", "amountInKobo", "date", "description" }]
}
```
Donations are filtered by `description CONTAINS member.fullName` (best-effort since contributions are recorded with a free-text description).

### 5.3 Role-based authorization

The admin app enforces authorization at **two levels**:

1. **Role gate** — `requireRole("SUPER_ADMIN", "TREASURER", "AUDITOR")` (used by `periodRoutes`).
2. **Permission gate** — `checkPermission("fund:create")` etc. (used by every other resource route). Permission strings are derived from a static `PERMISSIONS` map in `rbacMiddleware.ts`.

`TenantRequest` and `tenantScoped` middleware extract `req.user` and `req.organizationId` from the bearer JWT. Every admin route (except `/api/auth/*` and `/api/portal/*`) is mounted under `apiRouter` which applies `tenantScoped` + `requireOrganization` first, so handlers can rely on `req.user.organizationId` always being present.

#### 5.3.1 Role-to-permission matrix

| Role | Permissions |
|---|---|
| `SUPER_ADMIN` | All permissions including `user:manage`, full CRUD on every resource, `member:update`, full `budget:*` |
| `TREASURER` | Full CRUD on the financial and directory modules: `chart-of-accounts:create/read/update/delete`, `contribution:read/batch/create/update/delete/receipt`, `vendor:create/read/update/delete`, `member:create/read/update/delete`, `disbursement:create/read/approve/reject`, `pledge:create/read/update/delete`, `budget:create/read/update/delete`, `fund:create/read/update/delete`; plus the supporting reads `ledger:read`, `report:read`, `report:export`, `department:read`. No `user:manage`, no `audit:read`, no `ledger:create` / `ledger:reverse`, and no `department:create/update/delete` |
| `FINANCIAL_SECRETARY` | `member:create/read/update/delete`, `contribution:read/create/update/delete/receipt`, `pledge:create/read/update/delete`, `vendor:read`, `report:income`; no fund balances, budgets, ledger, disbursement, user, or audit access |
| `AUDITOR` | `fund:read`, `ledger:read`, `disbursement:read`, `report:export/read`, `member:read`, `contribution:read`, `pledge:read`, `chart-of-accounts:read`, `budget:read`, `vendor:read`, `department:read`, `audit:read` |
| `DEPARTMENT_HEAD` | `disbursement:create`, `disbursement:read`, `budget:read`, `report:read`, `department:read` |

In addition, `DEPARTMENT_HEAD` users:
- Have **no** `vendor:read` permission — vendor data is inaccessible.
- Have their `disbursement:read` queries **automatically scoped** to departments where they are `headId` (see `disbursementService.getDepartmentScopedRequests`).
- Have their `department:read` queries **automatically scoped** to their own department only (see `departmentService.listForHead`).
- Can **not** perform the first approval on disbursements — only `SUPER_ADMIN` and `TREASURER` hold `disbursement:approve` (see §9.5).
- Can perform the second approval jointly with `TREASURER`.

---

## 6. Multi-Tenancy

- Every admin `User` carries `organizationId` in the JWT and the `User` row. Every org-scoped model has an `organizationId` column with `onDelete: Cascade` to `Organization`.
- `tenantScoped` provides a central organization context, but query isolation is enforced mainly by explicit `organizationId` conditions in services. Most services scope their queries correctly; some related-record inputs are not independently checked for tenant ownership (see §18).
- The `Period`, `AuditLog`, `ChartOfAccounts`, `Department`, `Vendor` models were retrofitted with `organizationId` in the `20260901_complete_feature_set` migration. `AuditLog.organizationId` is **backfilled from the acting user** at migration time.
- Compound unique constraints (`(name, organizationId)`, `(code, organizationId)`, etc.) replace the old single-column uniques so two tenants can use the same code/name.
- Signing out does **not** delete the organization; organisations are removed only by manual database operation.

---

## 7. Middleware Pipeline

| Middleware | Where | Purpose |
|---|---|---|
| `helmet()` | global | Security headers |
| `cors({ origin: true, credentials: true })` | global | Permissive CORS for dev / SPA |
| `express.json()` | global | JSON body parsing |
| `cookieParser()` | global | Read `cf_refresh`, `cf_portal*` |
| `compression({ level: 6, threshold: 1024 })` | global | Gzip responses |
| `serializeResponse` res.json override | global | BigInt → string, Date → ISO string |
| `tenantScoped` | `/api/*` (after auth) | Verifies JWT, sets `req.user` + `req.organizationId` |
| `requireOrganization` | `/api/*` | Asserts `req.organizationId` is set |
| `auditAction(label)` | `/api/*` mutating routes | Auto-logs success responses with `action = "<METHOD> /<resource>"` and includes sanitised body, status code, duration, and any entity id found in the response |
| `validateBody(schema)` / `validateQuery(schema)` | per-route | Zod-validated body / query |
| `checkPermission(perm)` | per-route | RBAC permission gate |
| `requireRole(...roles)` | per-route | RBAC role gate (used by `periodRoutes`, disbursement approval stages) |
| `requireIdempotencyKey()` | contributions, disbursements, ledger, journals routers | Requires an `X-Idempotency-Key` on `POST`/`PUT`/`PATCH` and replays a duplicate request's cached response instead of re-executing it (see §7.1) |
| `authenticate` | auth route guards | Verifies JWT for `/api/auth/*` user-scoped routes |
| `portalAuthenticate` | portal route guards | Verifies portal JWT (cookie or bearer) and that portal access is still active |
| `errorHandler` | global last | Maps `AppError` / `ZodError` / known Prisma errors to 400/409/422 responses, otherwise 500. Hides internal messages outside dev. |

`apiLimiter` and `authLimiter` are defined in `rateLimiter.ts` but **not** mounted in `index.ts` (rate limiting is currently disabled). They are exported for future use:

```ts
authLimiter  // 10 req / 15 min
apiLimiter   // 100 req / min
```

### 7.1 Idempotency & duplicate-request prevention

`requireIdempotencyKey()` (in `idempotencyMiddleware.ts`) is mounted on the state-changing financial routers: **`/api/contributions`, `/api/disbursements`, `/api/ledger`, `/api/journals`**. It applies to `POST`, `PUT` and `PATCH` only, so reads are unaffected.

Protocol:

1. The client sends `X-Idempotency-Key: <UUID v4>`, minted **once per form submission**. A retry of that same submission reuses the key.
2. Missing or malformed header → `400` with `code: "IDEMPOTENCY_KEY_REQUIRED"` / `IDEMPOTENCY_KEY_INVALID`.
3. The middleware fingerprints the request (`hashRequest`: SHA-256 over method + path + key-order-independent JSON body) and tries to insert an `IdempotencyKey` row (`unique(organizationId, key)`):
   - **insert succeeds** → the request owns the key and executes normally; its response body and status are stored on completion (`complete`).
   - **unique violation + stored response** → the request is **replayed**: the cached status and body are returned verbatim with the `Idempotency-Replayed: true` header, and no transaction runs again.
   - **unique violation + no response yet** → the original is still in flight (a double-click). The duplicate waits up to ~2s (`waitForCompletion`) and then replays the cached response, or returns `409 IDEMPOTENCY_KEY_IN_PROGRESS`.
   - **unique violation + different `requestHash`** → `409 IDEMPOTENCY_KEY_REUSE` (a key must never be reused for a different payload).
   - **unique violation + `expiresAt` in the past** → the stale row is dropped and the key is treated as new.
4. A request that ends in a `4xx`/`5xx` **releases** the key instead of caching it, so the client can fix the cause and retry the same logical operation. Only `2xx`/`3xx` responses are replayable.
5. Expired rows are purged on boot and every 6 hours (`idempotencyService.purgeExpired`). The replay window defaults to 24h and is overridable with `IDEMPOTENCY_WINDOW_HOURS`.

`DELETE /api/contributions/:id` is intentionally not key-protected: it is a reversal, and it is already single-shot by construction — the `LedgerEntry.reversedById` column is unique and the service links it with a conditional `updateMany`, so a second reversal of the same entry is rejected.

### 7.2 Transaction isolation, row locking and state guards

| Concern | Mechanism |
|---|---|
| Duplicate execution of a money movement | `X-Idempotency-Key` replay (§7.1) |
| Concurrent edits of the same row | `SELECT ... FOR UPDATE` row lock inside a `SERIALIZABLE` transaction |
| Lost updates on balances / totals | `updateMany` with the expected value in `where`; `count !== 1` is reported as a conflict |
| Illegal orderings | `disbursementState.canTransitionDisbursement` (see §10.3) |

Where the locks are taken:

- **Disbursements** (`disbursementService`): `lockDisbursementForUpdate` locks the `DisbursementRequest` row before any status change. `markPaid` performs the status flip, the `DISBURSEMENT_PAID` audit row and the expense `JournalEntry` in one transaction, so a payout can never be recorded without its double entry.
- **Contributions** (`contributionService`): `lockPledgeForUpdate` locks the `Pledge` row before its running total is read, so concurrent fulfilments cannot leave a pledge short. `createSingle` and `batchCreate` post the income `JournalEntry` inside the same `SERIALIZABLE` transaction as the `LedgerEntry`; a batch locks all of its pledges up front in sorted order to avoid deadlocks.
- **Journals** (`journalService`): every posting locks the touched `ChartOfAccounts` rows `FOR UPDATE` (also blocking a concurrent edit/deactivation of the account) and rejects posting to an inactive account. `reverseEntry` locks the journal row and flips `POSTED → REVERSED` conditionally.
- **Ledger** (`ledgerService`): `createEntry` locks the `Period` row before reading `isLocked`, so a post racing a period close either sees the closed period and is refused or completes first. `reverseEntry` locks the ledger row and links the reversal conditionally.
- **Chart of accounts** (`chartOfAccountsService.update`): re-parenting rejects a self-parent or a parent that is one of the account's own descendants.

Violations surface as `AppError`s (`utils/appError.ts`) with meaningful statuses — `409` for a terminal state or a concurrent update, `422` for a rejected transition — instead of a generic `500`.

### 7.3 Audit logging behaviour
- The `auditAction` wrapper intercepts `res.json` and, on a 2xx/3xx response with a present `req.user`, builds an `AuditLog` row containing:
  - `userId`, `organizationId` (from the JWT)
  - `action` = `"<METHOD> /<resource>"` where `<resource>` is the first path segment after `/api/`
  - `details`: `{ method, path, body (sanitised), statusCode, durationMs, entityId? }`
  - `ipAddress` from `getClientIp()` (honours `X-Forwarded-For`, then `req.socket.remoteAddress`)
- The `entityId` is extracted by trying in order: `body.id`, `body.entityId`, `body.data.id`, `body.budget.id`, `body.fund.id`, `body.member.id`, `body.user.id`, `body.request.id`, `body.entry.id`.
- A separate `description` is generated by `auditService.generateDescription` based on the action and details — for HTTP logs it produces strings like `"Created Fund: Grace Building Fund"`, `"Marked as paid Disbursement Request"`, or `"Batch created 12 contribution(s) totaling ₦48,000.00"`. For entity-style logs it uses `CREATE_*` / `UPDATE_*` / `DELETE_*` / `VOID_*` actions. For period locks it produces `"Locked fiscal year 2026, month 9"`.

---

## 8. Real-time (Socket.IO)

- A single Socket.IO server is attached to the same HTTP instance as Express. CORS is permissive (`origin: true, methods: ["GET", "POST"]`).
- **Auth handshake**: every connection must present a JWT in `socket.handshake.auth.token`. The handler verifies it with the same secret and, if valid, stores the user info and automatically joins the room `org:<organizationId>`.
- **Per-org broadcast**: `emitToOrganization(organizationId, event, payload)` writes to `io.to(`org:${organizationId}`).emit(event, serializeResponse(payload))`. This is the only entry point used by services.
- **Events emitted**:

| Event | Source | Payload shape |
|---|---|---|
| `disbursement:approval_requested` | `disbursementService.createRequest` | `{ request }` |
| `disbursement:first_approved` | `disbursementService.firstApprove` | `{ request }` |
| `disbursement:approved` | `disbursementService.secondApprove` | `{ request }` |
| `disbursement:rejected` | `disbursementService.rejectRequest` | `{ request }` |
| `disbursement:paid` | `disbursementService.markPaid` | `{ request }` |
| `contribution:created` | `contributionService.createSingle` / `batchCreate` | `{ entries, count }` |
| `ledger:created` | (reserved / future) | — |
| `journal:created` | `journalService.create` | `{ journal }` |

- The frontend listens for these in `SocketToasts.tsx` and converts them to `app:toast` CustomEvents.
- Connection / disconnect are logged with the socket id and organisation.

---

## 9. Resource Routes

All admin resource routes are mounted under `/api/*` (after `tenantScoped + requireOrganization` + auto-audit). The route map below mirrors `src/index.ts` exactly.

### 9.1 Users (`/api/users` — `user:manage`)

| Method | Path | Notes |
|---|---|---|
| `GET` | `/api/users` | `paginationQuerySchema` → `paginatedResponse`. List org users. |
| `POST` | `/api/users` | Create user with `signupSchema` (email + password + name + role). |
| `PATCH` | `/api/users/:id/role` | Update role via `updateRoleSchema`. |
| `DELETE` | `/api/users/:id` | Remove a user. |

### 9.2 Funds (`/api/funds`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/funds`, `/api/funds/:id` | `fund:read` |
| `POST` | `/api/funds` | `fund:create` |
| `PATCH` | `/api/funds/:id` | `fund:update` |
| `DELETE` | `/api/funds/:id` | `fund:delete` |

### 9.3 Ledger (`/api/ledger`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/ledger`, `/api/ledger/:id` | `ledger:read` |
| `POST` | `/api/ledger` | `ledger:create` (body: `fundId`, `type`, `amountInKobo`, `description`, optional `memberId`) — requires `X-Idempotency-Key` |
| `PATCH` | `/api/ledger/:id/reverse` | `ledger:reverse` (body: `reversalReason`) — requires `X-Idempotency-Key` |

### 9.4 Journal Entries (`/api/journals`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/journals` | `ledger:read` |
| `POST` | `/api/journals` | `ledger:create` (body: `description`, `reference?`, `date?`, `lines[]` — at least 2 lines) — requires `X-Idempotency-Key` |
| `PATCH` | `/api/journals/:id/reverse` | `ledger:reverse` (body: `reason`) — requires `X-Idempotency-Key` |

### 9.5 Disbursements (`/api/disbursements`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/disbursements` | `disbursement:read` (auto-scoped for `DEPARTMENT_HEAD`) |
| `GET` | `/api/disbursements/:id` | `disbursement:read` |
| `POST` | `/api/disbursements` | `disbursement:create` (body: `amountInKobo`, `purpose`, optional `vendorId`, `departmentId`, `lineItems[]`) — requires `X-Idempotency-Key` |
| `PATCH` | `/api/disbursements/:id/first-approve` | `requireRole("SUPER_ADMIN", "TREASURER")` + `disbursement:approve` — requires `X-Idempotency-Key` |
| `PATCH` | `/api/disbursements/:id/second-approve` | `requireRole("SUPER_ADMIN", "TREASURER")` + `disbursement:approve` — requires `X-Idempotency-Key` |
| `PATCH` | `/api/disbursements/:id/reject` | `disbursement:reject` (body: `reason?`) — requires `X-Idempotency-Key` |
| `PATCH` | `/api/disbursements/:id/mark-paid` | `requireRole("SUPER_ADMIN", "TREASURER")` + `disbursement:approve` (body: `paymentMethod`, optional `paymentReference`, `paymentNotes`) — requires `X-Idempotency-Key` |
| `PATCH` | `/api/disbursements/:id/cancel` | `requireRole("SUPER_ADMIN")` + `disbursement:reject` (body: `reason?`) — cancellation / storno stays a super-admin action, even though `TREASURER` holds `disbursement:reject` — requires `X-Idempotency-Key` |

Rules enforced in the service layer:
- The **first approval** (`first-approve`) is restricted to `SUPER_ADMIN` and `TREASURER` by `requireRole`; every other status endpoint additionally uses `checkPermission(...)`.
- The **second approval** (`second-approve`) and **payout** (`mark-paid`) are also `requireRole("SUPER_ADMIN", "TREASURER")`.
- A requester cannot approve their own request.
- The first and second approver must be different people (the one exception being a requisition an elevated role raised itself, which is auto-first-approved at creation — see §10.3).
- `markPaid` only accepts requests already in `APPROVED` status.
- `reject` is only allowed on `PENDING` or `FIRST_APPROVED` requests; an already-approved or paid request is cancelled instead.
- `lineItems` total (if any) must equal the header `amountInKobo`.
- When an **org-level** expense (no `departmentId`) is created by a `SUPER_ADMIN` or `TREASURER`, the status is auto-set to `FIRST_APPROVED` and the `disbursement:first_approved` Socket.IO event is emitted.
- Every status change runs in a `SERIALIZABLE` transaction that locks the requisition row `FOR UPDATE` and applies a conditional `updateMany` on the expected status, so concurrent clicks cannot both succeed (see §7.2).

`paymentMethod` is a free-text field (intended values: `BANK_TRANSFER`, `CASH`, `CHEQUE`, `POS`). `paymentReference` and `paymentNotes` are for the manual slip / cheque / reference number — **never** a gateway id.

### 9.6 Reports (`/api/reports`)

| Method | Path | Permission | Notes |
|---|---|---|---|
| `GET` | `/api/reports/balance-sheet` | `report:read` | `endDate?` |
| `GET` | `/api/reports/statement-of-activities` | `report:read` | `startDate?`, `endDate?` |
| `GET` | `/api/reports/budget-vs-actual` | `report:read` | `departmentId?` |
| `GET` | `/api/reports/trial-balance` | `report:read` | `startDate?`, `endDate?` |
| `GET` | `/api/reports/cash-flow` | `report:read` | `startDate?`, `endDate?` |
| `GET` | `/api/reports/export` | `report:export` | `reportType`, `format` (`CSV`/`XLSX`/`PDF`), filters; returns a file |
| `GET` | `/api/reports/metrics` | `report:read` | `{ totalFunds, totalContributions, totalExpenses, netIncome, pendingDisbursements, recentLedger, recentContributions, activePledges, totalPledged, totalPledgeReceived, outstandingPledges, memberCount }` — used by role-specific dashboards |

`export` produces a file download (`Content-Disposition: attachment`) of the chosen report, with monetary values formatted in Naira (not Kobo) inside the file. The trial balance and statement of activities use the same data sources as their on-screen counterparts.

### 9.7 Pledges (`/api/pledges`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/pledges`, `/api/pledges/:id`, `/api/pledges/:id/progress` | `pledge:read` |
| `POST` | `/api/pledges` | `pledge:create` |
| `PATCH` | `/api/pledges/:id` | `pledge:update` |
| `PATCH` | `/api/pledges/:id/cancel` | `pledge:update` |

When a `LedgerEntry` is created via the contribution batch for a `pledgeId`, a `PledgeContribution` row is written and the pledge is auto-marked `COMPLETED` once `SUM(amountInKobo) >= pledge.amountInKobo`.

### 9.8 Contributions (`/api/contributions`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/contributions` | `contribution:read` |
| `GET` | `/api/contributions/:id` | `contribution:read` |
| `POST` | `/api/contributions` | `contribution:batch` — single entry (`singleContributionSchema`) — requires `X-Idempotency-Key` |
| `POST` | `/api/contributions/batch` | `contribution:batch` — atomic batch (`batchEntrySchema`) — requires `X-Idempotency-Key` |
| `GET` | `/api/contributions/:id/receipt` | `contribution:receipt` — JSON receipt data |
| `GET` | `/api/contributions/:id/receipt.pdf` | `contribution:receipt` — A5 PDF download |

Contribution `type` is `"CASH" | "CHECK" | "ENVELOPE"` (no `"ONLINE"` — see internal-ledger policy). Each contribution creates a `LedgerEntry` of type `DONATION`. If the current fiscal month is locked, batch creation refuses with a descriptive error.

### 9.9 Vendors (`/api/vendors`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/vendors`, `/api/vendors/:id` | `vendor:read` |
| `POST` | `/api/vendors` | `vendor:create` |
| `PATCH` | `/api/vendors/:id` | `vendor:update` |
| `DELETE` | `/api/vendors/:id` | `vendor:delete` |

### 9.10 Departments (`/api/departments`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/departments`, `/api/departments/:id` | `department:read` (`DEPARTMENT_HEAD` is auto-scoped to their own department) |
| `POST` | `/api/departments` | `department:create` (must specify a `headId`) |
| `PATCH` | `/api/departments/:id` | `department:update` |
| `DELETE` | `/api/departments/:id` | `department:delete` |

### 9.11 Chart of Accounts (`/api/chart-of-accounts`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/chart-of-accounts`, `/api/chart-of-accounts/:id` | `chart-of-accounts:read` |
| `POST` | `/api/chart-of-accounts` | `chart-of-accounts:create` (body: `code`, `name`, `type`, optional `parentAccountCode`, `isActive`) |
| `PATCH` | `/api/chart-of-accounts/:id` | `chart-of-accounts:update` (body: any of `code`, `name`, `type`, `isActive`, `parentAccountCode`) |
| `DELETE` | `/api/chart-of-accounts/:id` | `chart-of-accounts:delete` |

`parentAccountCode` nests an account under the account with that code (looked up tenant-scoped). Sending `""` detaches the account back to a root; omitting the field leaves the current parent untouched. A self-parent, or a parent that is one of the account's own descendants, is rejected with `422` because it would make the subtree unreachable. `POST` also accepts a raw `parentId`, but the UI uses the code form.

### 9.12 Budgets (`/api/budgets`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/budgets`, `/api/budgets/:id` | `budget:read` |
| `POST` | `/api/budgets` | `budget:create` |
| `PATCH` | `/api/budgets/:id` | `budget:update` |
| `DELETE` | `/api/budgets/:id` | `budget:delete` |

Filters on `GET /api/budgets`: `departmentId`, `fundId`, `fiscalYear`, plus `page`/`pageSize`. Unique on `(departmentId, fundId, fiscalYear, month)`.

### 9.13 Members (`/api/members`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/members` | `contribution:read` (also supports `?search=…` for debounced name/email lookup) |
| `GET` | `/api/members/:id` | `contribution:read` |
| `POST` | `/api/members` | `contribution:read` |
| `PATCH` | `/api/members/:id` | `contribution:read` |
| `DELETE` | `/api/members/:id` | `contribution:read` |

The portal-access admin endpoint lives at `/api/portal/members/:id/portal-access` (see §5.2.1).

### 9.14 Periods (`/api/periods`)

| Method | Path | Role |
|---|---|---|
| `GET` | `/api/periods` | `SUPER_ADMIN`, `TREASURER`, `AUDITOR` |
| `POST` | `/api/periods/lock` | `SUPER_ADMIN`, `TREASURER` |
| `POST` | `/api/periods/unlock` | `SUPER_ADMIN` only |

Uses `requireRole` (not `checkPermission`). Body: `{ fiscalYear, month }`. Locking is an upsert — locking a never-seen (year, month) creates a new `Period` row. The action emits a `PERIOD_LOCK` / `PERIOD_UNLOCK` audit log with the year/month as details.

### 9.15 Audit Logs (`/api/audit-logs`)

| Method | Path | Permission |
|---|---|---|
| `GET` | `/api/audit-logs` | `audit:read` |

Query: `page`, `pageSize`, `userId?`, `action?` (substring match). Each row is enriched server-side with a `description` string (see §7.1).

### 9.16 Bulk Import (`/api/import/*`)

| Method | Path | Permission | Notes |
|---|---|---|---|
| `POST` | `/api/import/members` | `member:create` | Upload a CSV or Excel file with columns: `fullName`, `email`, `phone`, `address`, `memberNumber` |
| `POST` | `/api/import/ledger` | `ledger:create` | Upload a CSV or Excel file with columns: `date`, `type` (`DONATION`/`EXPENSE`/`TRANSFER`), `amountInKobo`, `description`, `fundCode`, `memberName` |
| `POST` | `/api/import/chart-of-accounts` | `chart-of-accounts:create` | Upload a CSV or Excel file with columns: `code`, `name`, `type` (`ASSET`/`LIABILITY`/`EQUITY`/`INCOME`/`EXPENSE`) |

All import endpoints accept `multipart/form-data` with a single `file` field. Responses are `{ imported, failed, errors: [{ row, message }] }`.

---

## 10. Services

Each domain has a dedicated service module. The pattern is: `prisma` for data access, no DTO classes (plain typed objects), business rules in the service, controllers are thin pass-throughs.

| Service | Responsibilities |
|---|---|
| `authService` | `register` (legacy signup), `registerChurch` (creates `Organization` + admin user + default funds + seeds Chart of Accounts), `authenticate` (issues access + refresh tokens), `getUserById`, `issueTokenForUser`, `refresh`, `logout` |
| `authTokenService` | Creates / consumes password-reset tokens, email-verification tokens, and MFA challenge codes (all stored as SHA-256 hashes) |
| `refreshTokenService` | Issues, rotates (atomic transaction), revokes, and revokes-all-for-user opaque refresh tokens; exports `REFRESH_COOKIE_NAME = "cf_refresh"` and `refreshCookieOptions()` |
| `portalAuthService` | Issues portal access + refresh JWTs (cookie-typed), `verifyPortalToken`, `verifyPortalRefreshToken`, `portalAuthenticate` middleware |
| `mailerService` | SMTP delivery via `nodemailer` with `isConfigured()` and console fallback; templated methods: `sendPasswordReset`, `sendEmailVerification`, `sendMfaCode`, `sendReceipt` |
| `userService` | User CRUD with org scoping |
| `fundService` | Fund CRUD with org-scoped uniqueness |
| `memberService` | Member CRUD with optional `search` filter |
| `vendorService` | Vendor CRUD |
| `departmentService` | Department CRUD; `listForHead` scopes queries to departments where the user is `headId` (used by `DEPARTMENT_HEAD` role) |
| `chartOfAccountsService` | Chart-of-accounts CRUD with hierarchy |
| `pledgeService` | Pledge CRUD, `getProgress` (sum of linked `PledgeContribution`) |
| `pledgeContributions` (within `contributionService`) | Atomic creation of `LedgerEntry` + `PledgeContribution`, auto-complete pledges |
| `contributionService` | Single + batch creation with locked-period check and `FOR UPDATE` pledge locks, receipt data + PDF generation, `sendReceiptIfPossible` (email if `Member.email` exists), auto-posts paired JournalEntry (debit Cash/Bank, credit Income) inside the same `SERIALIZABLE` transaction |
| `disbursementService` | Full disbursement workflow including dual-approval, reject with reason stored in `paymentNotes` prefixed `REJECTED:`, mark-paid with `DISBURSEMENT_PAID` audit log + auto-posts paired JournalEntry (debit Expense, credit Cash/Bank), `getDepartmentScopedRequests` for `DEPARTMENT_HEAD`. Every status change runs in a `SERIALIZABLE` transaction with a `FOR UPDATE` lock and a conditional `updateMany` on the expected status (§7.2) |
| `ledgerService` | Ledger entry CRUD, reversal (creates a paired `REVERSAL` entry via `reversedById`); creation locks the `Period` row so it cannot race a period close |
| `journalService` | Journal entry creation (≥ 2 lines, debits = credits) with `FOR UPDATE` locks on the touched accounts, reversal, `getTrialBalance` (per-account debits/credits/balances) |
| `idempotencyService` | `X-Idempotency-Key` lifecycle: UUID v4 validation, request hashing, key claim, cached-response replay, in-flight wait, failed-request release, `purgeExpired` (§7.1) |
| `budgetService` | Budget CRUD with `(department, fund, fiscalYear, month)` uniqueness; typed errors `DEPARTMENT_NOT_FOUND`, `FUND_NOT_FOUND` |
| `reportService` | All five reports + `getMetrics` (extended with income/expense breakdown, pledge stats, member count) + `exportReport` (CSV/XLSX/PDF via `exceljs` + `pdfkit`); uses Naira-formatted rows in exports |
| `auditService` | `log`, `logCreation/Update/Delete/Void`, `list`; `generateDescription` produces human-readable strings; resource singularization handles `ies → y`, `ses/xes/zes → drop suffix` |
| `periodService` | `list`, `get`, `lock`, `unlock`, `isLocked`; `lock` is upsert; `lock/unlock` emit structured `PERIOD_LOCK` / `PERIOD_UNLOCK` audit logs |
| `seedData` | `seedOrganization(organizationId)` — creates a standard Chart of Accounts (Assets, Liabilities, Equity, Income, Expenses) and default funds if none exist; called automatically during `registerChurch` and `register` |
| `postingService` | Auto-posts double-entry `JournalEntry` records when contributions are created or disbursements are marked PAID; accepts an optional transaction client so the entry is written inside the caller's `SERIALIZABLE` transaction |
| `importService` | Parses CSV and Excel files for bulk import of members, ledger entries, and Chart of Accounts |

### 10.1 Money handling

- All monetary values are stored as `BigInt` kobo and **serialised to strings** in JSON responses (Express 5 cannot serialise `bigint` natively).
- HTTP requests accept numbers (from JSON) and convert with `BigInt(value)`; the Zod schemas use `z.number().int().positive()` for `amountInKobo`.
- The `reportService` export formats convert to Naira (2 decimal places, `en-NG` locale) inside the generated file.
- Most list endpoints use `parsePagination` + `buildPaginatedResponse` and return `{ data, total, page, pageSize }`-style envelopes. User listing returns a raw array, while contribution listing returns `{ data, total }` without the standard pagination object.

### 10.2 Locked-period behaviour

`Period` is the only entity that can refuse writes — `contributionService.createSingle` and `batchCreate` both check whether the current `(fiscalYear, month)` is locked for the org and reject the request with a descriptive error if so. Reversal of ledger entries is **not** blocked by a locked period (post-facto reversals are sometimes required).

### 10.3 Disbursement workflow diagram

```
PENDING
   │ first-approve  (SUPER_ADMIN or TREASURER)
   ▼
FIRST_APPROVED
   │ second-approve  (SUPER_ADMIN or TREASURER)
   ▼
APPROVED ── mark-paid ──► PAID
   │                          │
   └── cancel / storno ──► CANCELLED ◄── storno ──┘

PENDING ── reject ──► REJECTED          (terminal)
FIRST_APPROVED ── reject ──► REJECTED   (terminal)
```

- `PENDING → REJECTED` and `FIRST_APPROVED → REJECTED` are allowed; an approved or paid request is cancelled instead of rejected.
- The request creator cannot be the first or second approver.
- The first and second approver must be different users, except for the auto-first-approved case below.
- `PAID`, `REJECTED` and `CANCELLED` are terminal: no further status change is accepted, which is what makes a retried "Mark as paid" fail cleanly instead of paying twice (`utils/disbursementState.ts`).
- **Auto-FIRST_APPROVED**: When a `SUPER_ADMIN` or `TREASURER` creates an org-level expense (no `departmentId`), the status is automatically set to `FIRST_APPROVED` and the `disbursement:first_approved` Socket.IO event is emitted. Department-scoped disbursements remain in `PENDING` for manual approval.

### 10.4 Auto-posting (double-entry)

`postingService` automatically creates balanced `JournalEntry` records when financial events occur:

- **Contributions** (`createSingle` + `batchCreate`): After creating `LedgerEntry` records of type `DONATION`, a journal entry is posted:
  - Debit: Cash/Bank account (ASSET)
  - Credit: Income account (INCOME)
- **Disbursements** (`markPaid`): When a request is marked PAID, a journal entry is posted:
  - Debit: Expenses account (EXPENSE)
  - Credit: Cash/Bank account (ASSET)

Auto-posting requires the seeded Chart of Accounts to exist. If the default accounts are missing, the posting is skipped silently (fire-and-forget with error logging).

When auto-posting runs inside a `SERIALIZABLE` transaction (contribution creation, disbursement payout), the journal entry, the ledger entry, and the status change commit or roll back together — there is no window in which money has moved without its double entry. `journalService` locks the accounts it posts to `FOR UPDATE`, so two concurrent payouts cannot compute a balance from the same stale figure.

---

## 11. Utilities

| File | Purpose |
|---|---|
| `utils/jwt.ts` | `getJwtSecret()` (throws in production if unset) and `getJwtExpiry()` (default `24h`) |
| `utils/serialize.ts` | `serializeResponse(body)` — BigInt → string, Date → ISO string, recursive on objects + arrays; wraps every `res.json` call in `index.ts` |
| `utils/sanitize.ts` | `sanitizeForLog(obj)` — redacts known sensitive fields (`password`, `token`, etc.) from request bodies before they are written to `AuditLog.details` |
| `utils/clientIp.ts` | `getClientIp(req)` — extracts the first hop from `X-Forwarded-For` then falls back to `req.socket.remoteAddress` |
| `utils/pagination.ts` | `parsePagination(req)` and `buildPaginatedResponse(data, total, params)` — standard `{ data, total, page, pageSize }` envelope |
| `utils/calculate.ts` | Numeric / BigInt helpers (Kobo math, safe additions, etc.) |
| `utils/formatCurrency.ts` | Kobo-to-Naira formatting helpers used by reports |
| `utils/token.ts` | `generateToken()` / `hashTokenValue()` — opaque token generation for password-reset + email-verification, paired with SHA-256 hashing for storage |
| `utils/validateSchema.ts` | Zod schema helpers |

`lib/prisma.ts` exports a singleton `PrismaClient` used by every service.

---

## 12. Email delivery

`mailerService` is the single source of outbound email. It reads `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` at send time; if any required field is missing it falls back to console output (the payload is printed with a `[email:console]` or `[email:fallback:console]` marker so dev environments can copy verification / MFA codes out of the terminal). The transporter is cached and re-used across sends, only being recreated if `host|port|user` changes.

Available templates:

- `sendPasswordReset(email, token)` — links to `${FRONTEND_URL}/reset-password?token=…`
- `sendEmailVerification(email, token)` — links to `${FRONTEND_URL}/verify-email?token=…`
- `sendMfaCode(email, code)` — 6-digit code, 10-minute TTL
- `sendReceipt({...})` — formatted HTML + plain-text donation receipt

All sends are best-effort — failures are caught and logged (`[email:smtp:error]`, `[email:fallback:console]`) but **do not** propagate to the calling handler, so e.g. a missing SMTP server does not block a contribution from being recorded.

### 12.1 Deliverability notes

Emails are sent with `Message-ID`, `Reply-To`, and a branded HTML wrapper to reduce spam classification. For production deliverability:

1. Use a dedicated transactional email provider (SendGrid, Postmark, AWS SES, Mailgun) instead of a personal Gmail account.
2. Configure DNS records for the sending domain:
   - **SPF** — authorize the sending IP/host
   - **DKIM** — sign messages so receivers can verify they were not tampered with
   - **DMARC** — enforce alignment and request reports
3. Keep `SMTP_FROM` aligned with the authenticated user/domain.
4. Avoid spam trigger words, and maintain a clean recipient list.

---

## 13. Error handling

- `errorHandler` is the last middleware. It logs the error with stack + path + method, and:
  - For `AppError` (thrown by `utils/appError.ts` for expected conditions such as an illegal state transition or an idempotency conflict), returns the carried status — `400`/`409`/`422` — with `{ error, code?, details? }`.
  - For `ZodError`, returns `400 { error: "Validation failed", details: err }` (when the validation middleware is bypassed, which shouldn't normally happen).
  - For Prisma errors that map to a deterministic status (`P2002` → `409`, `P2003`/`P2014` → `400`, `P2025` → `404`), returns that status.
  - Otherwise returns `500 { error: <message in dev, "Internal server error" in production> }`.
- The `authController.registerChurch` / `signup` paths explicitly translate Prisma error codes (`P2002` unique conflict, `P2021` / `P2022` missing table/column, `P1001` can't reach DB) into user-friendly messages, including a hint to run `npx prisma migrate deploy` if the schema is stale.

---

## 14. Security

- All monetary values are **integer Kobo**; no decimal Naira ever crosses the API boundary.
- All admin API responses (including BigInt) are JSON-serialisable; `serializeResponse` is the only place that touches the response.
- JWT secrets are mandatory in production (`getJwtSecret` throws if unset).
- `RefreshToken` is server-side opaque (not a JWT) so revocation is instant; rotations are atomic (`prisma.$transaction`).
- The portal JWT is type-tagged (`type: "member-portal"` or `"member-portal-refresh"`) and checked for the correct type on verify.
- `Member.email` is part of the portal JWT payload and re-validated on every authenticated request, so an admin revoking `portalAccess` (or changing the email) immediately invalidates outstanding portal sessions.
- `helmet` adds standard hardening headers; CORS is permissive for the SPA in dev (`origin: true, credentials: true`).
- `Trust proxy` is on, so `X-Forwarded-For` is honoured when reading the client IP for audit logging.
- Password reset / email verification / MFA tokens are all stored as SHA-256 hashes (plain-text values live only in the email body).
- **Financial writes are replay-safe.** The four financial routers require a `X-Idempotency-Key`, so a retried or duplicated request cannot pay a disbursement, post a journal, or record a contribution twice. The key is scoped to `(organizationId, key)` and bound to the request hash and a time limit, so a key from one tenant — or the same key with a different payload — cannot replay another request's response. The row also records `userId` and `endpoint` for auditing; note that replay matching does **not** compare `userId`, so a second user in the same organization presenting the same key and an identical body would receive the first user's cached response.
- **Concurrent money movement is serialised.** `SERIALIZABLE` transactions plus `FOR UPDATE` row locks and conditional status updates mean two simultaneous payouts of the same request cannot both succeed; the loser gets `409`, not a second debit.
- `authLimiter` / `apiLimiter` rate limiters are defined but **not** mounted — they should be wired into `authRoutes` (for `authLimiter`) and `apiRouter` (for `apiLimiter`) before production rollout.

---

## 15. Internal-Ledger Policy

The application is **strictly an internal ledger / accounting system**:

- **No member-facing payment gateway**. There is no `PaymentGateway` model, no `PaymentProvider` enum, and no webhook endpoints. The `PaymentGateway` table and `PaymentProvider` enum were dropped in migration `20260903_remove_payment_gateway`.
- **Contribution `type` is limited to `CASH | "CHECK" | "ENVELOPE"`** — no `ONLINE` option. Treasurers record what was physically received.
- **Disbursement `paymentMethod` is a free-text field** representing the *internal* record of how the church paid (e.g. `BANK_TRANSFER`, `CASH`, `CHEQUE`, `POS`). `paymentReference` and `paymentNotes` are for the manual slip / cheque number — never a gateway id.
- **Donor receipts are generated manually** by `contributionService.getReceiptData` / `downloadDonorReceiptPdf`; no receipt is auto-pushed from a gateway.
- **No `Plan` / `Subscription` / `OrganizationSubscription` models** exist. If/when SaaS billing is added, those tables must keep `organizationId` as the only foreign key tying them to a tenant — never reuse `Member`, `Pledge`, or `LedgerEntry` relationships.

---

## 16. Development Commands

| Command | Purpose |
|---|---|
| `npm run dev` | `tsx watch src/index.ts` — hot-reload dev server |
| `npm run build` | `tsc` — emit `dist/` |
| `npm run start` | `node dist/index.js` — run compiled output |
| `npm test` | `vitest run` — single-shot test run (8 files / 150 tests: smoke, RBAC, idempotency lifecycle, disbursement state machine) |
| `npm run test:watch` | `vitest` — watch mode |
| `npx prisma migrate deploy` | Apply pending migrations in production |
| `npx prisma generate` | Regenerate the Prisma client (needed after `schema.prisma` changes) |
| `npx tsc --noEmit` | Type-check without emitting (used in CI / locally) |

### 16.1 Health checks

- `GET /api/health` — lightweight liveness probe. Returns `200 { status: "ok", database: "connected" }` or `503 { status: "degraded", database: "unreachable" }`.
- `GET /api/ready` — readiness probe. Returns `200` when the database and Socket.IO are initialized, otherwise `503` with diagnostic details.

Load balancers and orchestrators should target `/api/ready` for readiness and `/api/health` for liveness.

The server prints a startup warning if the `User.emailVerified` column is missing — the operator should run `npx prisma migrate deploy` and restart.

---

## 17. File Manifest

| File | Purpose |
|---|---|
| `src/index.ts` | Express + Socket.IO bootstrap, route mounting, JWT socket auth, schema-freshness probe |
| `src/lib/prisma.ts` | Singleton `PrismaClient` |
| `src/utils/jwt.ts` | Secret + expiry helpers |
| `src/utils/serialize.ts` | BigInt / Date JSON serialisation |
| `src/utils/sanitize.ts` | Log scrubbing |
| `src/utils/pagination.ts` | `parsePagination` + `buildPaginatedResponse` |
| `src/utils/clientIp.ts` | `getClientIp` |
| `src/utils/formatCurrency.ts` | Kobo → Naira formatting |
| `src/utils/calculate.ts` | BigInt math helpers |
| `src/utils/token.ts` | Opaque token generation + SHA-256 hashing |
| `src/utils/validateSchema.ts` | Zod helpers |
| `src/utils/appError.ts` | `AppError` / `badRequest` / `conflict` / `unprocessable` — status-carrying domain errors |
| `src/utils/prismaErrors.ts` | Structural detection of Prisma known errors + code → HTTP status |
| `src/utils/disbursementState.ts` | Disbursement state machine (`canTransitionDisbursement`, terminal statuses) |
| `src/middleware/authMiddleware.ts` | `authenticate` (Bearer JWT) + `requireRole` |
| `src/middleware/tenantMiddleware.ts` | `tenantScoped` + `requireOrganization` |
| `src/middleware/rbacMiddleware.ts` | `checkPermission(perm)` and the static `PERMISSIONS` map |
| `src/middleware/validationMiddleware.ts` | `validateBody` / `validateQuery` (Zod) |
| `src/middleware/auditMiddleware.ts` | `auditAction(label)` — auto-logs successful mutations |
| `src/middleware/idempotencyMiddleware.ts` | `requireIdempotencyKey()` — `X-Idempotency-Key` enforcement + response replay (§7.1) |
| `src/middleware/rateLimiter.ts` | `authLimiter`, `apiLimiter` (defined, not currently mounted) |
| `src/middleware/errorHandler.ts` | Global error responder (ZodError → 400, else 500) |
| `src/routes/authRoutes.ts` | `/api/auth/*` |
| `src/routes/portalRoutes.ts` | `/api/portal/*` |
| `src/routes/userRoutes.ts` | `/api/users` |
| `src/routes/fundRoutes.ts` | `/api/funds` |
| `src/routes/ledgerRoutes.ts` | `/api/ledger` |
| `src/routes/journalRoutes.ts` | `/api/journals` |
| `src/routes/disbursementRoutes.ts` | `/api/disbursements` |
| `src/routes/reportRoutes.ts` | `/api/reports/*` |
| `src/routes/pledgeRoutes.ts` | `/api/pledges` |
| `src/routes/contributionRoutes.ts` | `/api/contributions` |
| `src/routes/vendorRoutes.ts` | `/api/vendors` |
| `src/routes/departmentRoutes.ts` | `/api/departments` |
| `src/routes/chartOfAccountsRoutes.ts` | `/api/chart-of-accounts` |
| `src/routes/budgetRoutes.ts` | `/api/budgets` |
| `src/routes/auditRoutes.ts` | `/api/audit-logs` |
| `src/routes/memberRoutes.ts` | `/api/members` |
| `src/routes/periodRoutes.ts` | `/api/periods` |
| `src/controllers/*.ts` | Thin HTTP handlers for each resource (18 controllers) |
| `src/services/*.ts` | Business logic (authService, authTokenService, refreshTokenService, portalAuthService, mailerService, userService, fundService, memberService, vendorService, departmentService, chartOfAccountsService, pledgeService, contributionService, disbursementService, ledgerService, journalService, budgetService, reportService, auditService, periodService, idempotencyService) |
| `src/schemas/index.ts` | All Zod request schemas |
| `prisma/schema.prisma` | PostgreSQL schema (451 lines) |
| `prisma/migrations/*` | 5 migrations (init, bigint, complete_feature_set, remove_payment_gateway, financial_secretary_income) |
| `prisma.config.ts` | New-style Prisma config (loads `DATABASE_URL` via `dotenv/config`) |
| `tests/smoke.test.ts` | 7 unit tests covering kobo formatting, log sanitisation, journal balance, and disbursement line-item sum checks |
| `tsconfig.json` | TS config (target ES2022, strict, ESNext modules) |
| `vitest.config.ts` | Vitest setup (Node env) |
| `package.json` | Scripts: `dev`, `build`, `start`, `test`, `test:watch` |

---

## 18. Known implementation gaps

These are current code behaviors or risks, not supported API guarantees:

- **MFA verification can fail.** `mfaVerifySchema` validates only `code`, while the controller requires `userId` and `code`; validation strips `userId` before the controller receives the body.
- **Related-record tenant checks are incomplete.** Ledger creation does not independently verify `fundId`; disbursements do not independently verify `vendorId` or `departmentId`; department writes do not verify that `headId` belongs to the current organization. Chart-of-accounts parent linking is the exception that *is* resolved tenant-scoped — `parentAccountCode` is looked up with `{ code, organizationId }`, and re-parenting is rejected when it would create a cycle.
- **Disbursement department filtering is incomplete.** The controller constructs a department filter but does not pass it into the query; department-head scoping is applied after pagination, so totals can describe a broader set than the returned page. **Fixed** — `disbursementService.getDepartmentScopedRequests` now applies department scoping at the database query level, and `reportService.getMetrics` accepts an optional `departmentId` for department-scoped metric computation.
- **List response envelopes are inconsistent.** User listing returns a raw array and contribution listing returns `{ data, total }`; most other list endpoints include page and page-size metadata.
- **Contribution dates are not persisted as requested.** The request schemas and controllers accept `date`, but contribution creation uses the current timestamp for the ledger entry.
- **Portal identity is best-effort.** Portal donations are matched by `description` containing `Member.fullName`, and portal login searches by email without an organization qualifier. Duplicate member emails across organizations can therefore resolve unpredictably.
- **Automatic audit writes are fire-and-forget.** An audit database failure can lose a mutation audit record without failing the request.
- **Validated query data is underused.** `validateQuery` stores parsed values on `req.validatedQuery`, but most controllers continue reading directly from `req.query`.
- **SMTP certificate verification is disabled.** The mailer sets `tls.rejectUnauthorized = false`.
- **Test coverage is narrow.** The service and middleware unit tests cover utilities, arithmetic, RBAC, the disbursement state machine, and the idempotency lifecycle, but they do not cover HTTP routes end-to-end, real Prisma/PostgreSQL integration, authentication flows, tenant isolation, migrations, or Socket.IO.
- **Idempotency is per-endpoint, not global.** Only `/contributions`, `/disbursements`, `/ledger`, and `/journals` require an `X-Idempotency-Key`. Member, vendor, budget, fund, pledge, and chart-of-accounts writes have no key protection and rely on the client-side in-flight guard alone, so a duplicate created by a misbehaving or non-browser client would still land twice.
- **The idempotency replay window is 24h by default** (`IDEMPOTENCY_WINDOW_HOURS`). Past that, a repeated key is treated as a new operation and the write executes again — so a client must not retry a request days later with the same key expecting safety.
- **`DELETE` routes are not key-protected.** Contribution deletion is a reversal and is guarded structurally instead (§7.1); other `DELETE` endpoints are plain hard deletes with no duplicate guard.

### 18.1 File storage

Generated files (receipt PDFs, report exports) are streamed to the client in real time. Additionally, the backend attempts to persist a copy via `src/services/fileStorage.ts`:

- **Local fallback** (default when `S3_*` variables are unset): files are saved under `./storage/` on the server filesystem.
- **S3** (when configured): files are uploaded to `S3_BUCKET` in the region `S3_REGION` using the AWS SDK v3.

Configuration variables:
- `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_ENDPOINT` (optional, for S3-compatible services)
- `STORAGE_LOCAL_DIR` (default `./storage`)

Uploads are fire-and-forget; failures are logged but do not block the API response.

## 19. What's *not* here

- **No member-facing payment integration.** No Paystack, Flutterwave, Stripe, or any gateway. The `PaymentGateway` model is gone.
- **No SaaS billing.** No `Plan`, `Subscription`, or `OrganizationSubscription` models.

## 20. Database Backup & Disaster Recovery

No automated backup jobs are configured out of the box. The repository includes helper scripts in `scripts/`:

- `scripts/backup.sh` — dumps the database via `pg_dump` to `BACKUP_DIR` (default `./backups`), gzipped with a timestamp.
- `scripts/restore.sh` — restores a `.sql.gz` backup via `gunzip | psql`, then runs `npx prisma migrate deploy`.

Recommended production setup:

1. **Automated daily backups** using a cron job or scheduled task that calls `scripts/backup.sh`.
2. **Off-site storage** — copy the resulting `.sql.gz` to S3, a NAS, or another host.
3. **Point-in-time recovery (PITR)** — enable WAL archiving on your PostgreSQL server if your host supports it (e.g., AWS RDS automated backups, Supabase PITR, or `pgBackRest` / `Barman` for self-hosted).
4. **Test restores quarterly** — verify that `scripts/restore.sh` works against a staging database.

Example cron entry for daily 02:00 backups:
```
0 2 * * * cd /path/to/church_financier/backend && DATABASE_URL="postgresql://..." bash scripts/backup.sh
```
- **No email/notification queue.** All emails are sent inline in the request handler (with `await` + `.catch`); a failure to deliver is logged but does not block the user action. The mailer adds `Message-ID`, `Reply-To`, and branded HTML wrappers to improve deliverability.
- **No scheduled jobs.** Period locks are manual; no cron-driven rollover.
- **No GraphQL.** REST + JSON only.

---

*Documentation updated for Church Financier Backend — 2026-09-04*