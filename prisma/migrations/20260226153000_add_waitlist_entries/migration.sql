-- CreateEnum
CREATE TYPE "WaitlistEntryStatus" AS ENUM ('ACTIVE', 'FULFILLED', 'CANCELED', 'EXPIRED');

-- CreateTable
CREATE TABLE "WaitlistEntry" (
    "id" TEXT NOT NULL,
    "barbershopId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "barberId" TEXT NOT NULL,
    "dateDay" TIMESTAMPTZ NOT NULL,
    "status" "WaitlistEntryStatus" NOT NULL DEFAULT 'ACTIVE',
    "fulfilledBookingId" TEXT,
    "fulfilledSeenAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistEntry_barbershopId_idx" ON "WaitlistEntry"("barbershopId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_idx" ON "WaitlistEntry"("userId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_serviceId_idx" ON "WaitlistEntry"("serviceId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_barberId_idx" ON "WaitlistEntry"("barberId");

-- CreateIndex
CREATE INDEX "WaitlistEntry_barbershopId_dateDay_serviceId_barberId_status_createdAt_id_idx"
ON "WaitlistEntry"("barbershopId", "dateDay", "serviceId", "barberId", "status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "WaitlistEntry_userId_status_fulfilledSeenAt_createdAt_idx"
ON "WaitlistEntry"("userId", "status", "fulfilledSeenAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_fulfilledBookingId_key" ON "WaitlistEntry"("fulfilledBookingId");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistEntry_userId_barbershopId_dateDay_serviceId_barberId_active_key"
ON "WaitlistEntry"("userId", "barbershopId", "dateDay", "serviceId", "barberId")
WHERE ("status" = 'ACTIVE');

-- AddForeignKey
ALTER TABLE "WaitlistEntry"
ADD CONSTRAINT "WaitlistEntry_barbershopId_fkey"
FOREIGN KEY ("barbershopId")
REFERENCES "Barbershop"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry"
ADD CONSTRAINT "WaitlistEntry_userId_fkey"
FOREIGN KEY ("userId")
REFERENCES "user"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry"
ADD CONSTRAINT "WaitlistEntry_serviceId_fkey"
FOREIGN KEY ("serviceId")
REFERENCES "BarbershopService"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry"
ADD CONSTRAINT "WaitlistEntry_barberId_fkey"
FOREIGN KEY ("barberId")
REFERENCES "Barber"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WaitlistEntry"
ADD CONSTRAINT "WaitlistEntry_fulfilledBookingId_fkey"
FOREIGN KEY ("fulfilledBookingId")
REFERENCES "Booking"("id")
ON DELETE SET NULL
ON UPDATE CASCADE;
