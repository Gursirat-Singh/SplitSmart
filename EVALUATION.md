# SplitSmart Final Evaluation

## Audit Basis

No standalone assignment brief, PDF, or requirements file exists in the repository or its Git history. This audit therefore scores only the requirements explicitly named in the review request and requirements stated in checked-in schema comments. It does not claim coverage of an unavailable external rubric.

## Phase 1: Assignment Compliance Audit

| Requirement | Status | Evidence | Files | Risk |
| --- | --- | --- | --- | --- |
| Email/password authentication | PASS | Passwords are hashed with bcrypt; login verifies the hash and returns JWTs. | `backend/src/services/auth.service.ts`, `backend/src/middleware/auth.middleware.ts` | No automated auth tests. |
| Protected application routes | PASS | Group, expense, settlement, and import routers apply `authenticate`. | `backend/src/routes/*.routes.ts` | JWT is stored in browser local storage. |
| Group creation and membership | PASS | Creator membership is created transactionally; members can be added and removed. | `group.service.ts`: `createGroup`, `addMember`, `removeMember` | Any active member can add/remove another non-creator member. |
| Temporal membership history | PASS | Membership rows use `joinedAt`/`leftAt`; expense/import validation checks the transaction date. | `membership.repository.ts`, `expense.service.ts`, `import.service.ts` | Settlement creation checks current membership, not membership at `settledAt`. |
| Equal expense split | PASS | Equal shares are rounded and remainder is assigned to the payer. | `expense.service.ts`: `createExpense`; `import.service.ts`: import creation/resolution | Payer-not-in-split creates a tiny self-share only when remainder exists. |
| Exact expense split | PASS | Exact shares must sum to the original amount; INR shares preserve the rounded total. | `expense.service.ts`: `createExpense` | No automated edge-case tests. |
| Percentage expense split | PASS | Percentages must total 100 within 0.01 tolerance. | `expense.service.ts`: `createExpense` | No automated edge-case tests. |
| Share/weight split in CSV | PASS | `SHARE` is accepted by importer and converted proportionally. | `import.service.ts`, `schema.prisma`, sync migration | Manual UI/API does not offer `SHARE`. |
| Multi-currency handling | PASS | INR/USD originals are retained and normalized to stored INR using supplied rates. | expense/settlement schemas and services | No live FX source; user-supplied rate is authoritative. |
| Correct pairwise balances | PASS | Debts and settlements are aggregated in INR and netted per unordered user pair. | `balance.service.ts`: `computeGroupBalances` | Uses raw PostgreSQL SQL, so PostgreSQL is required. |
| Balances sum to zero | PASS | Each pair creates equal negative/positive effects in `getGroupBalances`. | `balance.service.ts`, `group.service.ts`: `getGroupBalances` | Floating values are rounded to two decimals. |
| Settlement recording and deletion | PASS | Validates payer/payee, currency, and permissions; balances subtract settlement direction. | `settlement.service.ts`, `settlement.controller.ts` | A group member can record a settlement on behalf of another current member. |
| CSV parsing and limits | PASS | Uses `csv-parse`, normalized headers, 2 MB upload limit, and 500-row limit. | `import.routes.ts`, `import.service.ts`: `parseCSV`, `processImport` | MIME checks may reject some browser/OS CSV MIME variants. |
| CSV date anomalies | PASS | Slash/hyphen day-first dates are normalized; invalid dates warn and default to today. | `import.service.ts`: `parseDateString` | JavaScript still parses other accepted date strings. |
| Every imported row is auditable | PASS | Each row receives an `ImportRow`; anomalies retain row number and raw JSON. | `schema.prisma`, `import.service.ts` | Fatal parse failure before batch creation has no batch record. |
| Duplicate detection and resolution | PASS | Same description/base amount within seven days is flagged; accept, skip, replace are implemented. | `import.service.ts`: `resolveDuplicate`; `ImportReport.tsx` | `REPLACE` deletes the first matching expense, not a user-selected ID. |
| Refund/settlement-like anomaly handling | PARTIAL PASS | Rows are flagged for review and not silently interpreted. | `import.service.ts` | Accepting a settlement-like row creates an expense, not a settlement. |
| Ghost/imported members | PASS | Unknown identifiers create non-authenticating users and can later be linked/upgraded. | `import.service.ts`, `group.service.ts`: `linkMember`, `auth.service.ts`: `register` | Placeholder membership begins at fixed date `2000-01-01`. |
| Dashboard and charts | PASS | Dashboard totals/trends and group pie/bar charts use backend aggregates. | `group.service.ts`: `getDashboardStats`; dashboard/group React pages | Month labels use server locale formatting. |
| Required documentation | PASS | Setup, architecture, deployment, features, AI use, anomalies, schema, and decisions are documented from code. | `README.md`, `SCOPE.md`, `DECISIONS.md`, `AI_USAGE.md` | No external assignment brief is included. |
| Database migrations match schema | PASS | A migration now adds imported-user fields and new enum values. | `backend/prisma/migrations/20260615043000_sync_imported_members_and_anomalies/` | Migration was validated statically, not against a disposable PostgreSQL database. |
| Production builds | PASS | Backend and frontend builds pass; frontend lint and Prisma validation pass. | `backend/tsconfig.json`, package scripts | Frontend bundle warns at roughly 760 kB; not assignment-critical. |
| Automated tests | FAIL | Backend test script explicitly exits with “no test specified”; frontend has no test script. | both `package.json` files | Highest confidence and regression risk. |
| Verifiable deployment | FAIL | SPA rewrite exists, but no deployed URL or backend platform manifest is committed. | `frontend/vercel.json`, `README.md` | Evaluator cannot verify a live deployment from repository evidence. |

