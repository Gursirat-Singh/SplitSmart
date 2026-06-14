const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const anomalies = await prisma.importAnomaly.findMany({
    where: {
      message: { contains: 'Aisha' }
    },
    take: 50,
  });
  console.log('Anomalies:', JSON.stringify(anomalies, null, 2));

  const rows = await prisma.importRow.findMany({
    take: 50,
  });
  // Filter locally just to see what the raw data has for Aisha 1
  const aisha1Rows = rows.filter(r => JSON.stringify(r.rawData).includes('Aisha 1'));
  console.log('Aisha 1 Rows:', JSON.stringify(aisha1Rows, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
