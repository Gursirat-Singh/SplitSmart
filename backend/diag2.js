const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.importRow.findMany({where: { importId: '77e179df-7c9e-4ae0-a39b-b8ddefc8d31c' }, orderBy: { rowNumber: 'asc' }}).then(res => console.log(JSON.stringify(res.map(r => r.rawData), null, 2))).finally(() => prisma.$disconnect());
