-- CreateTable
CREATE TABLE "callbackRequest" (
    "id" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "pgId" TEXT NOT NULL,

    CONSTRAINT "callbackRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "callbackRequest" ADD CONSTRAINT "callbackRequest_pgId_fkey" FOREIGN KEY ("pgId") REFERENCES "Pg"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