## Phase 2: Interview Survival Audit

### 1. Exact question: How is a balance calculated?
**Correct answer:** `BalanceService.computeGroupBalances` sums non-payer `ExpenseShare.baseInrAmount` by debtor/creditor, sums settlements by payer/payee, then applies `debt(A,B) - debt(B,A) - settlement(A,B) + settlement(B,A)`.
**Files/functions:** `backend/src/services/balance.service.ts`; `computeGroupBalances`.
**What to say:** “Balances are derived, not stored. Expenses create obligations; settlements reduce them in the payment direction.”

### 2. Exact question: Why do group balances sum to zero?
**Correct answer:** `GroupService.getGroupBalances` subtracts every pair amount from `from` and adds the same amount to `to`.
**Files/functions:** `group.service.ts`; `getGroupBalances`.
**What to say:** “Every debt is a two-sided entry of equal magnitude, so the group total is zero apart from two-decimal representation.”

### 3. Exact question: How do temporal memberships work?
**Correct answer:** Membership intervals use `joinedAt <= date` and `leftAt IS NULL OR leftAt > date`.
**Files/functions:** `membership.repository.ts`; `findActiveMembers`; `expense.service.ts`; `createExpense`.
**What to say:** “Leaving closes an interval instead of deleting history, so old expenses keep their historical meaning.”

### 4. Exact question: Can a former member still affect current balances?
**Correct answer:** Yes. Their historical expense shares and settlements remain in source records, and group details include membership history.
**Files/functions:** `schema.prisma`; `BalanceService.computeGroupBalances`; `GroupRepository.findById`.
**What to say:** “Membership controls authorization and transaction-date validity; it does not erase financial history.”

### 5. Exact question: How is equal-split rounding handled?
**Correct answer:** Each share is rounded to two decimals and the remainder is applied to the payer.
**Files/functions:** `expense.service.ts`; `createExpense`; `import.service.ts`.
**What to say:** “The policy is deterministic and avoids making an arbitrary participant absorb list-order drift.”

### 6. Exact question: How are exact splits validated?
**Correct answer:** Supplied shares must sum, after currency rounding, to `originalAmount`.
**Files/functions:** `expense.service.ts`; `createExpense`.
**What to say:** “We reject the transaction before writing anything if the exact obligations do not reconcile.”

### 7. Exact question: How are percentage splits validated?
**Correct answer:** Percentages must total 100 within 0.01; the final participant receives the remaining rounded cents.
**Files/functions:** `expense.service.ts`; `createExpense`.
**What to say:** “Validation protects the semantic total, and the final remainder keeps stored shares equal to the expense.”

### 8. Exact question: What is a SHARE split?
**Correct answer:** CSV-only weighted splitting: each numeric share is divided by total shares to get a ratio.
**Files/functions:** `import.service.ts`; `processImport`, `resolveDuplicate`.
**What to say:** “It is supported for imported formats, but the manual expense form exposes only equal, exact, and percentage.”

