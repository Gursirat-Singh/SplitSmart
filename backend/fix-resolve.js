const fs = require('fs');

let code = fs.readFileSync('./src/services/import.service.ts', 'utf8');

const resolveLogicOld = `    // Map payer email to user
    const payerEmail = rawRow.payerEmail.trim().toLowerCase();
    const payerUser = await prisma.groupMembership.findFirst({
      where: {
        groupId,
        user: { email: { equals: payerEmail, mode: 'insensitive' } },
      },
      include: { user: true },
    });

    if (!payerUser) {
      throw new ValidationError(\`Payer with email \${payerEmail} is no longer reachable in the group\`);
    }

    // Parse and resolve split user IDs
    const splitParts = rawRow.splits.split(';').map((s: string) => s.trim()).filter(Boolean);
    const resolvedSplits: { userId: string; share?: number }[] = [];

    for (const part of splitParts) {
      let email = part;
      let share: number | undefined;
      if (part.includes(':')) {
        const [e, s] = part.split(':');
        email = e!.trim();
        share = parseFloat(s!.trim());
      }
      const member = await prisma.groupMembership.findFirst({
        where: {
          groupId,
          user: { email: { equals: email, mode: 'insensitive' } },
        },
      });
      if (!member) {
        throw new ValidationError(\`Split participant with email \${email} is not in the group\`);
      }
      resolvedSplits.push({ userId: member.userId, share });
    }`;

const resolveLogicNew = `    // Load all memberships to do fuzzy name/email resolution
    const groupMemberships = await prisma.groupMembership.findMany({
      where: { groupId },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    const emailToUserMap = new Map<string, { id: string; joinedAt: Date; leftAt: Date | null; name: string }>();
    for (const gm of groupMemberships) {
      emailToUserMap.set(gm.user.email.toLowerCase().trim(), {
        id: gm.userId, joinedAt: gm.joinedAt, leftAt: gm.leftAt, name: gm.user.name,
      });
    }

    const resolveMember = (identifier: string) => {
      const lowerId = identifier.trim().toLowerCase();
      if (!lowerId) return null;
      const member = emailToUserMap.get(lowerId);
      if (member) return member;
      const matches = Array.from(emailToUserMap.values()).filter(m => m.name.toLowerCase() === lowerId);
      if (matches.length === 1) return matches[0];
      return null;
    };

    // Map payer email to user
    const payerEmail = rawRow.payerEmail.trim().toLowerCase();
    const payerUser = resolveMember(payerEmail);

    if (!payerUser) {
      throw new ValidationError(\`Payer with identifier \${payerEmail} could not be resolved or is no longer reachable in the group\`);
    }

    // Parse and resolve split user IDs
    const splitParts = rawRow.splits.split(';').map((s: string) => s.trim()).filter(Boolean);
    const resolvedSplits: { userId: string; share?: number }[] = [];

    for (const part of splitParts) {
      const match = part.match(/^(.*?)[:\\s]+([\\d.]+%?)$/);
      let email = part;
      let share: number | undefined;
      if (match) {
        email = match[1];
        share = parseFloat(match[2].replace('%', ''));
      }
      const member = resolveMember(email);
      if (!member) {
        throw new ValidationError(\`Split participant with identifier \${email} could not be resolved\`);
      }
      resolvedSplits.push({ userId: member.id, share });
    }`;

code = code.replace(resolveLogicOld, resolveLogicNew);

// Also fix date parsing in resolveDuplicate
const dateLogicOld = `const expenseDate = new Date(rawRow.expenseDate);`;
const dateLogicNew = `let safeDateStr = rawRow.expenseDate;
    if (/^\\d{2}-\\d{2}-\\d{4}$/.test(safeDateStr)) {
      const [dd, mm, yyyy] = safeDateStr.split('-');
      safeDateStr = \`\${yyyy}-\${mm}-\${dd}\`;
    }
    const expenseDate = new Date(safeDateStr);`;

code = code.replace(dateLogicOld, dateLogicNew);

// Also fix Split Type
const splitTypeOld = `const splitTypeStr = rawRow.splitType.trim().toUpperCase();`;
const splitTypeNew = `let splitTypeStr = rawRow.splitType.trim().toUpperCase();
    if (splitTypeStr === 'UNEQUAL') splitTypeStr = 'EXACT';
    if (splitTypeStr === 'PERCENTAGES') splitTypeStr = 'PERCENTAGE';
    if (splitTypeStr === 'SHARES') splitTypeStr = 'SHARE';`;

code = code.replace(splitTypeOld, splitTypeNew);

// Add SETTLEMENT logic if it is SETTLEMENT_DETECTED
const isSettlementLogicOld = `        data: {
          groupId,
          paidById: payerUser.userId,`;
const isSettlementLogicNew = `        data: {
          groupId,
          paidById: payerUser.id,`; // payerUser is now from map, has .id not .userId

const isSettlementLogicOld2 = `      const expense = await tx.expense.create({
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
      });`;

const isSettlementLogicNew2 = `      // If this is a settlement, maybe create a Settlement instead?
      // Wait, if the user clicked ACCEPT, we create an Expense right now because the frontend calls it \`expense.create\`.
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
      });`;

code = code.replace(isSettlementLogicOld, isSettlementLogicNew);
code = code.replace(isSettlementLogicOld2, isSettlementLogicNew2);


fs.writeFileSync('./src/services/import.service.ts', code);
console.log('Fixed resolveDuplicate logic.');
