/*
  Warnings:

  - The values [BOTH] on the enum `Gender` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `Coordinates` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `coordinates` to the `Pg` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Gender_new" AS ENUM ('MALE', 'FEMALE', 'ANY');
ALTER TABLE "Pg" ALTER COLUMN "gender" TYPE "Gender_new" USING ("gender"::text::"Gender_new");
ALTER TYPE "Gender" RENAME TO "Gender_old";
ALTER TYPE "Gender_new" RENAME TO "Gender";
DROP TYPE "Gender_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "Coordinates" DROP CONSTRAINT "Coordinates_pgId_fkey";

-- AlterTable
ALTER TABLE "Pg" ADD COLUMN     "coordinates" TEXT NOT NULL;

-- DropTable
DROP TABLE "Coordinates";