### 9. Exact question: How is multi-currency handled?
**Correct answer:** Original amount/currency/rate are stored, and all balance math uses rounded `baseInrAmount`.
**Files/functions:** `expense.service.ts`, `settlement.service.ts`, Prisma models.
**What to say:** “INR is the ledger base. USD requires an explicit rate; INR forces rate one.”

### 10. Exact question: Why not calculate exchange rates live?
**Correct answer:** The code intentionally accepts the transaction-time rate and stores it for reproducibility.
**Files/functions:** validation and expense/settlement services.
**What to say:** “A historical ledger should not change when today’s FX rate changes.”

### 11. Exact question: How do settlements change balances?
**Correct answer:** A payment from A to B subtracts from A’s debt to B; an opposite payment adds in that pair direction.
**Files/functions:** `balance.service.ts`; `computeGroupBalances`.
**What to say:** “Settlements are separate financial records and never create expense shares.”

### 12. Exact question: Can someone settle with themselves?
**Correct answer:** No; `SettlementService.createSettlement` rejects identical payer/payee IDs.
**Files/functions:** `settlement.service.ts`; `createSettlement`.
**What to say:** “It is invalid domain input and is rejected before database creation.”

### 13. Exact question: Who can delete an expense?
**Correct answer:** The payer or group creator.
**Files/functions:** `expense.service.ts`; `deleteExpense`.
**What to say:** “That preserves ordinary member access while protecting another member’s financial record.”

### 14. Exact question: Who can delete a settlement?
**Correct answer:** Payer, payee, or group creator.
**Files/functions:** `settlement.service.ts`; `deleteSettlement`.
**What to say:** “Both affected parties and the group owner can correct the record.”

### 15. Exact question: Describe the CSV pipeline.
**Correct answer:** Authenticate membership, parse normalized headers, create an `Import`, validate each row, persist `ImportRow`/anomalies, create valid expenses, then complete counters.
**Files/functions:** `import.service.ts`; `processImport`.
**What to say:** “The important property is that row processing is explicit and auditable; rows are imported, skipped, or flagged.”

### 16. Exact question: What CSV formats are accepted?
**Correct answer:** Normalized aliases for required fields; semicolon-separated splits; INR/USD; four split types; several date forms.
**Files/functions:** `import.service.ts`; `parseCSV`, `parseDateString`.
**What to say:** “Header normalization is flexible, but financial values and split semantics are still validated strictly.”

### 17. Exact question: How are invalid dates handled?
**Correct answer:** Day-first slash/hyphen dates are normalized; unparseable values become today and log `INVALID_DATE`.
**Files/functions:** `import.service.ts`; `parseDateString`, `processImport`.
**What to say:** “The row remains traceable, and the fallback is visible as a warning rather than silent.”

### 18. Exact question: How are duplicates detected?
**Correct answer:** Same group, exact description, same INR-normalized amount, and expense date within plus/minus seven days.
**Files/functions:** `import.service.ts`; duplicate query in `processImport`.
**What to say:** “It is a review heuristic, not a uniqueness guarantee.”

### 19. Exact question: What do Keep Original, Keep Both, and Replace do?
**Correct answer:** Skip marks the row skipped; accept creates another expense; replace deletes the matched expense then creates the imported one.
**Files/functions:** `ImportReport.tsx`; `ImportService.resolveDuplicate`.
**What to say:** “The decision is explicit and recorded with review time and note.”

### 20. Exact question: What is the risk in Replace?
**Correct answer:** It deletes the first matching expense found by the same heuristic, not an expense ID chosen in the request.
**Files/functions:** `import.service.ts`; `resolveDuplicate`.
**What to say:** “For assignment scope the report displays the matching original, but a stronger production design would pass and verify that exact ID.”

### 21. Exact question: What happens to unknown CSV members?
**Correct answer:** The importer creates an unregistered user without password credentials and adds a historical membership.
**Files/functions:** `import.service.ts`; `getOrCreateImportedMember`.
**What to say:** “They can participate in the ledger but cannot authenticate.”

