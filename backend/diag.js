const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.importAnomaly.findMany({orderBy: { createdAt: 'desc' }, take: 10}).then(res => console.log(JSON.stringify(res, null, 2))).catch(e => console.error(e)).finally(() => prisma.$disconnect());
