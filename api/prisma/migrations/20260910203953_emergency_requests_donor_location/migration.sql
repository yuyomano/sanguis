-- CreateEnum
CREATE TYPE "EmergencyRequestStatus" AS ENUM ('OPEN', 'FULFILLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "address" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "notifications" ADD COLUMN     "emergencyRequestId" TEXT;

-- DropTable
DROP TABLE "emergency_alerts";

-- CreateTable
CREATE TABLE "emergency_requests" (
    "id" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'República Dominicana',
    "region" TEXT,
    "city" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "bloodType" "BloodType" NOT NULL,
    "productType" "ProductType" NOT NULL,
    "unitsNeeded" INTEGER NOT NULL DEFAULT 1,
    "urgencyLevel" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "requesterName" TEXT,
    "requesterPhone" TEXT,
    "status" "EmergencyRequestStatus" NOT NULL DEFAULT 'OPEN',
    "targetReachedCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "emergency_requests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_emergencyRequestId_fkey" FOREIGN KEY ("emergencyRequestId") REFERENCES "emergency_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;

