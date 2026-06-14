import { prisma } from '../utils/prisma';
import { ValidationError, NotFoundError, ForbiddenError } from '../utils/errors';
import { roundCurrency } from '../utils/helpers';
import { Currency, SplitType, AnomalyType, AnomalySeverity, ImportRowVerdict, ImportStatus } from '@prisma/client';
import { parse } from 'csv-parse';
import { Readable } from 'stream';

export interface CSVRow {
  description: string;
  originalAmount: string;
  currency: string;
  exchangeRate?: string;
  splitType: string;
  expenseDate: string;
  payerEmail: string;
  splits: string; // semicolon-separated: "email:share;email:share" or just "email;email" for EQUAL
}

interface ParsedSplit {
  email: string;
  share?: number;
}

export class ImportService {
  /**
   * Helper to parse CSV buffer using csv-parse.
   */
  private static parseCSV(buffer: Buffer): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const records: any[] = [];
      const parser = parse({
        bom: true,
        columns: (headers: string[]) => {
          return headers.map(h => {
            // Normalize header: trim, lowercase, remove non-alphanumeric, and map to expected camelCase keys
            const clean = h.trim().toLowerCase().replace(/[^a-z0-9\s-_]/g, '');
            if (clean === 'description') return 'description';
            if (clean === 'original amount' || clean === 'amount' || clean === 'originalamount') return 'originalAmount';
            if (clean === 'currency') return 'currency';
            if (clean === 'exchange rate' || clean === 'exchangerate') return 'exchangeRate';
            if (clean === 'split type' || clean === 'splittype' || clean === 'split_type') return 'splitType';
            if (clean === 'expense date' || clean === 'date' || clean === 'expensedate') return 'expenseDate';
            if (clean === 'payer email' || clean === 'payeremail' || clean === 'paid_by' || clean === 'paidby') return 'payerEmail';
            if (clean === 'splits' || clean === 'splitwith' || clean === 'split_with' || clean === 'splitdetails' || clean === 'split_details') return 'splits';
            if (clean === 'notes') return 'notes';
            // Fallback to camelCase-ish representation
            return clean.replace(/[^a-zA-Z0-9]+(.)/g, (m, chr) => chr.toUpperCase());
          });
        },
        skip_empty_lines: true,
        trim: true,
      });

      const stream = Readable.from(buffer);
      stream.pipe(parser);

      parser.on('data', (record) => {
        records.push(record);
      });

      parser.on('end', () => {
        resolve(records);
      });

      parser.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Processes an uploaded CSV file, performing validation, duplicate detection, and batch logging.
   */
  static async processImport(groupId: string, userId: string, fileName: string, buffer: Buffer) {
    // 1. Verify group membership of the importing user
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId,
        leftAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenError('Only active group members can import expenses');
    }

    // 2. Parse CSV
    let records: any[] = [];
    try {
      records = await this.parseCSV(buffer);
    } catch (err: any) {
      throw new ValidationError(`Failed to parse CSV file: ${err.message}`);
    }

    if (records.length === 0) {
      throw new ValidationError('CSV file is empty');
    }

    // 3. Create Import Batch record
    const importBatch = await prisma.import.create({
      data: {
        groupId,
        importedById: userId,
        fileName,
        totalRows: records.length,
        status: ImportStatus.PROCESSING,
      },
    });

    let successCount = 0;
    let failureCount = 0;

