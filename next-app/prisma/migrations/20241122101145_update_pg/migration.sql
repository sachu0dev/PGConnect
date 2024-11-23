/*
  Warnings:

  - You are about to drop the column `accountType` on the `User` table. All the data in the column will be lost.
  - Made the column `contact` on table `Pg` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Pg` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rentPerMonth` on table `Pg` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Pg" ALTER COLUMN "contact" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "rentPerMonth" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "accountType";

-- DropEnum
DROP TYPE "AccountType";

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);
