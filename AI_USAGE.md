# AI Usage

## Tools Used

Antigravity was used as an agentic coding assistant for schema generation, backend/frontend implementation, debugging, and documentation drafting.

## Important Prompts

1. "Create the Auth module for Express and TypeScript with registration, login, JWT middleware, bcrypt hashing, and repository/service/controller layers."
2. "Implement CSV import with normalized headers, case-insensitive member resolution, seven-day duplicate detection, and persisted row-level anomalies."
3. "Implement equal, exact, and percentage expense splits with INR/USD conversion and ensure stored shares sum to the transaction."
4. "Add temporal group memberships so historical expenses validate members using joinedAt and leftAt."
5. "Build an import report where users can keep the original duplicate, keep both, or replace the original."

## Cases Where AI Was Wrong

### 1. Upload limiter applied too broadly

**Wrong output:** Upload-specific throttling affected ordinary group/dashboard navigation.

**Detection:** Normal GET requests began returning the upload limiter's HTTP 429 message.

**Correction:** Apply `uploadLimiter` only to CSV POST routes; keep separate global and auth limits.

### 2. Equal-split rounding assigned to list order

**Wrong output:** The last participant received the rounding remainder.

**Detection:** Reviewing stored shares for values such as 100 divided by 3 showed the result depended on participant ordering.

**Correction:** Round each equal share and apply the remaining cents to the payer, consistently in manual and imported expense creation.

### 3. Slash-formatted CSV dates were not normalized

**Wrong output:** Only `DD-MM-YYYY` received explicit normalization.

**Detection:** `DD/MM/YYYY` rows produced invalid or runtime-dependent parsing.

**Correction:** Add `ImportService.parseDateString` for both slash and hyphen forms before constructing `Date`.

### 4. Documentation invented modules

**Wrong output:** Draft documentation referred to a `SplitCalculatorService` and import sub-services that do not exist.

**Detection:** Repository file inventory and imports showed logic is in `expense.service.ts`, `balance.service.ts`, and `import.service.ts`.

**Correction:** Rewrite architecture documentation using only checked-in files.

### 5. Prisma schema changed without a migration

**Wrong output:** Imported-user fields and new enum values existed only in `schema.prisma`.

**Detection:** Comparing the migration SQL with the Prisma schema showed a fresh database lacked `isRegistered`, `linkedUserId`, `SHARE`, and review anomaly enum values.

**Correction:** Add a migration that synchronizes the database schema with the current importer.

### 6. Frontend offered an action rejected by backend validation

**Wrong output:** The duplicate report posted `REPLACE`, but the Zod schema accepted only `ACCEPT`, `SKIP`, and `IMPORT`.

**Detection:** Static route/UI comparison showed the request would fail before reaching `ImportService.resolveDuplicate`.

**Correction:** Add `REPLACE` to `resolveDuplicateSchema`.

## Verification Practice

AI output was checked against repository files, Prisma migrations, route schemas, frontend API calls, TypeScript builds, ESLint, and Prisma validation. Claims that could not be tied to code were removed from the documentation.
