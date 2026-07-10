-- Unidad de medida + factor de conversión en Product.
-- Permite comprar en paquetes/cajas y vender por unidad.
ALTER TABLE "Product" ADD COLUMN "unit" TEXT NOT NULL DEFAULT 'UNIDAD',
ADD COLUMN "purchaseFactor" INTEGER NOT NULL DEFAULT 1;
