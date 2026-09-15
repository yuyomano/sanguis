-- CreateEnum
CREATE TYPE "InstitutionType" AS ENUM ('BLOOD_BANK', 'HOSPITAL', 'THIRD_PARTY_EVENT');

-- CreateEnum
CREATE TYPE "DonationReporter" AS ENUM ('DONOR_SELF', 'INSTITUTION', 'ADMIN');

-- CreateEnum
CREATE TYPE "ExternalDonationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- AlterEnum
ALTER TYPE "AdminRole" ADD VALUE 'INSTITUTION';

-- AlterEnum
ALTER TYPE "PointTransactionType" ADD VALUE 'EXTERNAL_DONATION';

-- AlterTable
ALTER TABLE "admin_users" ADD COLUMN     "institutionId" TEXT;

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "shareHistoryWithInstitutions" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "partner_institutions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "InstitutionType" NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "partner_institutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "external_donations" (
    "id" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "donationDate" TIMESTAMP(3) NOT NULL,
    "productType" "ProductType" NOT NULL DEFAULT 'WHOLE_BLOOD',
    "sourceType" "InstitutionType" NOT NULL,
    "sourceName" TEXT NOT NULL,
    "institutionId" TEXT,
    "reportedBy" "DonationReporter" NOT NULL,
    "status" "ExternalDonationStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "notes" TEXT,
    "pointsAwarded" INTEGER,
    "verifiedById" TEXT,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "external_donations_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "partner_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_donations" ADD CONSTRAINT "external_donations_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "donors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "external_donations" ADD CONSTRAINT "external_donations_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "partner_institutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