### 22. Exact question: How are ghost members linked later?
**Correct answer:** `linkMember` moves paid expenses, shares, settlements, and membership references inside a transaction.
**Files/functions:** `group.service.ts`; `linkMember`.
**What to say:** “Existing duplicate shares are merged so the expense-level uniqueness constraint remains valid.”

### 23. Exact question: Can a ghost user register directly?
**Correct answer:** Yes. Registration upgrades an existing unregistered row with the same email by adding password hash and setting `isRegistered=true`.
**Files/functions:** `auth.service.ts`; `register`.
**What to say:** “That avoids a second identity for the same imported email.”

### 24. Exact question: How are refunds handled?
**Correct answer:** Negative amounts receive a `REFUND` warning and are flagged; accepting creates the row as an expense.
**Files/functions:** `import.service.ts`.
**What to say:** “The system refuses to silently guess refund accounting. It surfaces the ambiguity for review.”

### 25. Exact question: How are settlement-like CSV rows handled?
**Correct answer:** A one-participant row with payment keywords is flagged as `SETTLEMENT_DETECTED`; it is not auto-converted.
**Files/functions:** `import.service.ts`.
**What to say:** “Detection is advisory because the CSV does not safely identify both settlement parties.”

### 26. Exact question: What is stored for import auditability?
**Correct answer:** Batch metadata, every raw row and verdict, every anomaly with severity/message/raw data, optional created expense, and review metadata.
**Files/functions:** Prisma `Import`, `ImportRow`, `ImportAnomaly`.
**What to say:** “No parsed row is silently discarded after the batch is created.”

### 27. Exact question: Why use raw SQL for balances?
**Correct answer:** PostgreSQL aggregation directly groups debtor/creditor and payer/payee pairs before application-level netting.
**Files/functions:** `balance.service.ts`.
**What to say:** “It keeps the financial formula visible and avoids loading every share into application memory.”

### 28. Exact question: What do the dashboard charts represent?
**Correct answer:** Monthly INR-normalized expense totals, group payer distribution, and group spending trend.
**Files/functions:** `group.service.ts`; `getDashboardStats`; dashboard and group pages.
**What to say:** “Charts are views over stored expense totals; they do not alter financial state.”

### 29. Exact question: What are the main authorization boundaries?
**Correct answer:** JWT middleware protects routes; services verify active group membership; creator/payer/payee checks protect destructive actions.
**Files/functions:** auth middleware, group/expense/settlement/import services.
**What to say:** “Authentication is route-level, while ownership and membership rules are enforced in domain services.”

### 30. Exact question: What would you improve first after submission?
**Correct answer:** Add automated financial/import tests, then make duplicate replacement target an explicit expense ID and tighten member-management authorization.
**Files/functions:** package scripts, `resolveDuplicate`, `addMember`, `removeMember`.
**What to say:** “Those changes improve confidence and authorization without changing the current architecture.”

## Phase 3: Assignment-Critical Issues

| Issue | Impact | Severity | Fix Effort | Recommended Fix |
| --- | --- | --- | --- | --- |
| No automated tests | Financial/import regressions can survive builds and weaken evaluator confidence. | HIGH | Medium | Add focused tests for split totals, balance netting, settlement direction, membership dates, and CSV verdicts. |
| No standalone assignment brief in repository | Exact external-rubric compliance cannot be proven from submitted files. | HIGH | Low | Add the provided brief or a requirements checklist if submission rules permit. |
| No verifiable live deployment evidence | A deployment requirement would fail repository-only evaluation. | HIGH if required | Medium | Confirm frontend/backend URLs and document them; do not claim deployment until verified. |
| Settlement membership uses current state | A historical `settledAt` involving a former member is rejected. | MEDIUM | Low | Validate payer/payee membership at `settledAt` if the assignment explicitly requires temporal settlements. |
| Any active member can add/remove members | Evaluator may challenge authorization policy. | MEDIUM | Low | Restrict member management to group creator if that is the intended rule. |
| Replace uses heuristic match, not explicit expense ID | Could delete the wrong matching expense when several candidates exist. | MEDIUM | Low/Medium | Send `originalExpense.id` and verify group/duplicate relation before deletion. |
| Settlement-like/refund rows have no specialized resolution | “Accept” creates an expense, which may surprise an evaluator. | MEDIUM | Medium | Clearly demo them as review-only detection; add conversion only if explicitly required. |
| CSV MIME allow-list is narrow | Some valid CSV files may be rejected by browser-provided MIME type. | LOW/MEDIUM | Low | Accept `.csv` extension with common text/octet-stream MIME types if reproduced. |

