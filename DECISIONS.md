# SplitSmart Decisions

## Temporal Memberships

**Decision:** Store membership intervals using `joinedAt` and nullable `leftAt`.

**Alternatives:** A current-member boolean, or copied member snapshots on each expense.

**Reasoning:** Manual expenses and imported rows can validate participants at the transaction date while preserving membership history.

## INR Base Currency

**Decision:** Preserve original amount/currency/rate and store `baseInrAmount`.

**Alternatives:** Separate per-currency ledgers, or live conversion during every balance read.

**Reasoning:** All balances and settlements can be aggregated in one unit while retaining the entered transaction data. Rates are intentionally user supplied.

## Derived Balances

**Decision:** Recompute pairwise balances from expense shares and settlements.

**Alternatives:** Maintain a mutable balance table.

**Reasoning:** Source transactions remain auditable and deleting an expense or settlement cannot leave a separate balance record stale.

## Separate Settlements

**Decision:** Store settlements separately from expenses.

**Alternatives:** Represent payments as negative expenses.

**Reasoning:** A settlement has a payer and payee but no purchase split. The balance formula can subtract payments without mixing them into spending history.

## Stored Shares

**Decision:** Persist absolute original and INR values for every expense participant.

**Alternatives:** Store only percentages/weights and recalculate on every read.

**Reasoning:** Balance queries become sums over fixed obligations. Creation code absorbs two-decimal rounding drift so share totals match the expense.

## Duplicate Review

**Decision:** Flag a possible duplicate rather than silently dropping it.

**Alternatives:** A database uniqueness constraint, or always importing both rows.

**Reasoning:** Description/amount/date combinations are not truly unique. The user can keep the original, keep both, or replace the matched expense.

## Imported Members

**Decision:** Create unregistered placeholder users for unknown CSV identifiers and allow later linking.

**Alternatives:** Reject unknown members, or require account registration before import.

**Reasoning:** Historical CSV data remains importable without giving placeholders authentication credentials. Linking transfers financial references to a registered account.

## Suspicious Financial Rows

**Decision:** Flag negative/refund and settlement-like rows for review instead of interpreting them automatically.

**Alternatives:** Convert them automatically to negative expenses or settlements.

**Reasoning:** The CSV does not carry enough semantics to make that financial decision safely. Accepted rows are still created as expenses; settlement creation remains an explicit workflow.

## Assignment-Scale Limits

**Decision:** Use synchronous row processing, a 500-row cap, a 2 MB upload cap, and in-memory rate limiting.

**Alternatives:** Queues, object storage, distributed rate limiting, and background workers.

**Reasoning:** The current implementation targets a single-process internship assignment deployment and prioritizes traceable behavior over infrastructure complexity.
