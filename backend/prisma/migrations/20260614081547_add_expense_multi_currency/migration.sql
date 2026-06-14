/*
  Warnings:

  - You are about to drop the column `amount` on the `expense_shares` table. All the data in the column will be lost.
  - You are about to drop the column `amount` on the `expenses` table. All the data in the column will be lost.
  - Added the required column `baseInrAmount` to the `expense_shares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAmount` to the `expense_shares` table without a default value. This is not possible if the table is not empty.
  - Added the required column `baseInrAmount` to the `expenses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalAmount` to the `expenses` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "expense_shares" DROP COLUMN "amount",
ADD COLUMN     "baseInrAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "originalAmount" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "expenses" DROP COLUMN "amount",
ADD COLUMN     "baseInrAmount" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "exchangeRate" DECIMAL(10,4) NOT NULL DEFAULT 1.0,
ADD COLUMN     "originalAmount" DECIMAL(12,2) NOT NULL;
