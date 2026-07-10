/*
  Warnings:

  - You are about to drop the column `priceDay` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `priceHour` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `priceNight` on the `RoomType` table. All the data in the column will be lost.
  - You are about to drop the column `stayType` on the `Stay` table. All the data in the column will be lost.
  - Added the required column `priceTypeId` to the `Stay` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "RoomType" DROP COLUMN "priceDay",
DROP COLUMN "priceHour",
DROP COLUMN "priceNight";

-- AlterTable
ALTER TABLE "Stay" DROP COLUMN "stayType",
ADD COLUMN     "priceTypeId" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "StayType";

-- CreateTable
CREATE TABLE "PriceType" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PriceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomTypePrice" (
    "id" SERIAL NOT NULL,
    "roomTypeId" INTEGER NOT NULL,
    "priceTypeId" INTEGER NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomTypePrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RoomTypePrice_roomTypeId_idx" ON "RoomTypePrice"("roomTypeId");

-- CreateIndex
CREATE INDEX "RoomTypePrice_priceTypeId_idx" ON "RoomTypePrice"("priceTypeId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomTypePrice_roomTypeId_priceTypeId_key" ON "RoomTypePrice"("roomTypeId", "priceTypeId");

-- CreateIndex
CREATE INDEX "Stay_priceTypeId_idx" ON "Stay"("priceTypeId");

-- AddForeignKey
ALTER TABLE "RoomTypePrice" ADD CONSTRAINT "RoomTypePrice_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomTypePrice" ADD CONSTRAINT "RoomTypePrice_priceTypeId_fkey" FOREIGN KEY ("priceTypeId") REFERENCES "PriceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stay" ADD CONSTRAINT "Stay_priceTypeId_fkey" FOREIGN KEY ("priceTypeId") REFERENCES "PriceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
