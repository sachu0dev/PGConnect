-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aadhar" TEXT,
ADD COLUMN     "aadharImage" TEXT,
ADD COLUMN     "isOwner" BOOLEAN NOT NULL DEFAULT false;
