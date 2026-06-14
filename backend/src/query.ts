import { prisma } from './utils/prisma';

async function main() {
  const users = await prisma.user.findMany({
    where: { name: { startsWith: 'Aisha' } }
  });
  console.log('Users:', users);

  const balances = await prisma.$queryRaw`
      SELECT
          es."userId"    AS debtor_id,
          e."paidById"   AS creditor_id,
          SUM(es."baseInrAmount") AS total_debt
      FROM expense_shares es
      JOIN expenses e ON e.id = es."expenseId"
      GROUP BY es."userId", e."paidById";
  `;
  console.log('Balances:', balances);
}

main().catch(console.error).finally(() => prisma.$disconnect());
