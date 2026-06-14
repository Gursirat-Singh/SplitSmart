const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const expenses = await prisma.expense.findMany({
    include: { shares: true }
  });

  for (const e of expenses) {
    const sumShares = e.shares.reduce((acc, s) => acc + Number(s.baseInrAmount), 0);
    if (Math.abs(sumShares - Number(e.baseInrAmount)) > 0.01) {
      console.log(`Imbalance in Expense ${e.id}: Expense=${e.baseInrAmount}, Shares=${sumShares}`);
    }
  }
  console.log('Checked all expenses.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
