import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { BillingConfig } from '../billing.config';

const parser = new XMLParser({
  ignoreAttributes: false,
  removeNSPrefix: true,
});

export interface SunatResult {
  cdrBase64: string;
}

export interface SunatFaultError {
  sunatCode: string;
  faultcode: string;
  faultstring: string;
  message: string;
}

function parseSoapBody(xmlLike: string): any | null {
  if (!xmlLike || typeof xmlLike !== 'string') return null;
  try {
    const parsed = parser.parse(xmlLike);
    return parsed?.Envelope?.Body ?? null;
  } catch {
    return null;
  }
}

function buildSoapEnvelope(nombreZip: string, zipBase64: string): string {
  return `
    <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/"
        xmlns:ser="http://service.sunat.gob.pe">
      <soapenv:Header/>
      <soapenv:Body>
        <ser:sendBill>
          <fileName>${nombreZip}.zip</fileName>
          <contentFile>${zipBase64}</contentFile>
        </ser:sendBill>
      </soapenv:Body>
    </soapenv:Envelope>
  `;
}

function buildFaultError(body: any, status: number, statusText: string): SunatFaultError {
  const { faultcode, faultstring } = body?.Fault || {};
  const rawFaultcode = faultcode || 'SIN_CODIGO';
  const rawFaultstring = faultstring || 'SIN_DESCRIPCION';
  const codeMatch =
    /Client[.:]?\s*(\d+)/i.exec(rawFaultcode) ||
    /Client\s*-\s*(\d+)/i.exec(rawFaultcode);
  const parsedCode = codeMatch?.[1] || 'SIN_CODIGO';
  return {
    sunatCode: parsedCode,
    faultcode: rawFaultcode,
    faultstring: rawFaultstring,
    message: `SUNAT devolvio un error: ${rawFaultcode} - ${rawFaultstring}`,
  };
}

@Injectable()
export class SunatService {
  constructor(private readonly config: BillingConfig) {}

  /**
   * Envía el ZIP firmado a SUNAT (operación sendBill) y devuelve el CDR en base64.
   * Lanza un error estructurado si SUNAT rechaza (Fault) o hay fallo de red.
   */
  async sendBill(zipBase64: string, nombreZip: string): Promise<SunatResult> {
    if (!zipBase64) throw new Error('Falta el contenido del ZIP en base64');
    if (!nombreZip) throw new Error('Falta el nombre del ZIP a enviar');

    const soapBody = buildSoapEnvelope(nombreZip, zipBase64);
    const emisor = this.config.emisor;
    const auth =
      'Basic ' +
      Buffer.from(`${emisor.usuario_emisor}:${emisor.clave_emisor}`).toString('base64');

    let data: string;
    let status: number;
    let statusText: string;

    try {
      ({ data, status, statusText } = await axios.post(
        this.config.endpoint,
        soapBody,
        {
          headers: { 'Content-Type': 'text/xml', Authorization: auth },
          validateStatus: () => true,
        },
      ));
    } catch (err: any) {
      const responseData =
        typeof err?.response?.data === 'string'
          ? err.response.data
          : String(err?.response?.data || '');
      const parsedBody = parseSoapBody(responseData);
      if (parsedBody?.Fault) {
        const f = buildFaultError(parsedBody, err?.response?.status, err?.response?.statusText);
        const e = new Error(f.message);
        (e as any).sunatFault = f;
        throw e;
      }
      throw new Error(`No se pudo enviar a SUNAT: ${err.message}`);
    }

    const body = parseSoapBody(typeof data === 'string' ? data : String(data ?? ''));
    if (!body) {
      throw new Error(`Respuesta de SUNAT invalida (HTTP ${status})`);
    }
    if (body.Fault) {
      const f = buildFaultError(body, status, statusText);
      const e = new Error(f.message);
      (e as any).sunatFault = f;
      throw e;
    }
    if (Number(status) >= 400) {
      throw new Error(`SUNAT devolvio HTTP ${status} ${statusText}`);
    }

    const cdrBase64 = body.sendBillResponse?.applicationResponse;
    if (!cdrBase64) {
      throw new Error('SUNAT no devolvio el CDR esperado');
    }
    return { cdrBase64 };
  }
}
