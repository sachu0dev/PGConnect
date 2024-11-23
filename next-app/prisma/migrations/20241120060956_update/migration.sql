/*
  Warnings:

  - You are about to drop the column `pgOwnerId` on the `User` table. All the data in the column will be lost.
  - You are about to drop the `PgOwner` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('PgOwner', 'Normal');

-- DropForeignKey
ALTER TABLE "Pg" DROP CONSTRAINT "Pg_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_pgOwnerId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "pgOwnerId",
ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'PgOwner';

-- DropTable
DROP TABLE "PgOwner";

-- AddForeignKey
ALTER TABLE "Pg" ADD CONSTRAINT "Pg_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
