-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "birthDate" TIMESTAMP(3),
ADD COLUMN     "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
