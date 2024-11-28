/*
  Warnings:

  - You are about to drop the column `username` on the `callbackRequest` table. All the data in the column will be lost.
  - Added the required column `userId` to the `callbackRequest` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "callbackRequest" DROP COLUMN "username",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "callbackRequest" ADD CONSTRAINT "callbackRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
