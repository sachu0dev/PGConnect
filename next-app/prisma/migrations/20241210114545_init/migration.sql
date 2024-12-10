-- CreateEnum
CREATE TYPE "Status" AS ENUM ('SENT', 'READ');

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'SENT';
