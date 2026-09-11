-- DropIndex
DROP INDEX "donors_email_key";

-- DropIndex
DROP INDEX "donors_idNumber_key";

-- AlterTable
ALTER TABLE "donors" ADD COLUMN     "emailHash" TEXT,
ADD COLUMN     "idNumberHash" TEXT,
ADD COLUMN     "phoneHash" TEXT,
ALTER COLUMN "latitude" SET DATA TYPE TEXT,
ALTER COLUMN "longitude" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "donors_idNumberHash_key" ON "donors"("idNumberHash");

-- CreateIndex
CREATE UNIQUE INDEX "donors_emailHash_key" ON "donors"("emailHash");

