import { Injectable } from '@nestjs/common';
import AdmZip from 'adm-zip';

@Injectable()
export class ZipService {
  /**
   * Crea un ZIP en memoria que contiene un único .xml.
   * Devuelve el buffer del ZIP.
   */
  makeZip(filename: string, xml: string): Buffer {
    const zip = new AdmZip();
    zip.addFile(`${filename}.xml`, Buffer.from(xml, 'utf8'));
    return zip.toBuffer();
  }

  /**
   * Devuelve el ZIP como base64 (formato que espera el SOAP de SUNAT).
   */
  makeZipBase64(filename: string, xml: string): string {
    return this.makeZip(filename, xml).toString('base64');
  }
}
