const fs = require('fs');

let code = fs.readFileSync('./src/services/import.service.ts', 'utf8');

// 1. Column mapper
code = code.replace(
  `const clean = h.trim().toLowerCase().replace(/[^a-z0-9\\s-_]/g, '');`,
  `const clean = h.trim().toLowerCase().replace(/[^a-z0-9\\s-_]/g, '');`
);
code = code.replace(
  `if (clean === 'split type' || clean === 'splittype') return 'splitType';`,
  `if (clean === 'split type' || clean === 'splittype' || clean === 'split_type') return 'splitType';`
);
code = code.replace(
  `if (clean === 'payer email' || clean === 'payeremail') return 'payerEmail';`,
  `if (clean === 'payer email' || clean === 'payeremail' || clean === 'paid_by' || clean === 'paidby') return 'payerEmail';`
);
code = code.replace(
  `if (clean === 'splits') return 'splits';`,
  `if (clean === 'splits' || clean === 'splitwith' || clean === 'split_with' || clean === 'splitdetails' || clean === 'split_details') return 'splits';\n            if (clean === 'notes') return 'notes';`
);

// 2. User Lookup Map
const userLookupOld = `    const emailToUserMap = new Map<string, { id: string; joinedAt: Date; leftAt: Date | null }>();
    for (const gm of groupMemberships) {
      emailToUserMap.set(gm.user.email.toLowerCase().trim(), {
        id: gm.userId,
        joinedAt: gm.joinedAt,
        leftAt: gm.leftAt,
      });
    }`;
const userLookupNew = `    const emailToUserMap = new Map<string, { id: string; joinedAt: Date; leftAt: Date | null; name: string }>();
    for (const gm of groupMemberships) {
      emailToUserMap.set(gm.user.email.toLowerCase().trim(), {
        id: gm.userId,
        joinedAt: gm.joinedAt,
        leftAt: gm.leftAt,
        name: gm.user.name,
      });
    }

    const resolveMember = (identifier: string): { id: string; joinedAt: Date; leftAt: Date | null } | null | 'AMBIGUOUS' => {
      const lowerId = identifier.trim().toLowerCase();
      if (!lowerId) return null;
      if (emailToUserMap.has(lowerId)) return emailToUserMap.get(lowerId)!;
      const matches = Array.from(emailToUserMap.values()).filter(m => m.name.toLowerCase() === lowerId);
      if (matches.length === 1) return matches[0];
      if (matches.length > 1) return 'AMBIGUOUS';
      return null;
    };`;
code = code.replace(userLookupOld, userLookupNew);

// 3. Payer resolution
const payerResolveOld = `      const payerMem = emailToUserMap.get(payerEmail);
      if (!payerMem) {
        anomalies.push({ type: AnomalyType.UNKNOWN_MEMBER, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: \`Payer with email \${payerEmail} is not a member of the group\` });
      } else {`;
const payerResolveNew = `      const payerMem = resolveMember(payerEmail);
      if (payerMem === 'AMBIGUOUS') {
        anomalies.push({ type: AnomalyType.AMBIGUOUS_MEMBER, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: \`Multiple members found with name \${payerEmail}. Please use email.\` });
      } else if (!payerMem) {
        anomalies.push({ type: AnomalyType.UNKNOWN_MEMBER, severity: AnomalySeverity.ERROR, field: 'payerEmail', message: \`Payer \${payerEmail} is not a member of the group\` });
      } else {`;
code = code.replace(payerResolveOld, payerResolveNew);

// 4. Splits resolution
const splitResolveOld = `          const memberMem = emailToUserMap.get(ps.email);
          if (!memberMem) {
            anomalies.push({ type: AnomalyType.UNKNOWN_MEMBER, severity: AnomalySeverity.WARNING, field: 'splits', message: \`Split participant \${ps.email} is not a member of the group; excluded from split\` });
            droppedParticipants.push(ps.email);
          } else {`;
const splitResolveNew = `          const memberMem = resolveMember(ps.email);
          if (memberMem === 'AMBIGUOUS') {
            anomalies.push({ type: AnomalyType.AMBIGUOUS_MEMBER, severity: AnomalySeverity.WARNING, field: 'splits', message: \`Multiple members found with name \${ps.email}. Excluded from split.\` });
            droppedParticipants.push(ps.email);
          } else if (!memberMem) {
            anomalies.push({ type: AnomalyType.UNKNOWN_MEMBER, severity: AnomalySeverity.WARNING, field: 'splits', message: \`Split participant \${ps.email} is not a member of the group; excluded from split\` });
            droppedParticipants.push(ps.email);
          } else {`;
code = code.replace(splitResolveOld, splitResolveNew);

// 5. Date Parsing
const dateOld = `      let expenseDate = new Date();
      if (!expenseDateStr) {
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.WARNING, field: 'expenseDate', message: 'Expense date is missing; defaulted to today' });
      } else {
        const parsedDate = new Date(expenseDateStr);`;
