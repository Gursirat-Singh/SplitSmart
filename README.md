# SplitSmart

SplitSmart is a group expense-sharing application with temporal memberships, INR/USD transactions, settlements, dashboards, and auditable CSV imports.

## Features

- Email/password authentication with JWT-protected routes.
- Group creation, member addition/removal, and membership history through `joinedAt`/`leftAt`.
- Manual `EQUAL`, `EXACT`, and `PERCENTAGE` expenses.
- INR and USD expenses and settlements normalized to stored INR values.
- Pairwise balances derived from expense shares and settlements.
- CSV import with `EQUAL`, `EXACT`, `PERCENTAGE`, and `SHARE` rows.
- Import audit records, anomaly logging, duplicate review, and imported-member linking.
- Dashboard and group charts for totals and spending trends.

## Architecture

- `frontend/`: React 19, Vite, TypeScript, Tailwind CSS, Axios, and Recharts.
- `backend/`: Express 5 and TypeScript controllers, validation, services, repositories, and middleware.
- `backend/prisma/`: PostgreSQL schema and migrations.
- Financial source records are `Expense`, `ExpenseShare`, and `Settlement`; balances are calculated on read by `BalanceService`.
- CSV processing is implemented in `ImportService` and persists `Import`, `ImportRow`, and `ImportAnomaly` records.

## Local Setup

Prerequisites: Node.js 18+ and PostgreSQL.

Backend:

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=3000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/splitsmart"
JWT_SECRET="replace-with-a-long-secret"
JWT_EXPIRES_IN="7d"
NODE_ENV="development"
CLIENT_URL="http://localhost:5173"
```

Then run:

```bash
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Frontend:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL="http://localhost:3000/api/v1"
```

Then run `npm run dev`.

## Verification

```bash
cd backend
npm run build
npx prisma validate

cd ../frontend
npm run lint
npm run build
```

The repository currently has no automated test suite.

## Deployment

- Deploy PostgreSQL first and set `DATABASE_URL`.
- Run `npx prisma migrate deploy` during backend release.
- Build the backend with `npm run build` and start it with `npm start`.
- Set backend `NODE_ENV=production`, `JWT_SECRET`, and `CLIENT_URL`.
- Build the frontend with `VITE_API_URL` pointing to the deployed backend `/api/v1`.
- `frontend/vercel.json` rewrites routes to `index.html` for client-side routing.
- The in-memory rate limiter is process-local and is intended for assignment-scale deployment.

No deployment URL or backend platform configuration is committed in this repository.

## AI Tools Used

Antigravity was used for implementation and debugging assistance. The prompts, incorrect outputs, detection steps, and corrections are recorded in [AI_USAGE.md](AI_USAGE.md).

See [SCOPE.md](SCOPE.md) for import policy and schema details and [DECISIONS.md](DECISIONS.md) for design decisions.
