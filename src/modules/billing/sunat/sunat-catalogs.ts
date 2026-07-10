// Catálogos SUNAT (subset operativo para el hotel).
// Porteo desde api-rest-s7/src/constants/sunatCatalogs.js.

export interface CatalogItem {
  factpro: number;
  sunat: string;
  descripcion: string;
}

export const TIPO_DOCUMENTO: CatalogItem[] = [
  { factpro: 1, sunat: '0', descripcion: 'DOC.TRIB.NO.DOM.SIN.RUC' },
  { factpro: 2, sunat: '1', descripcion: 'Documento Nacional de Identidad' },
  { factpro: 3, sunat: '4', descripcion: 'Carnet de extranjeria' },
  { factpro: 4, sunat: '6', descripcion: 'Registro Unico de Contribuyentes' },
  { factpro: 5, sunat: '7', descripcion: 'Pasaporte' },
];

export const AFECTACION_IGV = [
  { factpro: 1, sunat: '10', porcentaje: 18, descripcion: 'IGV' },
  { factpro: 20, sunat: '20', porcentaje: 0, descripcion: 'Exonerado' },
  { factpro: 21, sunat: '21', porcentaje: 0, descripcion: 'Exonerado - Transferencia gratuita' },
  { factpro: 30, sunat: '30', porcentaje: 0, descripcion: 'Inafecto' },
  { factpro: 40, sunat: '40', porcentaje: 0, descripcion: 'Exportacion de Bienes o Servicios' },
];

export const MONEDAS = [
  { nombre: 'Sol Peruano', codigo: 'PEN' },
  { nombre: 'Dolar', codigo: 'USD' },
  { nombre: 'Euro', codigo: 'EUR' },
];

export const UNIDADES = [
  { nombre: 'Unidad', codigo: 'NIU' },
  { nombre: 'Servicio', codigo: 'ZZ' },
  { nombre: 'Kilogramo', codigo: 'KGM' },
  { nombre: 'Litro', codigo: 'LTR' },
  { nombre: 'Hora', codigo: 'HUR' },
  { nombre: 'Dia', codigo: 'DAY' },
  { nombre: 'Caja', codigo: 'BX' },
  { nombre: 'Bolsa', codigo: 'BG' },
  { nombre: 'Botella', codigo: 'BO' },
];

// Código de tipo de operación (Catálogo 17). 0101 = Venta interna.
export const TIPO_OPERACION_VENTA_INTERNA = '0101';

// Código de tipo de precio (Catálogo 16). 01 = Precio inclusive de impuestos.
export const TIPO_PRECIO_INCLUYE_IGV = '01';

// IGV Perú.
export const IGV_PORCENTAJE = 18;
export const IGV_FACTOR = 1.18;

/**
 * Resuelve el código SUNAT (Catálogo 06) del tipo de documento del cliente.
 * 8 dígitos → '1' (DNI), 11 dígitos → '6' (RUC), default '0' (sin doc/no dom).
 */
export function resolveCustomerDocTypeCode(documentNumber: string): string {
  const clean = String(documentNumber ?? '').replace(/\D/g, '');
  if (clean.length === 8) return '1';
  if (clean.length === 11) return '6';
  return '0';
}

/**
 * Determina el tipo de comprobante según el documento del cliente.
 * RUC → '01' (Factura), cualquier otro → '03' (Boleta).
 */
export function resolveInvoiceTypeCode(documentNumber: string): string {
  const clean = String(documentNumber ?? '').replace(/\D/g, '');
  return clean.length === 11 ? '01' : '03';
}

/** Serie por defecto según tipo de comprobante. */
export function defaultSerieForType(invoiceType: string): string {
  switch (invoiceType) {
    case '01':
      return 'F001';
    case '03':
      return 'B001';
    case '07':
      return 'FC01'; // nota crédito sobre factura (se ajusta al tipo afectado en runtime)
    case '08':
      return 'FD01';
    default:
      return 'B001';
  }
}
