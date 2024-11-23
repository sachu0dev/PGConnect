/*
  Warnings:

  - Added the required column `bhk` to the `Pg` table without a default value. This is not possible if the table is not empty.
  - Added the required column `capacity` to the `Pg` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Pg` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Pg" ADD COLUMN     "bhk" INTEGER NOT NULL,
ADD COLUMN     "capacity" INTEGER NOT NULL,
ADD COLUMN     "capacityCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "images" TEXT[];
