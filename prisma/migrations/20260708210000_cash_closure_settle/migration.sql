-- Cuadre de diferencia de cierre de caja.
-- Permite registrar un CashMovement compensatorio cuando la caja no cuadra,
-- dejando el turno cuadrado para el siguiente apertura.

-- AlterTable: CashClosure
ALTER TABLE "CashClosure" ADD COLUMN     "settled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "settledAt" TIMESTAMP(3),
ADD COLUMN     "settledById" INTEGER,
ADD COLUMN     "settleReason" TEXT,
ADD COLUMN     "settleCashMovementId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "CashClosure_settleCashMovementId_key"
  ON "CashClosure"("settleCashMovementId");

-- AddForeignKey
ALTER TABLE "CashClosure" ADD CONSTRAINT "CashClosure_settledById_fkey"
  FOREIGN KEY ("settledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CashClosure" ADD CONSTRAINT "CashClosure_settleCashMovementId_fkey"
  FOREIGN KEY ("settleCashMovementId") REFERENCES "CashMovement"("id") ON DELETE SET NULL ON UPDATE CASCADE;
