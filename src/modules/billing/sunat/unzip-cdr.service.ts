import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

const parser = new XMLParser({ ignoreAttributes: false });

export interface CdrResult {
  success: boolean;
  message?: string;
  xmlContent?: string;
  responseCode?: string; // '0' = aceptado, '2xxx' = observado, otros = rechazado
  description?: string;
  date: string;
}

/**
 * Descomprime el CDR (constancia de recepción) devuelto por SUNAT y extrae
 * el ResponseCode y la Description del ApplicationResponse.
 */
@Injectable()
export class UnzipCdrService {
  unzip(cdrBase64: string): CdrResult {
    if (!cdrBase64) {
      return { success: false, message: 'No se recibio el CDR en base64', date: new Date().toISOString() };
    }

    const zipBuffer = Buffer.from(cdrBase64, 'base64');
    const zip = new AdmZip(zipBuffer);
    const cdrEntry = zip
      .getEntries()
      .find((entry) => entry.entryName.endsWith('.xml'));

    if (!cdrEntry) {
      return {
        success: false,
        message: 'El CDR no contiene un XML',
        date: new Date().toISOString(),
      };
    }

    const xmlContent = cdrEntry.getData().toString('utf8');
    const json = parser.parse(xmlContent);
    const appResponse = json['ar:ApplicationResponse'] || json.ApplicationResponse;

    if (!appResponse) {
      return {
        success: false,
        message: 'No se encontro ApplicationResponse en el CDR',
        xmlContent,
        date: new Date().toISOString(),
      };
    }

    const docResponse = appResponse['cac:DocumentResponse'] || {};
    const response = docResponse['cac:Response'] || {};
    const responseCode = response['cbc:ResponseCode'];
    const description = response['cbc:Description'];

    return {
      success: true,
      xmlContent,
      responseCode: responseCode !== undefined ? String(responseCode) : undefined,
      description: description !== undefined ? String(description) : undefined,
      date: new Date().toISOString(),
    };
  }
}