## Phase 4: Documentation Verification

| Document | Status | Verified contents |
| --- | --- | --- |
| `README.md` | PASS | Setup, architecture, deployment procedure/limitations, features, AI tool. |
| `SCOPE.md` | PASS | All current anomaly enum cases, trigger policies, import behavior, schema overview, explicit limits. |
| `DECISIONS.md` | PASS | Decision, alternatives, and reasoning for financial/import choices. |
| `AI_USAGE.md` | PASS | Tool, representative prompts, six wrong-output cases, detection, and correction. |

## Phase 5: 15-Minute Live Demo Checklist

| Item | Action | Expected Result | Pass/Fail Criteria |
| --- | --- | --- | --- |
| Authentication | Register, log out, log in, refresh protected page. | JWT session restores user; protected page loads. | PASS if valid login works and bad credentials fail. |
| Groups | Create a group and add a registered email. | Creator and member appear in group details. | PASS if both memberships are visible. |
| Expenses | Add INR 100 equal expense across 3 members. | Stored/displayed shares total INR 100. | PASS if no cent is lost and balances update. |
| Balances | Open group balances and one breakdown. | Payer is positive, debtors negative; total is zero. | PASS if directions and total reconcile. |
| Settlements | Record a partial debtor-to-creditor settlement. | Pair debt decreases by settlement amount. | PASS if direction is correct and deletion restores debt. |
| CSV Import | Upload a valid small CSV. | Batch completes and valid rows become expenses. | PASS if row/import counts and expenses agree. |
| Duplicate Resolution | Re-upload a matching row and open report. | Report shows pending duplicate with three actions. | PASS if Keep Original skips and Keep Both imports; test Replace only with disposable data. |
| Dashboard | Return to dashboard after transactions. | Counts, INR totals, recent items, creditor/debtor update. | PASS if values match created data. |
| Charts | Inspect dashboard and group charts. | Monthly/group charts render non-empty data. | PASS if chart values correspond to expenses. |
| Membership Timeline | Remove a non-creator, then inspect old expense/balance. | Member disappears from active list but old financial records remain. | PASS if history remains and new current-date split excludes them. |
| Currency Handling | Add USD expense/settlement with explicit INR rate. | Original USD and converted INR are both displayed/stored. | PASS if INR value equals amount times rate. |
| Ghost Member | Import an unknown identifier, then inspect members. | Imported member is marked unregistered and has no login. | PASS if ledger includes them without authentication access. |
| Import Anomalies | Upload invalid amount/date/split rows. | Errors skip rows; recoverable date warning logs fallback. | PASS if report preserves raw rows and reasons. |

## Phase 6: Final Verdict

- Assignment Compliance Score: **86/100** against the repository-visible requirements above.
- Technical Quality Score: **78/100**.
- Interview Readiness Score: **84/100**.

### 1. Would I submit this project today?

Yes, after running the live checklist against the actual submission database and deployed URLs. The repository now builds and the critical schema/import/documentation mismatches found in this audit are fixed.

### 2. What absolutely must be fixed before June 15 at 10:00 AM?

The already-applied fixes must be included in the submitted commit: schema migration, backend build fix, `REPLACE` validation, consistent import rounding, pending-review status, 2 MB UI text, and corrected documentation. Also verify the live deployment and migration against a clean database; repository evidence cannot prove those two runtime conditions.

### 3. What can safely wait until after submission?

Bundle splitting, distributed rate limiting, queues, broader architecture changes, service extraction, and scaling work. Focused automated tests are the best immediate post-submission improvement, but adding an untested framework minutes before submission is riskier than demonstrating the current flows carefully.

### 4. What is the biggest risk during the live interview?

CSV edge-case behavior. The importer is large, contains several policies in one service, and has nuanced distinctions between skipped, flagged, accepted, refund-like, settlement-like, duplicate, and ghost-member rows. The safest interview strategy is to explain the state transitions from actual `ImportRowVerdict` values and openly state that suspicious settlement/refund rows are detected for review, not automatically reclassified.
