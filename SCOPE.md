# SplitSmart Scope

## CSV Schema

The importer accepts a `.csv` file up to 2 MB and 500 data rows. Headers are normalized, with aliases for amount, date, payer, split type, exchange rate, and split details.

| Field | Policy |
| --- | --- |
| `description` | Missing value becomes `Imported Expense` with a warning. |
| `originalAmount` | Required and non-zero. Negative values are flagged as refunds for review. |
| `currency` | Required; only `INR` and `USD` are supported. |
| `exchangeRate` | Required and positive for USD; forced to `1` for INR. |
| `splitType` | Missing value becomes `EQUAL`. Supports `EQUAL`, `EXACT`, `PERCENTAGE`, and `SHARE`; aliases include `UNEQUAL`, `PERCENTAGES`, and `SHARES`. |
| `expenseDate` | Missing/invalid values become the current date with a warning. `DD-MM-YYYY`, `DD/MM/YYYY`, and parseable ISO values are accepted. |
| `payerEmail` | Required. Despite the name, an email or normalized member name may be used. |
| `splits` | Semicolon-separated member identifiers. Non-equal types require numeric values, for example `a@example.com:60;b@example.com:40`. |
| `notes` | Optional and used with the description for settlement-like keyword detection. |

## Import Policies

- Existing members resolve by case-insensitive email, then normalized exact name.
- A numbered alias such as `Aisha 1` may resolve to a unique base name `Aisha`.
- Unknown identifiers create unregistered imported users (`isRegistered=false`) with membership beginning `2000-01-01`.
- Duplicate names are treated as ambiguous; email is required to disambiguate.
- Existing membership intervals are checked against the expense date.
- For missing splits, the importer defaults to members represented in its email index.
- Each CSV row receives an `ImportRow` verdict. Every detected issue is stored as an `ImportAnomaly`.
- Hard errors are skipped. Refund-like, settlement-like, ambiguous, and duplicate rows can be flagged for review.
- Review actions are `ACCEPT`/`IMPORT`, `SKIP`, and `REPLACE`. `REPLACE` deletes the matched expense before creating the imported expense.
- Duplicate candidates require the same group, description, INR-normalized amount, and a date within plus or minus seven days.

## Anomalies

| Type | Typical severity | Actual trigger |
| --- | --- | --- |
| `INVALID_AMOUNT` | Error | Zero/non-numeric amount or invalid USD exchange rate. |
| `MISSING_FIELD` | Warning or error | Missing values; severity depends on whether a default is possible. |
| `UNKNOWN_MEMBER` | Warning or error | Imported-member creation fails. |
| `INACTIVE_MEMBER` | Warning or error | Existing member is outside the membership interval on the expense date. |
| `INVALID_DATE` | Warning | Date cannot be parsed and defaults to today. |
| `INVALID_SPLIT` | Error | Unsupported type/format, invalid value, empty participants, or sum mismatch. |
| `DUPLICATE_ENTRY` | Warning | Existing matching expense within the seven-day window. |
| `CURRENCY_MISMATCH` | Warning or error | Unsupported currency or ignored non-1 INR rate. |
| `REFUND` | Warning | Negative amount; row requires review. |
| `SETTLEMENT_DETECTED` | Warning | One participant plus payment/settlement keywords; row requires review. |
| `AMBIGUOUS_MEMBER` | Warning or error | More than one name match. |
| `OTHER` | Error | Database insertion failure. |

## Database Overview

- `User`: registered accounts and unregistered imported members; optional self-link to a registered user.
- `Group`: expense-sharing container and creator ownership.
- `GroupMembership`: temporal membership interval.
- `Expense`: original and INR-normalized transaction values.
- `ExpenseShare`: one stored obligation per participant.
- `Settlement`: payment between two members, stored separately from expenses.
- `Import`: CSV batch metadata and counters.
- `ImportRow`: raw row, verdict, optional expense link, and review result.
- `ImportAnomaly`: row-level anomaly type, severity, field, message, and raw data.

## Explicit Limits

- Only INR and USD are supported.
- Exchange rates are supplied by the user/import file; there is no live FX service.
- There are no automated tests.
- Rate limiting is in memory and per backend process.
- Settlement-like CSV rows are flagged, not automatically converted into `Settlement` records.