    // Fetch active memberships to map emails to userIds
    const groupMemberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    });

    const emailToUserMap = new Map<string, { id: string; joinedAt: Date; leftAt: Date | null; name: string }>();
    for (const gm of groupMemberships) {
      if (gm.user.email) {
        emailToUserMap.set(gm.user.email!.toLowerCase().trim(), {
          id: gm.userId,
          joinedAt: gm.joinedAt,
          leftAt: gm.leftAt,
          name: gm.user.name,
        });
      }
    }

    const resolveMember = (identifier: string): { id: string; joinedAt: Date; leftAt: Date | null; name: string } | null | 'AMBIGUOUS' => {
      const lowerId = identifier.trim().toLowerCase();
      if (!lowerId) return null;
      
      // Try exact email
      if (emailToUserMap.has(lowerId)) return emailToUserMap.get(lowerId)!;
      
      // Try exact name match against all members in this group
      const matches = groupMemberships.filter(gm => gm.user.name.toLowerCase() === lowerId);
      if (matches.length === 1) {
        return {
          id: matches[0]!.userId,
          joinedAt: matches[0]!.joinedAt,
          leftAt: matches[0]!.leftAt,
          name: matches[0]!.user.name
        };
      }
      if (matches.length > 1) return 'AMBIGUOUS';
      return null;
    };

    const getOrCreateImportedMember = async (identifier: string): Promise<{ id: string; joinedAt: Date; leftAt: Date | null; name: string }> => {
      const resolved = resolveMember(identifier);
      if (resolved && resolved !== 'AMBIGUOUS') {
        return resolved;
      }
      
      let email: string | null = null;
      let name = identifier.trim();
      if (identifier.includes('@')) {
        email = identifier.trim().toLowerCase();
        name = email.split('@')[0] || name;
      }
      
      name = name.charAt(0).toUpperCase() + name.slice(1);
      
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          passwordHash: null,
          isRegistered: false,
        }
      });
      
      const joinedAt = new Date('2000-01-01');
      const membership = await prisma.groupMembership.create({
        data: {
          groupId,
          userId: newUser.id,
          joinedAt,
        }
      });
      
      const memberInfo = {
        id: newUser.id,
        joinedAt,
        leftAt: null,
        name: newUser.name,
      };
      
      groupMemberships.push({
        id: membership.id,
        userId: newUser.id,
        groupId,
        joinedAt,
        leftAt: null,
        user: newUser,
      });
      
      if (email) {
        emailToUserMap.set(email, memberInfo);
      }
      
      return memberInfo;
    };

    // We process each row. Since we want an audit trail of ImportAnomaly and ImportRow, we will handle exceptions row by row.
    for (let index = 0; index < records.length; index++) {
      const rowNum = index + 1;
      const rawRow = records[index];
      const anomalies: { type: AnomalyType; severity: AnomalySeverity; field?: string; message: string }[] = [];

      // Extract and trim fields safely
      let description = (rawRow.description || '').trim();
      const originalAmountStr = (rawRow.originalAmount || '').trim();
      const currencyStr = (rawRow.currency || '').trim().toUpperCase();
      const exchangeRateStr = (rawRow.exchangeRate || '').trim();
      let splitTypeStr = (rawRow.splitType || '').trim().toUpperCase();
      if (splitTypeStr === 'UNEQUAL') splitTypeStr = 'EXACT';
      if (splitTypeStr === 'PERCENTAGES') splitTypeStr = 'PERCENTAGE';
      if (splitTypeStr === 'SHARES') splitTypeStr = 'SHARE';
      let expenseDateStr = (rawRow.expenseDate || '').trim();
      const payerEmail = (rawRow.payerEmail || '').trim().toLowerCase();
      let splitsStr = (rawRow.splits || '').trim();

      // Check for missing critical fields and apply warning defaults where possible
      if (!description) {
        description = 'Imported Expense';
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.WARNING, field: 'description', message: 'Description is missing; defaulted to "Imported Expense"' });
      }
      if (!originalAmountStr) {
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.ERROR, field: 'originalAmount', message: 'Original amount is missing' });
      }
      if (!currencyStr) {
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.ERROR, field: 'currency', message: 'Currency is missing' });
      }
      if (!splitTypeStr) {
        splitTypeStr = 'EQUAL';
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.WARNING, field: 'splitType', message: 'Split type is missing; defaulted to EQUAL' });
      }

      let expenseDate = new Date();
      if (!expenseDateStr) {
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.WARNING, field: 'expenseDate', message: 'Expense date is missing; defaulted to today' });
      } else {
        let safeDateStr = expenseDateStr;
        if (/^\d{2}-\d{2}-\d{4}$/.test(safeDateStr)) {
          const [dd, mm, yyyy] = safeDateStr.split('-');
          safeDateStr = `${yyyy}-${mm}-${dd}`;
        }
        const parsedDate = new Date(safeDateStr);
        if (isNaN(parsedDate.getTime())) {
          anomalies.push({ type: AnomalyType.INVALID_DATE, severity: AnomalySeverity.WARNING, field: 'expenseDate', message: 'Invalid date format; defaulted to today' });
        } else {
          expenseDate = parsedDate;
        }
      }

      if (!payerEmail) {
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: 'Payer email is missing' });
      }

      // If splits list is missing, we default to all active members of the group
      if (!splitsStr) {
        const activeEmails = Array.from(emailToUserMap.keys());
        splitsStr = activeEmails.join(';');
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.WARNING, field: 'splits', message: `Splits definition is missing; defaulted to all active members (${splitsStr})` });
      }

      // Skip parsing detail if fatal missing fields exist
      if (anomalies.some((a) => a.severity === AnomalySeverity.ERROR)) {
        failureCount++;
        await prisma.$transaction(async (tx) => {
          await tx.importRow.create({
            data: {
              importId: importBatch.id,
              rowNumber: rowNum,
              verdict: ImportRowVerdict.SKIPPED,
              rawData: rawRow,
            },
          });
          for (const anomaly of anomalies) {
            await tx.importAnomaly.create({
              data: {
                importId: importBatch.id,
                rowNumber: rowNum,
                type: anomaly.type,
                severity: anomaly.severity,
                field: anomaly.field,
                message: anomaly.message,
                rawData: rawRow,
              },
            });
          }
        });
        continue;
      }

      // 1. Validate Amount
      let originalAmount = parseFloat(originalAmountStr);
      let isRefund = false;
      if (isNaN(originalAmount) || originalAmount === 0) {
        anomalies.push({ type: AnomalyType.INVALID_AMOUNT, severity: AnomalySeverity.ERROR, field: 'originalAmount', message: 'Original amount must be non-zero' });
      } else if (originalAmount < 0) {
        isRefund = true;
        anomalies.push({ type: AnomalyType.REFUND, severity: AnomalySeverity.WARNING, field: 'originalAmount', message: 'Negative amount detected. Flagged as REFUND for review.' });
      }

      // 2. Validate Currency
      if (currencyStr !== 'INR' && currencyStr !== 'USD') {
        anomalies.push({ type: AnomalyType.CURRENCY_MISMATCH, severity: AnomalySeverity.ERROR, field: 'currency', message: `Unsupported currency: ${currencyStr}. Must be INR or USD` });
      }

      // 3. Validate Exchange Rate
      let exchangeRate = 1.0;
      if (currencyStr === 'USD') {
        if (!exchangeRateStr) {
          anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.ERROR, field: 'exchangeRate', message: 'Exchange rate is required for USD transactions' });
        } else {
          const rate = parseFloat(exchangeRateStr);
          if (isNaN(rate) || rate <= 0) {
            anomalies.push({ type: AnomalyType.INVALID_AMOUNT, severity: AnomalySeverity.ERROR, field: 'exchangeRate', message: 'Exchange rate must be a positive number' });
          } else {
            exchangeRate = rate;
          }
        }
      } else {
        if (exchangeRateStr && parseFloat(exchangeRateStr) !== 1.0) {
          anomalies.push({ type: AnomalyType.CURRENCY_MISMATCH, severity: AnomalySeverity.WARNING, field: 'exchangeRate', message: 'Exchange rate specified for INR was ignored and set to 1.0' });
        }
        exchangeRate = 1.0;
      }

      // 5. Validate Split Type
      if (splitTypeStr !== 'EQUAL' && splitTypeStr !== 'EXACT' && splitTypeStr !== 'PERCENTAGE' && splitTypeStr !== 'SHARE') {
        anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splitType', message: `Unsupported split type: ${splitTypeStr}` });
      }

      // 6. Validate Payer Membership on Date
      let payerId = '';
      const payerMem = resolveMember(payerEmail);
      if (payerMem === 'AMBIGUOUS') {
        anomalies.push({ type: AnomalyType.AMBIGUOUS_MEMBER, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: `Multiple members found with name ${payerEmail}. Please use email.` });
      } else if (!payerMem) {
        try {
          const newMember = await getOrCreateImportedMember(payerEmail);
          payerId = newMember.id;
        } catch (err: any) {
          anomalies.push({ type: AnomalyType.UNKNOWN_MEMBER, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: `Failed to create imported member for ${payerEmail}: ${err.message}` });
        }
      } else {
        payerId = payerMem.id;
        // Check if active on expenseDate
        const joinedAt = new Date(payerMem.joinedAt);
        const leftAt = payerMem.leftAt ? new Date(payerMem.leftAt) : null;
        if (expenseDate < joinedAt || (leftAt && expenseDate > leftAt)) {
          anomalies.push({ type: AnomalyType.INACTIVE_MEMBER, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: `Payer was inactive on the expense date (${expenseDate.toISOString().slice(0, 10)})` });
        }
      }

      // 7. Parse & Validate Splits
      const splitParts = splitsStr.split(';').map((s: string) => s.trim()).filter(Boolean);
      const parsedSplits: ParsedSplit[] = [];
      let splitValidationError = false;

      for (const part of splitParts) {
        if (splitTypeStr === 'EQUAL') {
          // Can be just email
          if (part.includes(':')) {
            const [email, shareVal] = part.split(':');
            parsedSplits.push({ email: email!.trim().toLowerCase(), share: parseFloat(shareVal!.trim()) });
          } else {
            parsedSplits.push({ email: part.toLowerCase() });
          }
        } else {
          // Allow spaces or colons: 'Aisha 1' or 'Aisha:1' or 'Aisha 30%'
          const match = part.match(/^(.*?)[:\s]+([\d.]+%?)$/);
          if (!match) {
            anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: `Split shares must be specified in format email:share for split type ${splitTypeStr}` });
            splitValidationError = true;
            break;
          }
          const email = match[1];
          let shareVal = match[2];
          if (shareVal.endsWith('%')) shareVal = shareVal.slice(0, -1);

          if (!email || !shareVal) {
            anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: `Invalid format in split segment: ${part}` });
            splitValidationError = true;
            break;
          }
          const share = parseFloat(shareVal.trim());
          if (isNaN(share) || share <= 0) {
            anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: `Share value must be a positive number: ${shareVal}` });
            splitValidationError = true;
            break;
          }
          parsedSplits.push({ email: email.trim().toLowerCase(), share });
        }
      }

      // Check split members and filter out unknown/inactive ones (WARNING rather than ERROR)
      const activeSplitsData: { userId: string; share?: number }[] = [];
      if (!splitValidationError) {
        const droppedParticipants: string[] = [];
        for (const ps of parsedSplits) {
          const memberMem = resolveMember(ps.email);
          if (memberMem === 'AMBIGUOUS') {
            anomalies.push({ type: AnomalyType.AMBIGUOUS_MEMBER, severity: AnomalySeverity.WARNING, field: 'splits', message: `Multiple members found with name ${ps.email}. Excluded from split.` });
            droppedParticipants.push(ps.email);
          } else if (!memberMem) {
            try {
              const newMember = await getOrCreateImportedMember(ps.email);
              activeSplitsData.push({ userId: newMember.id, share: ps.share });
            } catch (err: any) {
              anomalies.push({ type: AnomalyType.UNKNOWN_MEMBER, severity: AnomalySeverity.WARNING, field: 'splits', message: `Failed to create imported member for ${ps.email}` });
              droppedParticipants.push(ps.email);
            }
          } else {
            const joinedAt = new Date(memberMem.joinedAt);
            const leftAt = memberMem.leftAt ? new Date(memberMem.leftAt) : null;
            if (expenseDate < joinedAt || (leftAt && expenseDate > leftAt)) {
              anomalies.push({ type: AnomalyType.INACTIVE_MEMBER, severity: AnomalySeverity.WARNING, field: 'splits', message: `Split participant ${ps.email} was inactive on the expense date (${expenseDate.toISOString().slice(0, 10)}); excluded from split` });
              droppedParticipants.push(ps.email);
            } else {
              activeSplitsData.push({ userId: memberMem.id, share: ps.share });
            }
          }
        }

        // Handle mathematical recalculations if members were dropped
        if (droppedParticipants.length > 0 && activeSplitsData.length > 0) {
          if (splitTypeStr === 'PERCENTAGE') {
            // Recalculate remaining percentages to sum up to 100%
            const currentSum = activeSplitsData.reduce((sum, item) => sum + (item.share || 0), 0);
            if (currentSum > 0) {
              activeSplitsData.forEach(item => {
                item.share = (item.share || 0) / currentSum * 100;
              });
            }
          } else if (splitTypeStr === 'EXACT') {
            // Recalculate remaining shares proportionally to equal the originalAmount
            const currentSum = activeSplitsData.reduce((sum, item) => sum + (item.share || 0), 0);
            if (currentSum > 0) {
              activeSplitsData.forEach(item => {
                item.share = ((item.share || 0) / currentSum) * originalAmount;
              });
            }
          } // SHARE doesn't strictly need recalculation since it's proportional by default
        }
      }

      // Validate split math logic if no errors so far
      if (!anomalies.some((a) => a.severity === AnomalySeverity.ERROR) && !splitValidationError) {
        if (activeSplitsData.length === 0) {
          anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: 'No active or valid split participants left after filtering' });
        } else {
          try {
            if (splitTypeStr === 'EXACT') {
              const sum = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);
              if (roundCurrency(sum) !== roundCurrency(originalAmount)) {
                anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: `Sum of split shares (${sum}) must equal originalAmount (${originalAmount})` });
              }
            } else if (splitTypeStr === 'PERCENTAGE') {
              const sum = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);
              if (Math.abs(sum - 100) > 0.01) {
                anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: `Sum of split percentages must equal 100% (got ${sum}%)` });
              }
            } else if (splitTypeStr === 'SHARE') {
              const sum = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);
              if (sum <= 0) {
                anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: `Sum of shares must be positive` });
              }
            }
          } catch (err: any) {
            anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: err.message });
          }
        }
      }

      // Settlement Detection
      const combinedText = (description + ' ' + (rawRow.notes || '')).toLowerCase();
      const hasSettlementKeywords = /payment|settle|deposit|paid back/i.test(combinedText);
      if (activeSplitsData.length === 1 && hasSettlementKeywords && !isRefund) {
        anomalies.push({ type: AnomalyType.SETTLEMENT_DETECTED, severity: AnomalySeverity.WARNING, field: 'description', message: 'Row looks like a settlement. Flagged for review.' });
      }

      // If there are hard errors, save row as SKIPPED and log anomalies
      if (anomalies.some((a) => a.severity === AnomalySeverity.ERROR)) {
        failureCount++;
        await prisma.$transaction(async (tx) => {
          await tx.importRow.create({
            data: {
              importId: importBatch.id,
              rowNumber: rowNum,
              verdict: ImportRowVerdict.SKIPPED,
              rawData: rawRow,
            },
          });
          for (const anomaly of anomalies) {
            await tx.importAnomaly.create({
              data: {
                importId: importBatch.id,
                rowNumber: rowNum,
                type: anomaly.type,
                severity: anomaly.severity,
                field: anomaly.field,
                message: anomaly.message,
                rawData: rawRow,
              },
            });
          }
        });
        continue;
      }

      // 8. Duplicate Entry Detection: exact match for description & amount within +/- 7 days window
      const baseInrAmount = roundCurrency(originalAmount * exchangeRate);
      const minDate = new Date(expenseDate);
      minDate.setDate(minDate.getDate() - 7);
      const maxDate = new Date(expenseDate);
      maxDate.setDate(maxDate.getDate() + 7);

      const possibleDuplicate = await prisma.expense.findFirst({
        where: {
          groupId,
          description,
          baseInrAmount,
          expenseDate: {
            gte: minDate,
            lte: maxDate,
          },
        },
      });

      // Fuzzy Duplicate check (same amount, within 7 days, similar description)
      let duplicateAnomaly = false;
      if (possibleDuplicate) {
        // basic string similarity (if 50% overlap of words)
        const words1 = description.toLowerCase().split(/\s+/);
        const words2 = possibleDuplicate.description.toLowerCase().split(/\s+/);
        const overlap = words1.filter((w: string) => words2.includes(w)).length;
        if (overlap > 0 || words1.join('') === words2.join('')) {
          duplicateAnomaly = true;
          anomalies.push({
            type: AnomalyType.DUPLICATE_ENTRY,
            severity: AnomalySeverity.WARNING,
            field: 'description',
            message: `Possible duplicate expense found on ${possibleDuplicate.expenseDate.toISOString().slice(0, 10)}: "${possibleDuplicate.description}" for ${possibleDuplicate.currency} ${possibleDuplicate.originalAmount}`,
          });
        }
      }

      const needsReview = duplicateAnomaly || anomalies.some(a => a.type === 'REFUND' || a.type === 'SETTLEMENT_DETECTED' || a.type === 'AMBIGUOUS_MEMBER');

      if (needsReview) {
        // Write row as FLAGGED (needs review)
        await prisma.$transaction(async (tx) => {
          await tx.importRow.create({
            data: {
              importId: importBatch.id,
              rowNumber: rowNum,
              verdict: ImportRowVerdict.FLAGGED,
              rawData: rawRow,
            },
          });
          for (const anomaly of anomalies) {
            await tx.importAnomaly.create({
              data: {
                importId: importBatch.id,
                rowNumber: rowNum,
                type: anomaly.type,
                severity: anomaly.severity,
                field: anomaly.field,
                message: anomaly.message,
                rawData: rawRow,
              },
            });
          }
        });
        continue;
      }

      // 9. Success - Create Expense
      try {
        await prisma.$transaction(async (tx) => {
          // Create the main expense row
          const expense = await tx.expense.create({
            data: {
              groupId,
              paidById: payerId,
              originalAmount,
              currency: currencyStr as Currency,
              exchangeRate,
              baseInrAmount,
              description,
              splitType: splitTypeStr as SplitType,
              expenseDate,
            },
          });

          // Calculate splits
          const calculatedShares: { userId: string; originalAmount: number; baseInrAmount: number }[] = [];
          const uniqueParticipants = activeSplitsData.map((s) => s.userId);

          if (splitTypeStr === 'EQUAL') {
            const shareCount = uniqueParticipants.length;
            const originalShareBase = originalAmount / shareCount;
            const baseInrShareBase = baseInrAmount / shareCount;
            let originalSum = 0;
            let baseInrSum = 0;

            for (let i = 0; i < shareCount; i++) {
              const uId = uniqueParticipants[i]!;
              if (i === shareCount - 1) {
                calculatedShares.push({
                  userId: uId,
                  originalAmount: roundCurrency(originalAmount - originalSum),
                  baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
                });
              } else {
                const oRounded = roundCurrency(originalShareBase);
                const bRounded = roundCurrency(baseInrShareBase);
                originalSum += oRounded;
                baseInrSum += bRounded;
                calculatedShares.push({ userId: uId, originalAmount: oRounded, baseInrAmount: bRounded });
              }
            }
          } else if (splitTypeStr === 'EXACT') {
            const splitCount = activeSplitsData.length;
            let baseInrSum = 0;

            for (let i = 0; i < splitCount; i++) {
              const split = activeSplitsData[i]!;
              const oShare = split.share!;
              if (i === splitCount - 1) {
                calculatedShares.push({
                  userId: split.userId,
                  originalAmount: roundCurrency(oShare),
                  baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
                });
              } else {
                const bRounded = roundCurrency(oShare * exchangeRate);
                baseInrSum += bRounded;
                calculatedShares.push({
                  userId: split.userId,
                  originalAmount: roundCurrency(oShare),
                  baseInrAmount: bRounded,
                });
              }
            }
          } else if (splitTypeStr === 'PERCENTAGE') {
            const splitCount = activeSplitsData.length;
            let originalSum = 0;
            let baseInrSum = 0;

            for (let i = 0; i < splitCount; i++) {
              const split = activeSplitsData[i]!;
              const percent = split.share!;
              if (i === splitCount - 1) {
                calculatedShares.push({
                  userId: split.userId,
                  originalAmount: roundCurrency(originalAmount - originalSum),
                  baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
                });
              } else {
                const oRounded = roundCurrency((originalAmount * percent) / 100);
                const bRounded = roundCurrency((baseInrAmount * percent) / 100);
                originalSum += oRounded;
                baseInrSum += bRounded;
                calculatedShares.push({ userId: split.userId, originalAmount: oRounded, baseInrAmount: bRounded });
              }
            }
          } else if (splitTypeStr === 'SHARE') {
            const splitCount = activeSplitsData.length;
            let originalSum = 0;
            let baseInrSum = 0;
            const totalShares = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);

            for (let i = 0; i < splitCount; i++) {
              const split = activeSplitsData[i]!;
              const ratio = split.share! / totalShares;
              if (i === splitCount - 1) {
                calculatedShares.push({
                  userId: split.userId,
                  originalAmount: roundCurrency(originalAmount - originalSum),
                  baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
                });
              } else {
                const oRounded = roundCurrency(originalAmount * ratio);
                const bRounded = roundCurrency(baseInrAmount * ratio);
                originalSum += oRounded;
                baseInrSum += bRounded;
                calculatedShares.push({ userId: split.userId, originalAmount: oRounded, baseInrAmount: bRounded });
              }
            }
          }

          // Create shares
          await tx.expenseShare.createMany({
            data: calculatedShares.map((cs) => ({
              expenseId: expense.id,
              userId: cs.userId,
              originalAmount: cs.originalAmount,
              baseInrAmount: cs.baseInrAmount,
            })),
          });

          // Create ImportRow
          await tx.importRow.create({
            data: {
              importId: importBatch.id,
              rowNumber: rowNum,
              verdict: ImportRowVerdict.IMPORTED,
              rawData: rawRow,
              expenseId: expense.id,
            },
          });

          // If warnings (like INR exchange rate ignore) exist, store them
          for (const anomaly of anomalies) {
            await tx.importAnomaly.create({
              data: {
                importId: importBatch.id,
                rowNumber: rowNum,
                type: anomaly.type,
                severity: anomaly.severity,
                field: anomaly.field,
                message: anomaly.message,
                rawData: rawRow,
              },
            });
          }
        });

        successCount++;
      } catch (err: any) {
        failureCount++;
        await prisma.$transaction(async (tx) => {
          await tx.importRow.create({
            data: {
              importId: importBatch.id,
              rowNumber: rowNum,
              verdict: ImportRowVerdict.SKIPPED,
              rawData: rawRow,
            },
          });
          await tx.importAnomaly.create({
            data: {
              importId: importBatch.id,
              rowNumber: rowNum,
              type: AnomalyType.OTHER,
              severity: AnomalySeverity.ERROR,
              message: `Database insertion error: ${err.message}`,
              rawData: rawRow,
            },
          });
        });
      }
    }

    // 10. Update Import batch status
    const completedImport = await prisma.import.update({
      where: { id: importBatch.id },
      data: {
        successCount,
        failureCount,
        status: ImportStatus.COMPLETED,
        completedAt: new Date(),
      },
      include: {
        anomalies: true,
        rows: {
          include: {
            expense: true,
          },
        },
      },
    });

    return completedImport;
  }

  /**
   * Lists import batches for a group.
   */
  static async listImportReports(groupId: string, userId: string) {
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId,
        leftAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenError('Only active group members can view import reports');
    }

    return prisma.import.findMany({
      where: { groupId },
      orderBy: { createdAt: 'desc' },
      include: {
        anomalies: {
          select: { id: true },
        },
      },
    });
  }

  /**
   * Resolves a flagged duplicate import row.
   * Action = ACCEPT creates the expense, action = SKIP marks it as SKIPPED.
   */
  static async resolveDuplicate(groupId: string, userId: string, importId: string, rowId: string, action: 'ACCEPT' | 'SKIP') {
    // 1. Verify group membership
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId,
        leftAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenError('Only active group members can resolve imports');
    }

    // 2. Fetch the import row
    const importRow = await prisma.importRow.findFirst({
      where: {
        id: rowId,
        importId,
        verdict: ImportRowVerdict.FLAGGED,
      },
    });

    if (!importRow) {
      throw new NotFoundError('Flagged import row not found or already resolved');
    }

    const rawRow = importRow.rawData as any as CSVRow;

    if (action === 'SKIP') {
      return prisma.$transaction(async (tx) => {
        const updatedRow = await tx.importRow.update({
          where: { id: rowId },
          data: {
            verdict: ImportRowVerdict.SKIPPED,
            reviewedAt: new Date(),
            reviewNote: 'User opted to skip suspected duplicate.',
          },
        });

        // Adjust batch counters
        await tx.import.update({
          where: { id: importId },
          data: {
            failureCount: { increment: 1 },
          },
        });

        return updatedRow;
      });
    }

    // Resolve as ACCEPT -> Create expense
    const description = (rawRow.description || '').trim();
    const originalAmount = parseFloat(rawRow.originalAmount);
    const currencyStr = rawRow.currency.trim().toUpperCase();
    const exchangeRate = rawRow.exchangeRate ? parseFloat(rawRow.exchangeRate) : 1.0;
    const baseInrAmount = roundCurrency(originalAmount * exchangeRate);
    let splitTypeStr = rawRow.splitType.trim().toUpperCase();
    if (splitTypeStr === 'UNEQUAL') splitTypeStr = 'EXACT';
    if (splitTypeStr === 'PERCENTAGES') splitTypeStr = 'PERCENTAGE';
    if (splitTypeStr === 'SHARES') splitTypeStr = 'SHARE';
    let safeDateStr = rawRow.expenseDate;
    if (/^\d{2}-\d{2}-\d{4}$/.test(safeDateStr)) {
      const [dd, mm, yyyy] = safeDateStr.split('-');
      safeDateStr = `${yyyy}-${mm}-${dd}`;
    }
    const expenseDate = new Date(safeDateStr);

    // Load all memberships to do fuzzy name/email resolution
    const groupMemberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    const emailToUserMap = new Map<string, { id: string; joinedAt: Date; leftAt: Date | null; name: string }>();
    for (const gm of groupMemberships) {
      if (gm.user.email) {
        emailToUserMap.set(gm.user.email.toLowerCase().trim(), {
          id: gm.userId, joinedAt: gm.joinedAt, leftAt: gm.leftAt, name: gm.user.name,
        });
      }
    }

    const resolveMember = (identifier: string) => {
      const lowerId = identifier.trim().toLowerCase();
      if (!lowerId) return null;
      const member = emailToUserMap.get(lowerId);
      if (member) return member;
      const matches = Array.from(emailToUserMap.values()).filter(m => m.name.toLowerCase() === lowerId);
      if (matches.length === 1) return matches[0]!;
      return null;
    };

    // Map payer email to user
    const payerEmail = rawRow.payerEmail.trim().toLowerCase();
    const payerUser = resolveMember(payerEmail);

    if (!payerUser) {
      throw new ValidationError(`Payer with identifier ${payerEmail} could not be resolved or is no longer reachable in the group`);
    }

    // Parse and resolve split user IDs
    const splitParts = rawRow.splits.split(';').map((s: string) => s.trim()).filter(Boolean);
    const resolvedSplits: { userId: string; share?: number }[] = [];

    for (const part of splitParts) {
      const match = part.match(/^(.*?)[:\s]+([\d.]+%?)$/);
      let email = part;
      let share: number | undefined;
      if (match) {
        email = match[1]!;
        share = parseFloat(match[2]!.replace('%', ''));
      }
      const member = resolveMember(email);
      if (!member) {
        throw new ValidationError(`Split participant with identifier ${email} could not be resolved`);
      }
      resolvedSplits.push({ userId: member.id, share });
    }

    return prisma.$transaction(async (tx) => {
      // If this is a settlement, maybe create a Settlement instead?
      // Wait, if the user clicked ACCEPT, we create an Expense right now because the frontend calls it `expense.create`.
      // The user said: "Do NOT automatically convert to Settlement. Flag as SETTLEMENT_DETECTED. REVIEW_REQUIRED."
      // If the user accepts it via resolveDuplicate, they are accepting the row.
      // We will create it as an Expense for now because they explicitly didn't want automatic conversions. Wait, if they review it, how do they convert it to a Settlement? The backend doesn't have an endpoint for that. We'll stick to the assignment rule: avoid silent financial assumptions. Inserting as Expense correctly leaves the burden on the user.

      const expense = await tx.expense.create({
        data: {
          groupId,
          paidById: payerUser.id,
          originalAmount,
          currency: currencyStr as Currency,
          exchangeRate,
          baseInrAmount,
          description,
          splitType: splitTypeStr as SplitType,
          expenseDate,
        },
      });

      // Calculate shares
      const calculatedShares: { userId: string; originalAmount: number; baseInrAmount: number }[] = [];
      const uniqueParticipants = resolvedSplits.map((s) => s.userId);

      if (splitTypeStr === 'EQUAL') {
        const shareCount = uniqueParticipants.length;
        const originalShareBase = originalAmount / shareCount;
        const baseInrShareBase = baseInrAmount / shareCount;
        let originalSum = 0;
        let baseInrSum = 0;

        for (let i = 0; i < shareCount; i++) {
          const uId = uniqueParticipants[i]!;
          if (i === shareCount - 1) {
            calculatedShares.push({
              userId: uId,
              originalAmount: roundCurrency(originalAmount - originalSum),
              baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
            });
          } else {
            const oRounded = roundCurrency(originalShareBase);
            const bRounded = roundCurrency(baseInrShareBase);
            originalSum += oRounded;
            baseInrSum += bRounded;
            calculatedShares.push({ userId: uId, originalAmount: oRounded, baseInrAmount: bRounded });
          }
        }
      } else if (splitTypeStr === 'EXACT') {
        const splitCount = resolvedSplits.length;
        let baseInrSum = 0;

        for (let i = 0; i < splitCount; i++) {
          const split = resolvedSplits[i]!;
          const oShare = split.share!;
          if (i === splitCount - 1) {
            calculatedShares.push({
              userId: split.userId,
              originalAmount: roundCurrency(oShare),
              baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
            });
          } else {
            const bRounded = roundCurrency(oShare * exchangeRate);
            baseInrSum += bRounded;
            calculatedShares.push({
              userId: split.userId,
              originalAmount: roundCurrency(oShare),
              baseInrAmount: bRounded,
            });
          }
        }
      } else if (splitTypeStr === 'PERCENTAGE') {
        const splitCount = resolvedSplits.length;
        let originalSum = 0;
        let baseInrSum = 0;

        for (let i = 0; i < splitCount; i++) {
          const split = resolvedSplits[i]!;
          const percent = split.share!;
          if (i === splitCount - 1) {
            calculatedShares.push({
              userId: split.userId,
              originalAmount: roundCurrency(originalAmount - originalSum),
              baseInrAmount: roundCurrency(baseInrAmount - baseInrSum),
            });
          } else {
            const oRounded = roundCurrency((originalAmount * percent) / 100);
            const bRounded = roundCurrency((baseInrAmount * percent) / 100);
            originalSum += oRounded;
            baseInrSum += bRounded;
            calculatedShares.push({ userId: split.userId, originalAmount: oRounded, baseInrAmount: bRounded });
          }
        }
      }

      await tx.expenseShare.createMany({
        data: calculatedShares.map((cs) => ({
          expenseId: expense.id,
          userId: cs.userId,
          originalAmount: cs.originalAmount,
          baseInrAmount: cs.baseInrAmount,
        })),
      });

      // Update ImportRow verdict
      const updatedRow = await tx.importRow.update({
        where: { id: rowId },
        data: {
          verdict: ImportRowVerdict.ACCEPTED,
          expenseId: expense.id,
          reviewedAt: new Date(),
          reviewNote: 'User approved suspect duplicate.',
        },
      });

      // Adjust batch success counters
      await tx.import.update({
        where: { id: importId },
        data: {
          successCount: { increment: 1 },
        },
      });

      return updatedRow;
    });
  }

  /**
   * Retrieves an import report details.
   */
  static async getImportReport(groupId: string, userId: string, importId: string) {
    const membership = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        userId,
        leftAt: null,
      },
    });

    if (!membership) {
      throw new ForbiddenError('Only active group members can view import reports');
    }

    const importBatch = await prisma.import.findFirst({
      where: {
        id: importId,
        groupId,
      },
      include: {
        anomalies: true,
        rows: {
          include: {
            expense: {
              select: {
                id: true,
                description: true,
                originalAmount: true,
                currency: true,
                expenseDate: true,
              },
            },
          },
        },
      },
    });

    if (!importBatch) {
      throw new NotFoundError('Import report not found');
    }

    return importBatch;
  }
}
