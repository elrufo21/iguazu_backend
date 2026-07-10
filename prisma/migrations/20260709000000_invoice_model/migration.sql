-- Facturación electrónica SUNAT.

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('PENDING', 'ACCEPTED', 'OBSERVED', 'REJECTED', 'CANCELED');

-- CreateTable: Invoice
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "saleId" INTEGER,
    "invoiceType" TEXT NOT NULL,
    "serie" TEXT NOT NULL,
    "correlativo" INTEGER NOT NULL,
    "docNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "currency" TEXT NOT NULL DEFAULT 'PEN',
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "exemptAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "customerDocType" TEXT NOT NULL,
    "customerDocNumber" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'PENDING',
    "sunatCode" TEXT,
    "sunatDescription" TEXT,
    "cdrXml" TEXT,
    "signedXml" TEXT,
    "hash" TEXT,
    "affectedInvoiceId" INTEGER,
    "cancelReason" TEXT,
    "emittedById" INTEGER NOT NULL,
    "pdfBase64" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable: InvoiceCounter
CREATE TABLE "InvoiceCounter" (
    "serie" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceCounter_pkey" PRIMARY KEY ("serie")
);

-- Unique
CREATE UNIQUE INDEX "Invoice_saleId_key" ON "Invoice"("saleId");
CREATE UNIQUE INDEX "Invoice_docNumber_key" ON "Invoice"("docNumber");

-- Indexes
CREATE INDEX "Invoice_affectedInvoiceId_idx" ON "Invoice"("affectedInvoiceId");
CREATE INDEX "Invoice_emittedById_idx" ON "Invoice"("emittedById");
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");
CREATE INDEX "Invoice_serie_correlativo_idx" ON "Invoice"("serie", "correlativo");

-- ForeignKeys
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_saleId_fkey"
  FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_affectedInvoiceId_fkey"
  FOREIGN KEY ("affectedInvoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_emittedById_fkey"
  FOREIGN KEY ("emittedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