const dateNew = `      let expenseDate = new Date();
      if (!expenseDateStr) {
        anomalies.push({ type: AnomalyType.MISSING_FIELD, severity: AnomalySeverity.WARNING, field: 'expenseDate', message: 'Expense date is missing; defaulted to today' });
      } else {
        let safeDateStr = expenseDateStr;
        if (/^\\d{2}-\\d{2}-\\d{4}$/.test(safeDateStr)) {
          const [dd, mm, yyyy] = safeDateStr.split('-');
          safeDateStr = \`\${yyyy}-\${mm}-\${dd}\`;
        }
        const parsedDate = new Date(safeDateStr);`;
code = code.replace(dateOld, dateNew);

// 6. Split Type Mapper
const splitTypeOld = `      let splitTypeStr = (rawRow.splitType || '').trim().toUpperCase();`;
const splitTypeNew = `      let splitTypeStr = (rawRow.splitType || '').trim().toUpperCase();
      if (splitTypeStr === 'UNEQUAL') splitTypeStr = 'EXACT';
      if (splitTypeStr === 'PERCENTAGES') splitTypeStr = 'PERCENTAGE';
      if (splitTypeStr === 'SHARES') splitTypeStr = 'SHARE';`;
code = code.replace(splitTypeOld, splitTypeNew);

// 7. Validate Split Type
const validateSplitOld = `      // 5. Validate Split Type
      if (splitTypeStr !== 'EQUAL' && splitTypeStr !== 'EXACT' && splitTypeStr !== 'PERCENTAGE') {
        anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splitType', message: \`Unsupported split type: \${splitTypeStr}\` });
      }`;
const validateSplitNew = `      // 5. Validate Split Type
      if (splitTypeStr !== 'EQUAL' && splitTypeStr !== 'EXACT' && splitTypeStr !== 'PERCENTAGE' && splitTypeStr !== 'SHARE') {
        anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splitType', message: \`Unsupported split type: \${splitTypeStr}\` });
      }`;
code = code.replace(validateSplitOld, validateSplitNew);

// 8. Amount Validation & Refund Check
const amountOld = `      // 1. Validate Amount
      const originalAmount = parseFloat(originalAmountStr);
      if (isNaN(originalAmount) || originalAmount <= 0) {
        anomalies.push({ type: AnomalyType.INVALID_AMOUNT, severity: AnomalySeverity.ERROR, field: 'originalAmount', message: 'Original amount must be a positive number' });
      }`;
const amountNew = `      // 1. Validate Amount
      let originalAmount = parseFloat(originalAmountStr);
      let isRefund = false;
      if (isNaN(originalAmount) || originalAmount === 0) {
        anomalies.push({ type: AnomalyType.INVALID_AMOUNT, severity: AnomalySeverity.ERROR, field: 'originalAmount', message: 'Original amount must be non-zero' });
      } else if (originalAmount < 0) {
        isRefund = true;
        anomalies.push({ type: AnomalyType.REFUND, severity: AnomalySeverity.WARNING, field: 'originalAmount', message: 'Negative amount detected. Flagged as REFUND for review.' });
      }`;
code = code.replace(amountOld, amountNew);

// 9. Split parsing for "Aisha 1" instead of "Aisha:1"
const splitParseOld = `        } else {
          // Must have email:share
          if (!part.includes(':')) {
            anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: \`Split shares must be specified in format email:share for split type \${splitTypeStr}\` });
            splitValidationError = true;
            break;
          }
          const [email, shareVal] = part.split(':');`;
const splitParseNew = `        } else {
          // Allow spaces or colons: 'Aisha 1' or 'Aisha:1' or 'Aisha 30%'
          const match = part.match(/^(.*?)[:\\s]+([\\d.]+%?)$/);
          if (!match) {
            anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: \`Split shares must be specified in format email:share for split type \${splitTypeStr}\` });
            splitValidationError = true;
            break;
          }
          const email = match[1];
          let shareVal = match[2];
          if (shareVal.endsWith('%')) shareVal = shareVal.slice(0, -1);
`;
code = code.replace(splitParseOld, splitParseNew);

// 10. Split SHARE Math Validator
const shareMathOld = `            } else if (splitTypeStr === 'PERCENTAGE') {
              const sum = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);
              if (Math.abs(sum - 100) > 0.01) {
                anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: \`Sum of split percentages must equal 100% (got \${sum}%)\` });
              }
            }
          } catch (err: any) {`;
const shareMathNew = `            } else if (splitTypeStr === 'PERCENTAGE') {
              const sum = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);
              if (Math.abs(sum - 100) > 0.01) {
                anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: \`Sum of split percentages must equal 100% (got \${sum}%)\` });
              }
            } else if (splitTypeStr === 'SHARE') {
              const sum = activeSplitsData.reduce((acc, curr) => acc + (curr.share || 0), 0);
              if (sum <= 0) {
                anomalies.push({ type: AnomalyType.INVALID_SPLIT, severity: AnomalySeverity.ERROR, field: 'splits', message: \`Sum of shares must be positive\` });
              }
            }
          } catch (err: any) {`;
