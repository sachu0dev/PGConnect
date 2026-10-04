-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('ACTIVE', 'PAUSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "LeadType" AS ENUM ('CALLBACK', 'VISIT');

-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'CLOSED');

-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('FAKE_LISTING', 'WRONG_INFO', 'ALREADY_FULL', 'SCAM', 'OFFENSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('OPEN', 'RESOLVED', 'DISMISSED');

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_pgId_fkey";

-- DropForeignKey
ALTER TABLE "ChatRoom" DROP CONSTRAINT "ChatRoom_userId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_chatRoomId_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_senderId_fkey";

-- DropForeignKey
ALTER TABLE "Pg" DROP CONSTRAINT "Pg_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Subscription" DROP CONSTRAINT "Subscription_userId_fkey";

-- DropForeignKey
ALTER TABLE "callbackRequest" DROP CONSTRAINT "callbackRequest_pgId_fkey";

-- DropForeignKey
ALTER TABLE "callbackRequest" DROP CONSTRAINT "callbackRequest_userId_fkey";

-- AlterTable
ALTER TABLE "ChatRoom" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "ChatRoom" c SET "lastMessageAt" = m."maxCreated", "createdAt" = m."minCreated"
FROM (SELECT "chatRoomId", MAX("createdAt") AS "maxCreated", MIN("createdAt") AS "minCreated" FROM "Message" GROUP BY "chatRoomId") m
WHERE m."chatRoomId" = c."id";

-- AlterTable
ALTER TABLE "Pg" ADD COLUMN     "amenities" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "deposit" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "foodIncluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "houseRules" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "locality" TEXT,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "noticePeriodDays" INTEGER,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "sharingTypes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "status" "ListingStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "views" INTEGER NOT NULL DEFAULT 0;

-- Preserve existing listing data before dropping legacy columns
UPDATE "Pg"
SET "latitude"  = NULLIF(split_part("coordinates", ',', 1), '')::DOUBLE PRECISION,
    "longitude" = NULLIF(split_part("coordinates", ',', 2), '')::DOUBLE PRECISION
WHERE "coordinates" ~ '^\s*-?[0-9.]+\s*,\s*-?[0-9.]+\s*$';

UPDATE "Pg" SET "status" = 'PAUSED' WHERE "isAcceptingGuest" = false;

-- Dummy/demo listings are no longer supported
DELETE FROM "Message" WHERE "chatRoomId" IN (SELECT c."id" FROM "ChatRoom" c JOIN "Pg" p ON p."id" = c."pgId" WHERE p."isDummy" = true);
DELETE FROM "ChatRoom" WHERE "pgId" IN (SELECT "id" FROM "Pg" WHERE "isDummy" = true);
DELETE FROM "callbackRequest" WHERE "pgId" IN (SELECT "id" FROM "Pg" WHERE "isDummy" = true);
DELETE FROM "Pg" WHERE "isDummy" = true;

ALTER TABLE "Pg" DROP COLUMN "bhk",
DROP COLUMN "coordinates",
DROP COLUMN "isAcceptingGuest",
DROP COLUMN "isDummy";

-- Owners who previously submitted Aadhaar keep owner access; the raw Aadhaar number is purged below.

-- AlterTable
ALTER TABLE "Subscription" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "aadhar",
DROP COLUMN "aadharImage",
DROP COLUMN "adsCount",
ADD COLUMN     "isAdmin" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBanned" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "resetAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "resetCode" TEXT,
ADD COLUMN     "resetCodeExpireAt" TIMESTAMP(3),
ADD COLUMN     "verifyAttempts" INTEGER NOT NULL DEFAULT 0;


-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userAgent" TEXT,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerVerification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentLast4" TEXT NOT NULL,
    "documentKey" TEXT,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),

    CONSTRAINT "OwnerVerification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "type" "LeadType" NOT NULL DEFAULT 'CALLBACK',
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT,
    "phoneNumber" TEXT NOT NULL,
    "message" TEXT,
    "visitDate" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- Migrate legacy callback requests into leads (one per user per PG)
INSERT INTO "Lead" ("id", "type", "status", "phoneNumber", "userId", "pgId", "createdAt", "updatedAt")
SELECT DISTINCT ON ("pgId", "userId") "id", 'CALLBACK', 'NEW', "phoneNumber", "userId", "pgId", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "callbackRequest";

DROP TABLE "callbackRequest";

-- CreateTable
CREATE TABLE "Favorite" (
    "userId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("userId","pgId")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "userId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reason" "ReportReason" NOT NULL,
    "details" TEXT,
    "status" "ReportStatus" NOT NULL DEFAULT 'OPEN',
    "userId" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerVerification_userId_key" ON "OwnerVerification"("userId");

-- CreateIndex
CREATE INDEX "OwnerVerification_status_idx" ON "OwnerVerification"("status");

-- CreateIndex
CREATE INDEX "Lead_pgId_status_idx" ON "Lead"("pgId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Lead_pgId_userId_type_key" ON "Lead"("pgId", "userId", "type");

-- CreateIndex
CREATE INDEX "Favorite_pgId_idx" ON "Favorite"("pgId");

-- CreateIndex
CREATE INDEX "Review_pgId_createdAt_idx" ON "Review"("pgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Review_pgId_userId_key" ON "Review"("pgId", "userId");

-- CreateIndex
CREATE INDEX "Report_status_createdAt_idx" ON "Report"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Report_pgId_userId_key" ON "Report"("pgId", "userId");

-- CreateIndex
CREATE INDEX "ChatRoom_userId_lastMessageAt_idx" ON "ChatRoom"("userId", "lastMessageAt");

-- CreateIndex
CREATE INDEX "ChatRoom_pgId_lastMessageAt_idx" ON "ChatRoom"("pgId", "lastMessageAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRoom_pgId_userId_key" ON "ChatRoom"("pgId", "userId");

-- CreateIndex
CREATE INDEX "Message_chatRoomId_createdAt_idx" ON "Message"("chatRoomId", "createdAt");

-- CreateIndex
CREATE INDEX "Message_chatRoomId_status_idx" ON "Message"("chatRoomId", "status");

-- CreateIndex
CREATE INDEX "Pg_status_city_idx" ON "Pg"("status", "city");

-- CreateIndex
CREATE INDEX "Pg_status_rentPerMonth_idx" ON "Pg"("status", "rentPerMonth");

-- CreateIndex
CREATE INDEX "Pg_status_createdAt_idx" ON "Pg"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Pg_ownerId_idx" ON "Pg"("ownerId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OwnerVerification" ADD CONSTRAINT "OwnerVerification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pg" ADD CONSTRAINT "Pg_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "Pg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "Pg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "Pg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "Pg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "Pg"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRoom" ADD CONSTRAINT "ChatRoom_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_chatRoomId_fkey" FOREIGN KEY ("chatRoomId") REFERENCES "ChatRoom"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

