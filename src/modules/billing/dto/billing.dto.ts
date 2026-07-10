import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Emisión de comprobante desde una venta pagada.
 * Si se omite invoiceType, se infiere del documento del cliente
 * (RUC → factura 01, DNI → boleta 03).
 */
export class IssueFromSaleDto {
  @IsString()
  @IsOptional()
  @IsIn(['01', '03'])
  invoiceType?: '01' | '03';
}

export class IssueCreditNoteDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(280)
  reason!: string;
}