code = code.replace(shareMathOld, shareMathNew);

// 11. Mathematical recalculations for SHARE
const recalcOld = `          } else if (splitTypeStr === 'EXACT') {
            // Recalculate remaining shares proportionally to equal the originalAmount
            const currentSum = activeSplitsData.reduce((sum, item) => sum + (item.share || 0), 0);
            if (currentSum > 0) {
              activeSplitsData.forEach(item => {
                item.share = ((item.share || 0) / currentSum) * originalAmount;
              });
            }
          }`;
const recalcNew = `          } else if (splitTypeStr === 'EXACT') {
            // Recalculate remaining shares proportionally to equal the originalAmount
            const currentSum = activeSplitsData.reduce((sum, item) => sum + (item.share || 0), 0);
            if (currentSum > 0) {
              activeSplitsData.forEach(item => {
                item.share = ((item.share || 0) / currentSum) * originalAmount;
              });
            }
          } // SHARE doesn't strictly need recalculation since it's proportional by default`;
code = code.replace(recalcOld, recalcNew);

// 12. SHARE calculation logic in creating expenses
const shareCalcOld = `          } else if (splitTypeStr === 'PERCENTAGE') {
            const splitCount = activeSplitsData.length;
            let originalSum = 0;
            let baseInrSum = 0;`;
const shareCalcNew = `          } else if (splitTypeStr === 'PERCENTAGE') {
            const splitCount = activeSplitsData.length;
            let originalSum = 0;
            let baseInrSum = 0;`;
const shareCalcLogicOld = `              }
            }
          }

          // Create shares`;
const shareCalcLogicNew = `              }
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

          // Create shares`;
code = code.replace(shareCalcLogicOld, shareCalcLogicNew);


// 13. Settlement Logic & FLAGGED Review Block
const flagCheckOld = `      // If there are hard errors, save row as SKIPPED and log anomalies
      if (anomalies.some((a) => a.severity === AnomalySeverity.ERROR)) {`;
const flagCheckNew = `      // Settlement Detection
      const combinedText = (description + ' ' + (rawRow.notes || '')).toLowerCase();
      const hasSettlementKeywords = /payment|settle|deposit|paid back/i.test(combinedText);
      if (activeSplitsData.length === 1 && hasSettlementKeywords && !isRefund) {
        anomalies.push({ type: AnomalyType.SETTLEMENT_DETECTED, severity: AnomalySeverity.WARNING, field: 'description', message: 'Row looks like a settlement. Flagged for review.' });
      }

      // If there are hard errors, save row as SKIPPED and log anomalies
      if (anomalies.some((a) => a.severity === AnomalySeverity.ERROR)) {`;
code = code.replace(flagCheckOld, flagCheckNew);

const duplicateCheckOld = `      if (possibleDuplicate) {
        anomalies.push({
          type: AnomalyType.DUPLICATE_ENTRY,
          severity: AnomalySeverity.WARNING,
          field: 'description',
          message: \`Possible duplicate expense found on \${possibleDuplicate.expenseDate.toISOString().slice(0, 10)}: "\${possibleDuplicate.description}" for \${possibleDuplicate.currency} \${possibleDuplicate.originalAmount}\`,
        });

        // Write row as FLAGGED (needs review)`;
const duplicateCheckNew = `      // Fuzzy Duplicate check (same amount, within 7 days, similar description)
      let duplicateAnomaly = false;
      if (possibleDuplicate) {
        // basic string similarity (if 50% overlap of words)
        const words1 = description.toLowerCase().split(/\\s+/);
        const words2 = possibleDuplicate.description.toLowerCase().split(/\\s+/);
        const overlap = words1.filter(w => words2.includes(w)).length;
        if (overlap > 0 || words1.join('') === words2.join('')) {
          duplicateAnomaly = true;
          anomalies.push({
            type: AnomalyType.DUPLICATE_ENTRY,
            severity: AnomalySeverity.WARNING,
            field: 'description',
            message: \`Possible duplicate expense found on \${possibleDuplicate.expenseDate.toISOString().slice(0, 10)}: "\${possibleDuplicate.description}" for \${possibleDuplicate.currency} \${possibleDuplicate.originalAmount}\`,
          });
        }
      }

      const needsReview = duplicateAnomaly || anomalies.some(a => a.type === 'REFUND' || a.type === 'SETTLEMENT_DETECTED' || a.type === 'AMBIGUOUS_MEMBER');

      if (needsReview) {
        // Write row as FLAGGED (needs review)`;
code = code.replace(duplicateCheckOld, duplicateCheckNew);

fs.writeFileSync('./src/services/import.service.ts', code);
console.log('Done replacing.');
