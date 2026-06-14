const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const anomalies = await prisma.importAnomaly.findMany({
    take: 50,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Anomalies:', JSON.stringify(anomalies, null, 2));

  const rows = await prisma.importRow.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log('Rows:', JSON.stringify(rows, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
