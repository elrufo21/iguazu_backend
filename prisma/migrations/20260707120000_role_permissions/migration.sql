-- Normalize previous drift: these columns already exist in some dev databases.
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "invoiceType" TEXT DEFAULT 'TICKET';
ALTER TABLE "Sale" ADD COLUMN IF NOT EXISTS "invoiceNumber" TEXT;

CREATE TABLE IF NOT EXISTS "RolePermission" (
    "id" SERIAL NOT NULL,
    "role" "UserRole" NOT NULL,
    "permission" TEXT NOT NULL,
    "allowed" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RolePermission_role_permission_key" ON "RolePermission"("role", "permission");
CREATE INDEX IF NOT EXISTS "RolePermission_role_idx" ON "RolePermission"("role");
