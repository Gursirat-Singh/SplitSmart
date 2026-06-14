const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany({ include: { shares: true } });
  const userBalances = {};

  for (const e of expenses) {
    if (!userBalances[e.paidById]) userBalances[e.paidById] = 0;
    userBalances[e.paidById] += Number(e.baseInrAmount);
    for (const s of e.shares) {
      if (!userBalances[s.userId]) userBalances[s.userId] = 0;
      userBalances[s.userId] -= Number(s.baseInrAmount);
    }
  }

  let total = 0;
  for (const [uid, bal] of Object.entries(userBalances)) {
    console.log(`User ${uid}: ${bal}`);
    total += bal;
  }
  console.log(`Total group sum: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
