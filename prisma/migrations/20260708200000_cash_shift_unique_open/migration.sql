-- Índice parcial único: un usuario solo puede tener una caja abierta a la vez.
-- Evita race condition en apertura simultánea (dos pestañas / doble click).
-- Solo aplica a status = OPEN: las cajas cerradas pueden coexistir.
CREATE UNIQUE INDEX IF NOT EXISTS "CashShift_openedById_status_OPEN_key"
  ON "CashShift"("openedById")
  WHERE "status" = 'OPEN';
