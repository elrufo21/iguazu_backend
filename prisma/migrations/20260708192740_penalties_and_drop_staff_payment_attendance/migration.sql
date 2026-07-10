/*
  Warnings:

  - You are about to drop the `StaffPaymentAttendance` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `grossAmount` to the `StaffPayment` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "PenaltyStatus" AS ENUM ('PENDING', 'APPLIED', 'VOIDED');

-- DropForeignKey
ALTER TABLE "StaffPaymentAttendance" DROP CONSTRAINT "StaffPaymentAttendance_attendanceId_fkey";

-- DropForeignKey
ALTER TABLE "StaffPaymentAttendance" DROP CONSTRAINT "StaffPaymentAttendance_staffPaymentId_fkey";

-- AlterTable
ALTER TABLE "StaffPayment" ADD COLUMN     "grossAmount" DECIMAL(10,2) NOT NULL,
ADD COLUMN     "penaltyAmount" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "StaffPaymentAttendance";

-- CreateTable
CREATE TABLE "Penalty" (
    "id" SERIAL NOT NULL,
    "employeeId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" "PenaltyStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Penalty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffPaymentPenalty" (
    "id" SERIAL NOT NULL,
    "staffPaymentId" INTEGER NOT NULL,
    "penaltyId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "StaffPaymentPenalty_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Penalty_employeeId_status_idx" ON "Penalty"("employeeId", "status");

-- CreateIndex
CREATE INDEX "StaffPaymentPenalty_staffPaymentId_idx" ON "StaffPaymentPenalty"("staffPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "StaffPaymentPenalty_penaltyId_key" ON "StaffPaymentPenalty"("penaltyId");

-- AddForeignKey
ALTER TABLE "Penalty" ADD CONSTRAINT "Penalty_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPaymentPenalty" ADD CONSTRAINT "StaffPaymentPenalty_staffPaymentId_fkey" FOREIGN KEY ("staffPaymentId") REFERENCES "StaffPayment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StaffPaymentPenalty" ADD CONSTRAINT "StaffPaymentPenalty_penaltyId_fkey" FOREIGN KEY ("penaltyId") REFERENCES "Penalty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
