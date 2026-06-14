const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const latestImport = await prisma.import.findFirst({
    orderBy: { createdAt: 'desc' },
    include: {
      anomalies: true,
      rows: {
        where: { verdict: 'SKIPPED' },
        orderBy: { rowNumber: 'asc' },
        take: 10
      }
    }
  });

  if (!latestImport) {
    console.log("No imports found.");
    return;
  }

  // 1 & 2. Count anomalies by type
  const typeCounts = {};
  for (const a of latestImport.anomalies) {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  }
  
  const sortedCounts = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);

  console.log("ANOMALY TYPE | COUNT");
  for (const [type, count] of sortedCounts) {
    console.log(`${type} | ${count}`);
  }
  
  console.log("\n----------------------------------\n");

  // 3 & 4. First 10 rejected rows
  for (const row of latestImport.rows) {
    console.log(`ROW NUMBER: ${row.rowNumber}`);
    
    // Find anomalies for this row
    const rowAnomalies = latestImport.anomalies.filter(a => a.rowNumber === row.rowNumber);
    
    console.log("ANOMALIES:");
    for (const a of rowAnomalies) {
      console.log(` - [${a.severity}] ${a.type} (Field: ${a.field}): ${a.message}`);
    }
    
    console.log(`IMPORT DECISION: ${row.verdict}`);
    console.log("");
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
