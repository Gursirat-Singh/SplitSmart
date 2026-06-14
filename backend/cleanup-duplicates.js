const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicates() {
  console.log('Starting duplicate members cleanup...');

  // 1. Fetch all users
  const allUsers = await prisma.user.findMany();
  console.log(`Found ${allUsers.length} total users in database.`);

  // 2. Identify duplicate candidates
  // We look for users whose names end with a space followed by digits (e.g. "Aisha 1")
  // and see if a user exists with the base name (e.g. "Aisha")
  const suffixRegex = /^(.+?)\s+\d+(?:\.\d+)?$/;

  const duplicatesToMerge = [];

  for (const user of allUsers) {
    const match = user.name.match(suffixRegex);
    if (match) {
      const baseName = match[1].trim();
      // Look for a user with the base name (case-insensitive)
      const baseUser = allUsers.find(u => u.name.toLowerCase() === baseName.toLowerCase() && u.id !== user.id);
      if (baseUser) {
        duplicatesToMerge.push({
          duplicateUser: user,
          baseUser: baseUser
        });
      }
    }
  }

  console.log(`Identified ${duplicatesToMerge.length} duplicate pairs to merge:`);
  for (const pair of duplicatesToMerge) {
    console.log(`  - "${pair.duplicateUser.name}" (ID: ${pair.duplicateUser.id}) -> "${pair.baseUser.name}" (ID: ${pair.baseUser.id})`);
  }

  if (duplicatesToMerge.length === 0) {
    console.log('No duplicate users found.');
    return;
  }

  // 3. Process each merge sequentially
  for (const { duplicateUser, baseUser } of duplicatesToMerge) {
    console.log(`\nMerging "${duplicateUser.name}" into "${baseUser.name}"...`);

    // A. Update expenses paid by duplicate
    const updatedExpenses = await prisma.expense.updateMany({
      where: { paidById: duplicateUser.id },
      data: { paidById: baseUser.id }
    });
    console.log(`    Moved ${updatedExpenses.count} paid expenses.`);

    // B. Update settlements paid by duplicate
    const updatedSettlementsPaid = await prisma.settlement.updateMany({
      where: { paidById: duplicateUser.id },
      data: { paidById: baseUser.id }
    });
    console.log(`    Moved ${updatedSettlementsPaid.count} settlements paid by duplicate.`);

    // C. Update settlements paid to duplicate
    const updatedSettlementsReceived = await prisma.settlement.updateMany({
      where: { paidToId: duplicateUser.id },
      data: { paidToId: baseUser.id }
    });
    console.log(`    Moved ${updatedSettlementsReceived.count} settlements paid to duplicate.`);

    // D. Merge Expense Shares
    const duplicateShares = await prisma.expenseShare.findMany({
      where: { userId: duplicateUser.id }
    });

    let updatedSharesCount = 0;
    let mergedSharesCount = 0;

    for (const dupShare of duplicateShares) {
      // Check if base user already has a share in the same expense
      const baseShare = await prisma.expenseShare.findUnique({
        where: {
          expenseId_userId: {
            expenseId: dupShare.expenseId,
            userId: baseUser.id
          }
        }
      });

      if (baseShare) {
        // Merge amounts
        const newOriginal = Number(baseShare.originalAmount) + Number(dupShare.originalAmount);
        const newBaseInr = Number(baseShare.baseInrAmount) + Number(dupShare.baseInrAmount);
        
        await prisma.expenseShare.update({
          where: { id: baseShare.id },
          data: {
            originalAmount: newOriginal,
            baseInrAmount: newBaseInr
          }
        });
        
        // Delete duplicate share
        await prisma.expenseShare.delete({
          where: { id: dupShare.id }
        });
        mergedSharesCount++;
      } else {
        // Point duplicate share to base user
        await prisma.expenseShare.update({
          where: { id: dupShare.id },
          data: { userId: baseUser.id }
        });
        updatedSharesCount++;
      }
    }
    console.log(`    Merged/moved expense shares: ${updatedSharesCount} updated, ${mergedSharesCount} merged/deleted.`);

    // E. Merge Group Memberships
    const duplicateMemberships = await prisma.groupMembership.findMany({
      where: { userId: duplicateUser.id }
    });

    for (const dupMember of duplicateMemberships) {
      // Find if base user already in the group
      const baseMember = await prisma.groupMembership.findFirst({
        where: {
          groupId: dupMember.groupId,
          userId: baseUser.id
        }
      });

      if (baseMember) {
        // Base user already a member, safe to delete duplicate membership
        await prisma.groupMembership.delete({
          where: { id: dupMember.id }
        });
      } else {
        // Move membership to base user
        await prisma.groupMembership.update({
          where: { id: dupMember.id },
          data: { userId: baseUser.id }
        });
      }
    }
    console.log(`    Merged group memberships.`);

    // F. Delete the duplicate User
    await prisma.user.delete({
      where: { id: duplicateUser.id }
    });
    console.log(`    Successfully deleted user "${duplicateUser.name}".`);
  }

  console.log('\nData cleanup finished successfully!');
}

cleanupDuplicates()
  .catch((err) => {
    console.error('Error during cleanup:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
